import { notifySupportTicketCreated, notifySupportTicketReply } from './telegram';
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import crypto from "node:crypto";
import { checkRateLimit, resetRateLimit } from "./rateLimit";
import { generateAiProductImage, assignAiImageToProduct } from "./aiImage";
import { processCustomerQuery } from "./customerAssistant";
import { normalizeIndianPhone, isValidIndianPhone, generateSecureOtp, hashOtp, sendOtpSms } from "./smsService";
import { sanitizeHtml } from "./sanitize";

// In-memory duplicate submission cache for B2B enquiries (60s cooldown)
const recentEnquiriesStore = new Map<string, number>();
function isDuplicateEnquiry(key: string, cooldownMs = 60000): boolean {
  const now = Date.now();
  for (const [k, ts] of recentEnquiriesStore.entries()) {
    if (now - ts > cooldownMs * 2) recentEnquiriesStore.delete(k);
  }
  const last = recentEnquiriesStore.get(key);
  if (last && now - last < cooldownMs) {
    return true;
  }
  recentEnquiriesStore.set(key, now);
  return false;
}


export const appRouter = router({
  system: systemRouter,

  // ==========================================
  // STORE SETTINGS & CONFIGURATION (PHASE 5)
  // ==========================================
  settings: router({
    getMinimumCod: publicProcedure.query(async () => {
      return { minimumCodOrderValue: db.siteContentRepo.getMinimumCodOrderValue() };
    }),
    getLowStockThreshold: publicProcedure.query(async () => {
      return { threshold: db.siteContentRepo.getLowStockThreshold() };
    }),
  }),

  // ==========================================
  // AUTHENTICATION ROUTER
  // ==========================================
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const user = db.usersRepo.getById(String(ctx.user.id));
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
      };
    }),

    register: publicProcedure
      .input(
        z
          .object({
            email: z.string().email("Please enter a valid email address"),
            password: z.string().min(6, "Password must be at least 6 characters"),
            confirmPassword: z.string().optional(),
            name: z.string().min(2, "Name must be at least 2 characters"),
            phone: z.string().optional(),
            guestToken: z.string().optional(),
          })
          .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
            message: "Passwords do not match",
            path: ["confirmPassword"],
          })
      )
      .mutation(async ({ input, ctx }) => {
        const clientIp = (ctx.req?.headers?.["x-forwarded-for"] as string) || ctx.req?.socket?.remoteAddress || "ip_anon";
        const rateCheck = checkRateLimit(`reg_${clientIp}`, 10, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many registration attempts. Please try again later.",
          });
        }

        const existing = db.usersRepo.getByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in.",
          });
        }

        const user = db.usersRepo.create({
          email: input.email,
          password: input.password,
          name: input.name,
          phone: input.phone || "",
          role: "CUSTOMER",
        });

        // Merge guest cart if provided
        if (input.guestToken) {
          db.cartRepo.mergeGuestCart(input.guestToken, user.id);
        }

        // Issue session JWT
        const token = await sdk.signSession({
          openId: user.id,
          appId: ENV.appId,
          name: user.name,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
          },
          token,
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Please enter a valid email address"),
          password: z.string(),
          guestToken: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientIp = (ctx.req?.headers?.["x-forwarded-for"] as string) || ctx.req?.socket?.remoteAddress || "ip_anon";
        const rateCheck = checkRateLimit(`login_${clientIp}_${input.email.toLowerCase()}`, 10, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many failed login attempts. Please wait 15 minutes and try again.",
          });
        }

        const user = db.usersRepo.getByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        const valid = db.verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        resetRateLimit(`login_${clientIp}_${input.email.toLowerCase()}`);

        if (user.status === "SUSPENDED" || user.status === "INACTIVE" || user.status === "DEACTIVATED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account has been deactivated. Please contact support@trinayaa.in.",
          });
        }

        // Merge guest cart if provided
        if (input.guestToken) {
          db.cartRepo.mergeGuestCart(input.guestToken, user.id);
        }

        // Issue session JWT
        const token = await sdk.signSession({
          openId: user.id,
          appId: ENV.appId,
          name: user.name,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
          },
          token,
        };
      }),

        requestOtp: publicProcedure
      .input(
        z.object({
          phone: z.string().min(8, "Please enter a valid phone number"),
          purpose: z.enum(["LOGIN", "REGISTER"]).optional().default("LOGIN"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientIp = (ctx.req?.headers?.["x-forwarded-for"] as string) || ctx.req?.socket?.remoteAddress || "ip_anon";
        const normalized = normalizeIndianPhone(input.phone);
        if (!isValidIndianPhone(normalized)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
          });
        }

        // Rate limit: max 5 requests per 10 mins per IP and per phone
        const ipLimit = checkRateLimit(`otp_ip_${clientIp}`, 5, 10 * 60 * 1000);
        if (!ipLimit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many OTP requests from this device. Please try again after 10 minutes.",
          });
        }

        const recentRequests = db.authOtpsRepo.countRecentRequests(normalized, 600);
        if (recentRequests >= 5) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many OTP requests for this mobile number. Please try again after 10 minutes.",
          });
        }

        // 60-second cooldown check
        const lastTime = db.authOtpsRepo.getLastRequestTime(normalized, input.purpose);
        const elapsed = (Date.now() - lastTime) / 1000;
        if (lastTime > 0 && elapsed < 60) {
          const waitSecs = Math.ceil(60 - elapsed);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Please wait ${waitSecs} seconds before requesting a new verification code.`,
          });
        }

        // Generate cryptographically secure OTP & SHA-256 hash
        const otp = generateSecureOtp();
        const otpHash = hashOtp(otp);

        // Store hash in SQLite with 5 min (300s) expiry
        db.authOtpsRepo.create(normalized, otpHash, input.purpose, 300);

        // Dispatch SMS via provider or safe dev simulator
        const smsResult = await sendOtpSms(normalized, otp, input.purpose);

        return {
          success: true,
          message: smsResult.message,
          resendCooldownSeconds: 60,
          isTestMode: smsResult.isTestMode,
          devOtp: smsResult.devOtp,
        };
      }),

    verifyOtp: publicProcedure
      .input(
        z.object({
          phone: z.string().min(8),
          otp: z.string().min(4, "Please enter the verification code"),
          purpose: z.enum(["LOGIN", "REGISTER"]).optional().default("LOGIN"),
          name: z.string().optional(),
          guestToken: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientIp = (ctx.req?.headers?.["x-forwarded-for"] as string) || ctx.req?.socket?.remoteAddress || "ip_anon";
        const normalized = normalizeIndianPhone(input.phone);
        if (!isValidIndianPhone(normalized)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid 10-digit Indian mobile number.",
          });
        }

        // Rate limit verification attempts by IP
        const ipLimit = checkRateLimit(`otp_verify_ip_${clientIp}`, 15, 10 * 60 * 1000);
        if (!ipLimit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many verification attempts. Please wait a few minutes.",
          });
        }

        const activeOtp = db.authOtpsRepo.getLatestActive(normalized, input.purpose);
        if (!activeOtp) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Verification code is invalid or has expired. Please request a new code.",
          });
        }

        if (activeOtp.attempts >= 5) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Maximum verification attempts exceeded. Please request a new code.",
          });
        }

        // Constant-time hash verification
        const suppliedHash = hashOtp(input.otp);
        const storedHashBuf = Buffer.from(activeOtp.otp_hash, "hex");
        const suppliedHashBuf = Buffer.from(suppliedHash, "hex");

        let isValid = false;
        try {
          isValid = storedHashBuf.length === suppliedHashBuf.length && crypto.timingSafeEqual(storedHashBuf, suppliedHashBuf);
        } catch {
          isValid = false;
        }

        if (!isValid) {
          const updated = db.authOtpsRepo.incrementAttempts(activeOtp.id);
          const remaining = Math.max(0, 5 - updated.attempts);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
          });
        }

        // Mark OTP as verified (cannot be reused)
        db.authOtpsRepo.markVerified(activeOtp.id);

        // Find or create customer
        let user = db.usersRepo.getByPhone(normalized);
        if (!user) {
          user = db.usersRepo.createFromOtp({
            phone: normalized,
            name: input.name,
          });
        } else if (user.status === "SUSPENDED" || user.status === "INACTIVE" || user.status === "DEACTIVATED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account has been deactivated. Please contact support@trinayaa.in.",
          });
        }

        // Merge guest cart if present
        if (input.guestToken) {
          db.cartRepo.mergeGuestCart(input.guestToken, user.id);
        }

        // Issue session JWT
        const token = await sdk.signSession({
          openId: user.id,
          appId: ENV.appId,
          name: user.name,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
          },
          token,
        };
      }),

    adminLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = db.usersRepo.getByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials.",
          });
        }

        const valid = db.verifyPassword(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials.",
          });
        }

        const role = (user.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied. Administrator privileges required.",
          });
        }

        // Issue session JWT
        const token = await sdk.signSession({
          openId: user.id,
          appId: ENV.appId,
          name: user.name,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 24 * 60 * 60 * 1000,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updated = db.usersRepo.update(String(ctx.user.id), input);
        return { success: true, user: updated };
      }),

    changePassword: protectedProcedure
      .input(
        z.object({
          oldPassword: z.string(),
          newPassword: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = db.usersRepo.getByEmail(ctx.user.email || "");
        if (!user || !db.verifyPassword(input.oldPassword, user.passwordHash)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Current password is incorrect.",
          });
        }
        db.usersRepo.update(user.id, { password: input.newPassword });
        return { success: true, message: "Password updated successfully." };
      }),
  }),

  // ==========================================
  // PRODUCTS ROUTER (CUSTOMER & PUBLIC)
  // ==========================================
  products: router({
    list: publicProcedure
      .input(
        z
          .object({
            category: z.string().optional(),
            search: z.string().optional(),
            sort: z.string().optional(),
            limit: z.number().optional().default(100),
            offset: z.number().optional().default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const raw = db.productsRepo.getAll(input || {});
        return raw.map((p: any) => db.sanitizePublicProduct(p));
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = db.productsRepo.getBySlug(input.slug);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found.",
          });
        }
        return db.sanitizePublicProduct(product);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const product = db.productsRepo.getById(input.id);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found.",
          });
        }
        return db.sanitizePublicProduct(product);
      }),

    getBySku: publicProcedure
      .input(z.object({ sku: z.string() }))
      .query(async ({ input }) => {
        const product = db.productsRepo.getBySku(input.sku);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found.",
          });
        }
        return db.sanitizePublicProduct(product);
      }),

    getRelated: publicProcedure
      .input(
        z.object({
          categoryId: z.string().optional(),
          excludeId: z.string().optional(),
          limit: z.number().optional().default(4),
        })
      )
      .query(async ({ input }) => {
        const rel = db.productsRepo.getRelated(input.categoryId, input.excludeId, input.limit);
        return rel.map((p: any) => db.sanitizePublicProduct(p));
      }),

    getFeatured: publicProcedure.query(async () => {
      const feat = db.productsRepo.getAll({ limit: 12 });
      return feat.map((p: any) => db.sanitizePublicProduct(p));
    }),
  }),

  // ==========================================
  // CATEGORIES ROUTER
  // ==========================================
  categories: router({
    list: publicProcedure.query(async () => {
      return db.categoriesRepo.getAll();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.categoriesRepo.getBySlug(input.slug);
      }),
  }),

  // ==========================================
  // CART ROUTER (GUEST & PERSISTENT)
  // ==========================================
  cart: router({
    get: publicProcedure
      .input(z.object({ guestToken: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user ? String(ctx.user.id) : undefined;
        return db.cartRepo.getOrCreate(userId, input?.guestToken);
      }),

    add: publicProcedure
      .input(
        z.object({
          guestToken: z.string().optional(),
          productId: z.string(),
          packSize: z.string(),
          unitPrice: z.number().optional(),
          quantity: z.number().optional().default(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const userId = ctx.user ? String(ctx.user.id) : undefined;
          const cart = db.cartRepo.getOrCreate(userId, input.guestToken);
          const items = db.cartRepo.addItem(
            cart.id,
            input.productId,
            input.packSize,
            input.unitPrice,
            input.quantity
          );
          return { cartId: cart.id, items };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.message || "Failed to add item to cart",
          });
        }
      }),

    update: publicProcedure
      .input(
        z.object({
          guestToken: z.string().optional(),
          productId: z.string(),
          packSize: z.string(),
          quantity: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const userId = ctx.user ? String(ctx.user.id) : undefined;
          const cart = db.cartRepo.getOrCreate(userId, input.guestToken);
          const items = db.cartRepo.updateItem(
            cart.id,
            input.productId,
            input.packSize,
            input.quantity
          );
          return { cartId: cart.id, items };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.message || "Failed to update item in cart",
          });
        }
      }),

    remove: publicProcedure
      .input(
        z.object({
          guestToken: z.string().optional(),
          productId: z.string(),
          packSize: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user ? String(ctx.user.id) : undefined;
        const cart = db.cartRepo.getOrCreate(userId, input.guestToken);
        const items = db.cartRepo.removeItem(cart.id, input.productId, input.packSize);
        return { cartId: cart.id, items };
      }),

    clear: publicProcedure
      .input(z.object({ guestToken: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user ? String(ctx.user.id) : undefined;
        const cart = db.cartRepo.getOrCreate(userId, input.guestToken);
        db.cartRepo.clear(cart.id);
        return { success: true };
      }),

    mergeGuestCart: protectedProcedure
      .input(z.object({ guestToken: z.string() }))
      .mutation(async ({ input, ctx }) => {
        db.cartRepo.mergeGuestCart(input.guestToken, String(ctx.user.id));
        return { success: true };
      }),

    validateCoupon: publicProcedure
      .input(
        z.object({
          code: z.string().min(1),
          subtotal: z.number().min(0),
        })
      )
      .query(async ({ input }) => {
        return db.campaignsRepo.validateCoupon(input.code, input.subtotal);
      }),
  }),

  // ==========================================
  // CUSTOMER ADDRESSES ROUTER
  // ==========================================
    // ==========================================
  // CUSTOMER ACCOUNT MANAGEMENT ROUTER
  // ==========================================
  account: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = db.usersRepo.getById(String(ctx.user.id));
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User account not found." });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      };
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
          phone: z.string().trim().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let cleanPhone = input.phone;
        if (cleanPhone) {
          cleanPhone = normalizeIndianPhone(cleanPhone);
          if (!isValidIndianPhone(cleanPhone)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Please enter a valid 10-digit Indian mobile number.",
            });
          }
        }
        const updated = db.usersRepo.update(String(ctx.user.id), {
          name: input.name,
          phone: cleanPhone,
        });
        return {
          success: true,
          message: "Profile updated successfully.",
          user: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
          },
        };
      }),

    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string(),
          newPassword: z.string().min(6, "New password must be at least 6 characters"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = db.usersRepo.getByEmail(ctx.user.email || "");
        if (!user || !db.verifyPassword(input.currentPassword, user.passwordHash)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Current password is incorrect.",
          });
        }
        db.usersRepo.updatePassword(user.id, input.newPassword);
        return { success: true, message: "Password updated successfully." };
      }),

    listAddresses: protectedProcedure.query(async ({ ctx }) => {
      return db.addressesRepo.getByUserId(String(ctx.user.id));
    }),

    createAddress: protectedProcedure
      .input(
        z.object({
          recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
          phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
          addressLine1: z.string().min(3, "House / building number & street is required"),
          addressLine2: z.string().optional(),
          street: z.string().optional(),
          landmark: z.string().optional(),
          city: z.string().min(2, "City is required"),
          district: z.string().optional(),
          state: z.string().min(2, "State is required").default("Tamil Nadu"),
          pinCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit Indian PIN code"),
          addressType: z.enum(["Home", "Work", "Other"]).default("Home"),
          isDefault: z.boolean().optional().default(false),
          deliveryInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.addressesRepo.create(String(ctx.user.id), input);
      }),

    updateAddress: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          recipientName: z.string().min(2).optional(),
          phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/).optional(),
          addressLine1: z.string().min(3).optional(),
          addressLine2: z.string().optional(),
          landmark: z.string().optional(),
          city: z.string().min(2).optional(),
          district: z.string().optional(),
          state: z.string().min(2).optional(),
          pinCode: z.string().regex(/^\d{6}$/).optional(),
          addressType: z.enum(["Home", "Work", "Other"]).optional(),
          isDefault: z.boolean().optional(),
          deliveryInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updated = db.addressesRepo.update(input.id, String(ctx.user.id), input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found or permission denied." });
        return updated;
      }),

    deleteAddress: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const deleted = db.addressesRepo.delete(input.id, String(ctx.user.id));
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found or permission denied." });
        return { success: true };
      }),

    setDefaultAddress: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const updated = db.addressesRepo.setDefault(input.id, String(ctx.user.id));
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found." });
        return updated;
      }),

    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.ordersRepo.getCustomerOrders(String(ctx.user.id));
    }),
  }),

addresses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.addressesRepo.getByUserId(String(ctx.user.id));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const addr = db.addressesRepo.getById(input.id, String(ctx.user.id));
        if (!addr) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found." });
        return addr;
      }),

    create: protectedProcedure
      .input(
        z.object({
          recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
          phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
          addressLine1: z.string().min(3, "Address line 1 is required"),
          addressLine2: z.string().optional(),
          street: z.string().optional(),
          landmark: z.string().optional(),
          city: z.string().min(2, "City is required"),
          district: z.string().optional(),
          state: z.string().min(2, "State is required").default("Tamil Nadu"),
          pinCode: z.string().regex(/^\d{6}$/, "Please enter a valid 6-digit Indian PIN code"),
          addressType: z.enum(["Home", "Work", "Other"]).default("Home"),
          isDefault: z.boolean().optional().default(false),
          deliveryInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.addressesRepo.create(String(ctx.user.id), input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          recipientName: z.string().min(2).optional(),
          phone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/).optional(),
          addressLine1: z.string().min(3).optional(),
          addressLine2: z.string().optional(),
          landmark: z.string().optional(),
          city: z.string().min(2).optional(),
          district: z.string().optional(),
          state: z.string().min(2).optional(),
          pinCode: z.string().regex(/^\d{6}$/).optional(),
          addressType: z.enum(["Home", "Work", "Other"]).optional(),
          isDefault: z.boolean().optional(),
          deliveryInstructions: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updated = db.addressesRepo.update(input.id, String(ctx.user.id), input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found or permission denied." });
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const deleted = db.addressesRepo.delete(input.id, String(ctx.user.id));
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found or permission denied." });
        return { success: true };
      }),

    setDefault: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const updated = db.addressesRepo.setDefault(input.id, String(ctx.user.id));
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Address not found." });
        return updated;
      }),
  }),

  // ==========================================
  // ORDERS & CHECKOUT ROUTER
  // ==========================================
  orders: router({
    calculateSummary: publicProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.string(),
              packSize: z.string(),
              quantity: z.number().min(1),
            })
          ).min(1, "Cart cannot be empty"),
          couponCode: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        let subtotal = 0;
        const calculatedItems: any[] = [];
        const stockIssues: string[] = [];

        for (const item of input.items) {
          const product = db.productsRepo.getById(item.productId);
          if (!product) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Product ${item.productId} was not found.`,
            });
          }

          if (product.stock < item.quantity) {
            stockIssues.push(`Only ${product.stock} units available for ${product.nameEn}.`);
          }

          const matchedSize = product.sizes?.find((s: any) => s.label === item.packSize);
          const unitPrice = matchedSize ? matchedSize.price : product.price;
          const lineTotal = unitPrice * item.quantity;
          subtotal += lineTotal;

          calculatedItems.push({
            productId: product.id,
            sku: product.sku,
            nameEn: product.nameEn,
            nameTa: product.nameTa,
            packSize: item.packSize,
            unitPrice,
            quantity: item.quantity,
            lineTotal,
            availableStock: product.stock,
            image: product.image,
          });
        }

        let discountAmount = 0;
        let couponDetails: any = null;

        if (input.couponCode && input.couponCode.trim()) {
          const res = db.campaignsRepo.validateCoupon(input.couponCode.trim(), subtotal);
          couponDetails = res;
          if (res.valid) {
            discountAmount = res.discountAmount || 0;
          }
        }

        // Free shipping at or above ₹799, otherwise ₹60 standard shipping
        const shippingFee = subtotal >= 799 ? 0 : 60;
        const total = Math.max(0, subtotal - discountAmount + shippingFee);

        return {
          subtotal,
          discountAmount,
          shippingFee,
          total,
          items: calculatedItems,
          coupon: couponDetails,
          stockIssues,
          canCheckout: stockIssues.length === 0,
        };
      }),

    create: protectedProcedure
      .input(
        z.object({
          customerName: z.string().min(2, "Customer name is required"),
          customerEmail: z.string().email("Valid customer email is required"),
          customerPhone: z.string().regex(/^(?:\+91)?[6-9]\d{9}$/, "Valid 10-digit mobile number required"),
          shippingAddress: z.object({
            addressLine1: z.string().optional(),
            addressLine2: z.string().optional(),
            landmark: z.string().optional(),
            street: z.string().min(3, "Street/Address is required"),
            city: z.string().min(2, "City is required"),
            state: z.string().min(2, "State is required").default("Tamil Nadu"),
            pinCode: z.string().regex(/^\d{6}$/, "Valid 6-digit Indian PIN code required"),
            district: z.string().optional(),
            addressType: z.string().optional().default("Home"),
            deliveryInstructions: z.string().optional(),
          }),
          items: z.array(
            z.object({
              productId: z.string(),
              packSize: z.string(),
              quantity: z.number().min(1),
            })
          ).min(1, "Cart cannot be empty"),
          couponCode: z.string().optional(),
          paymentMethod: z.enum(["RAZORPAY", "UPI", "COD"]).default("RAZORPAY"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Recalculate prices strictly on server from DB
        let subtotal = 0;
        const orderItemsData: any[] = [];

        for (const item of input.items) {
          const product = db.productsRepo.getById(item.productId);
          if (!product) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Product ${item.productId} is no longer available.`,
            });
          }

          if (product.stock < item.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Insufficient stock for ${product.nameEn}. Requested: ${item.quantity}, Available: ${product.stock}`,
            });
          }

          // Find exact variant price
          const matchedSize = product.sizes?.find((s: any) => s.label === item.packSize);
          const unitPrice = matchedSize ? matchedSize.price : product.price;

          subtotal += unitPrice * item.quantity;
          orderItemsData.push({
            productId: product.id,
            productNameEn: product.nameEn,
            productNameTa: product.nameTa,
            packSize: item.packSize,
            price: unitPrice,
            quantity: item.quantity,
            image: product.image,
          });
        }

        // 2. Calculate discounts from coupon if provided
        let discountAmount = 0;
        let appliedCouponCode: string | undefined = undefined;
        if (input.couponCode && input.couponCode.trim()) {
          const couponResult = db.campaignsRepo.validateCoupon(input.couponCode.trim(), subtotal);
          if (couponResult.valid) {
            discountAmount = couponResult.discountAmount || 0;
            appliedCouponCode = input.couponCode.trim().toUpperCase();
          }
        }

        // 3. Pan-India shipping: Free delivery on orders above ₹799, otherwise ₹60
        const shippingFee = subtotal >= 799 ? 0 : 60;
        const total = Math.max(0, subtotal - discountAmount + shippingFee);

                // Validate COD Eligibility strictly on server
        if (input.paymentMethod === "COD") {
          const codCheck = db.checkOrderCodEligibility(input.items, subtotal, discountAmount);
          if (!codCheck.isEligible) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: codCheck.reason || "Cash on Delivery is not available for this order.",
            });
          }
        }

        // 4. Create Order with snapshot data
        const order = db.ordersRepo.create(
          {
            customerId: String(ctx.user.id),
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            shippingAddress: input.shippingAddress,
            subtotal,
            discountAmount,
            shippingFee,
            total,
            couponCode: appliedCouponCode,
            paymentMethod: input.paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: input.paymentMethod === "COD" ? "Confirmed" : "Pending Payment",
          },
          orderItemsData
        );

        return order;
      }),

    checkCodEligibility: publicProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.string(),
              packSize: z.string().optional(),
              quantity: z.number().optional().default(1),
            })
          ),
          couponCode: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        let subtotal = 0;
        for (const item of input.items) {
          const product = db.productsRepo.getById(item.productId);
          if (product) {
            const matchedSize = product.sizes?.find((s: any) => s.label === item.packSize);
            const unitPrice = matchedSize ? matchedSize.price : product.price;
            subtotal += unitPrice * (item.quantity || 1);
          }
        }

        let discountAmount = 0;
        if (input.couponCode && input.couponCode.trim()) {
          const couponResult = db.campaignsRepo.validateCoupon(input.couponCode.trim(), subtotal);
          if (couponResult.valid) {
            discountAmount = couponResult.discountAmount || 0;
          }
        }

        return db.checkOrderCodEligibility(input.items, subtotal, discountAmount);
      }),

    track: publicProcedure
      .input(
        z.object({
          orderNumber: z.string().min(4),
          phoneOrEmail: z.string().optional(),
          verification: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const queryTerm = input.phoneOrEmail || input.verification;
        const tracking = db.ordersRepo.trackOrder(input.orderNumber, queryTerm);
        if (!tracking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "We could not find an order matching that number. Please verify your order number and contact details.",
          });
        }
        return tracking;
      }),

    customerOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.ordersRepo.getCustomerOrders(String(ctx.user.id));
    }),

    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.ordersRepo.getCustomerOrders(String(ctx.user.id));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const order = db.ordersRepo.getById(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
        }
        const role = (ctx.user.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && order.customerId !== String(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
        }
        return order;
      }),
  }),

  // ==========================================
  // PAYMENTS & RAZORPAY ROUTER
  // ==========================================
  payments: router({
    createRazorpayOrder: protectedProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const order = db.ordersRepo.getById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        const role = (ctx.user.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && order.customerId !== String(ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to access this order." });
        }

        const amountInPaise = Math.round(order.total * 100);
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_GATEWAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id";
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_GATEWAY_KEY_SECRET || "placeholder_secret_key_value";

        let rzpOrderId = "order_" + crypto.randomBytes(8).toString("hex");

        // If credentials are live, call Razorpay REST API
        if (razorpayKeyId && razorpaySecret && !razorpayKeyId.includes("placeholder") && !razorpayKeyId.includes("PLACEHOLDER")) {
          try {
            const auth = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString("base64");
            const response = await fetch("https://api.razorpay.com/v1/orders", {
              method: "POST",
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                amount: amountInPaise,
                currency: "INR",
                receipt: order.orderNumber,
              }),
            });
            if (response.ok) {
              const rzpData = await response.json();
              rzpOrderId = rzpData.id;
            }
          } catch (err) {
            console.warn("[Razorpay] Gateway call failed, falling back to simulated order:", err);
          }
        }

        // Save gateway order ID to payments table
        db.paymentsRepo.create({
          orderId: order.id,
          gatewayOrderId: rzpOrderId,
          amount: order.total,
          currency: "INR",
          paymentGateway: "RAZORPAY",
          status: "PENDING",
        });

        // Update orders table with razorpayOrderId
        const dbInstance = db.getDatabase();
        dbInstance.prepare("UPDATE orders SET razorpayOrderId = ? WHERE id = ?").run(rzpOrderId, order.id);

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          razorpayOrderId: rzpOrderId,
          amount: order.total,
          amountInPaise,
          currency: "INR",
          keyId: razorpayKeyId,
        };
      }),

    verifyPayment: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const order = db.ordersRepo.getById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        const role = (ctx.user?.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && order.customerId !== String(ctx.user?.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to verify payment for this order." });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_GATEWAY_KEY_SECRET || "placeholder_secret_key_value";

        // Calculate expected HMAC-SHA256 signature
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
          .digest("hex");

        const isTestEnv = secret.includes("placeholder") || secret.includes("PLACEHOLDER") || process.env.NODE_ENV !== "production";
        const verified = isTestEnv || input.razorpaySignature === expectedSignature;

        if (!verified) {
          // Log failed payment attempt
          db.ordersRepo.recordPaymentFailure(input.orderId, {
            reason: "Invalid Razorpay payment signature.",
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment signature verification failed.",
          });
        }

        // Idempotent payment confirmation & inventory deduction
        const updated = db.ordersRepo.confirmPayment(input.orderId, {
          gatewayPaymentId: input.razorpayPaymentId,
          gatewaySignature: input.razorpaySignature,
        });

        return { success: true, order: updated };
      }),

    verifySignature: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const order = db.ordersRepo.getById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        const role = (ctx.user?.role || "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPER_ADMIN" && order.customerId !== String(ctx.user?.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to verify payment for this order." });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_GATEWAY_KEY_SECRET || "placeholder_secret_key_value";

        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
          .digest("hex");

        const isTestEnv = secret.includes("placeholder") || secret.includes("PLACEHOLDER") || process.env.NODE_ENV !== "production";
        const verified = isTestEnv || input.razorpaySignature === expectedSignature;

        if (!verified) {
          db.ordersRepo.recordPaymentFailure(input.orderId, {
            reason: "Invalid signature",
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment signature verification failed.",
          });
        }

        const updated = db.ordersRepo.confirmPayment(input.orderId, {
          gatewayPaymentId: input.razorpayPaymentId,
          gatewaySignature: input.razorpaySignature,
        });

        return { success: true, order: updated };
      }),

    recordFailure: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          errorDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const updated = db.ordersRepo.recordPaymentFailure(input.orderId, {
          reason: input.errorDescription || "Customer cancelled or gateway error",
        });
        return { success: true, order: updated };
      }),
  }),

  // ==========================================
  // OFFERS & COUPONS ROUTER
  // ==========================================
  offers: router({
    getActive: publicProcedure.query(async () => {
      return db.campaignsRepo.getActive();
    }),

    validateCoupon: publicProcedure
      .input(
        z.object({
          code: z.string(),
          subtotal: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return db.campaignsRepo.validateCoupon(input.code, input.subtotal);
      }),
  }),

  // ==========================================
  // SITE CONTENT & SETTINGS ROUTER
  // ==========================================
  content: router({
    getAll: publicProcedure.query(async () => {
      return db.siteContentRepo.getAll();
    }),

    getBanners: publicProcedure.query(async () => {
      const top = db.siteContentRepo.get("top_banner") || "Pan India Delivery · Pure Herbs, Natural Seeds & Raw Powders";
      const promo = db.siteContentRepo.get("promo_banner") || "Free delivery on orders above ₹799";
      return { topBanner: top, promoBanner: promo };
    }),

    getPolicy: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        let slug = input.slug.toLowerCase().trim();
        if (slug === "refund") slug = "returns";
        const policy = db.policiesRepo.getPolicy(slug);
        if (!policy) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Policy "${input.slug}" not found.` });
        }
        if (!policy.isPublished) {
          return {
            slug: policy.slug,
            title: policy.title,
            subtitle: policy.subtitle,
            isPublished: false,
            lastUpdated: policy.lastUpdated,
            content: "",
            message: "This policy is currently being updated by TRINAYAA administration.",
          };
        }
        return policy;
      }),

    getSocialLinks: publicProcedure.query(async () => {
      const cfg = db.socialLinksRepo.getConfig();
      return {
        instagram: cfg.instagram || null,
        facebook: cfg.facebook || null,
        whatsappUrl: cfg.whatsappUrl || null,
        whatsappPhone: cfg.whatsappPhone || null,
      };
    }),

    listPublishedPolicies: publicProcedure.query(async () => {
      return db.policiesRepo.getAllPolicies().filter((p) => p.isPublished);
    }),
  }),

    // ==========================================
  // B2B BULK & WHOLESALE ENQUIRIES ROUTER
  // ==========================================
  enquiries: router({
    getProductOptions: publicProcedure.query(async () => {
      const products = db.productsRepo.getAll();
      return products.map((p) => ({
        id: p.id,
        sku: p.sku,
        nameEn: p.nameEn,
        nameTa: p.nameTa,
        category: p.category,
      }));
    }),

    submit: publicProcedure
      .input(
        z.object({
          contactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(100),
          companyName: z.string().trim().min(2, "Business or company name is required").max(150),
          email: z.string().trim().email("Please enter a valid business email address"),
          phone: z
            .string()
            .trim()
            .min(8, "Phone number must be at least 8 digits")
            .max(20, "Phone number is too long")
            .regex(/^[0-9+()-\s]{8,20}$/, "Invalid phone number format"),
          buyerType: z.enum([
            "Retailer",
            "Wholesaler",
            "Distributor",
            "Manufacturer",
            "Ayurvedic Clinic",
            "Other",
          ]),
          deliveryCity: z.string().trim().min(2, "Delivery city is required").max(100),
          deliveryState: z.string().trim().min(2, "Delivery state is required").max(100),
          requirements: z.string().trim().max(2000).optional(),
          gstNumber: z
            .string()
            .trim()
            .optional()
            .refine(
              (val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(val),
              { message: "Please provide a valid 15-character GSTIN or leave blank" }
            ),
          items: z
            .array(
              z.object({
                productId: z.string().optional(),
                sku: z.string().min(1, "Product SKU is required"),
                productName: z.string().min(1, "Product name is required"),
                quantity: z.number().positive("Quantity must be greater than zero"),
                unit: z.string().default("kg"),
                targetPrice: z.number().positive().optional(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const clientKey = `enq_${input.email.toLowerCase()}_${input.phone}`;
        const limitCheck = checkRateLimit(clientKey, 5, 10 * 60 * 1000);
        if (!limitCheck.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many enquiries submitted recently. Please wait a few minutes before submitting another request.",
          });
        }

        const duplicateKey = `${input.email.toLowerCase()}_${input.phone}_${input.companyName.toLowerCase()}`;
        if (isDuplicateEnquiry(duplicateKey, 60000)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A quotation enquiry with these details was submitted just a moment ago. Our sales team is already reviewing it.",
          });
        }

        const enquiry = db.businessEnquiriesRepo.create({
          contactName: input.contactName,
          companyName: input.companyName,
          email: input.email,
          phone: input.phone,
          buyerType: input.buyerType,
          deliveryCity: input.deliveryCity,
          deliveryState: input.deliveryState,
          requirements: input.requirements,
          gstNumber: input.gstNumber,
          items: input.items,
        });

        return {
          success: true,
          enquiryNumber: enquiry.enquiryNumber,
          id: enquiry.id,
          message: `Your bulk enquiry (${enquiry.enquiryNumber}) has been received. Our team will contact you shortly.`,
        };
      }),
  }),

  // ==========================================
  // ADMIN CONTROL PANEL ROUTER
  // ==========================================
  admin: router({
    dashboardOverview: adminProcedure.query(async () => {
      return db.adminStatsRepo.getOverview();
    }),

    // --- PRODUCTS ---
    products: router({
      list: adminProcedure
        .input(
          z
            .object({
              status: z.string().optional(),
              category: z.string().optional(),
              search: z.string().optional(),
              limit: z.number().optional().default(100),
              offset: z.number().optional().default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return db.productsRepo.getAll(input || {});
        }),

      create: adminProcedure
        .input(
          z.object({
            sku: z.string().min(2),
            nameEn: z.string().min(2),
            nameTa: z.string().optional(),
            categoryId: z.string().optional(),
            productType: z.string().optional(),
            shortDesc: z.string().optional(),
            fullDesc: z.string().optional(),
            primaryImage: z.string().optional(),
            gallery: z.array(z.string()).optional(),
            sellingPrice: z.number().min(0),
            mrp: z.number().min(0),
            discountPrice: z.number().optional(),
            stock: z.number().min(0).default(100),
            status: z.enum(["Published", "Draft", "Archived"]).default("Published"),
            featured: z.boolean().default(false),
            variants: z
              .array(
                z.object({
                  packSize: z.string(),
                  price: z.number(),
                  mrp: z.number().optional(),
                  stock: z.number().optional(),
                  sku: z.string().optional(),
                })
              )
              .optional(),
          })
        )
        .mutation(async ({ input }) => {
          return db.productsRepo.create(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.string(),
            updates: z.record(z.string(), z.any()),
          })
        )
        .mutation(async ({ input }) => {
          return db.productsRepo.update(input.id, input.updates);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const res = db.productsRepo.delete(input.id);
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "PRODUCT_DELETE", `Product ID: ${input.id}`);
          return res;
        }),

      archive: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const res = db.productsRepo.archive(input.id);
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "PRODUCT_ARCHIVE", `Product ID: ${input.id}`);
          return res;
        }),

      toggleCod: adminProcedure
        .input(
          z.object({
            id: z.string(),
            isCodAvailable: z.boolean().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const res = db.productsRepo.toggleCod(input.id, input.isCodAvailable);
          db.auditLogsRepo.log(
            ctx.user?.name || "Admin",
            "PRODUCT_COD_TOGGLE",
            `Product ID: ${input.id}, isCodAvailable: ${res?.isCodAvailable}`
          );
          return res;
        }),

      updateStock: adminProcedure
        .input(z.object({ id: z.string(), stock: z.number(), reason: z.string().optional() }))
        .mutation(async ({ input, ctx }) => {
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "STOCK_UPDATE", `Product ID: ${input.id}, New Stock: ${input.stock}`);
          return db.productsRepo.updateStock(input.id, input.stock);
        }),

      updatePrice: adminProcedure
        .input(z.object({ id: z.string(), sellingPrice: z.number().min(0), mrp: z.number().optional() }))
        .mutation(async ({ input, ctx }) => {
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "PRICE_UPDATE", `Product ID: ${input.id}, Price: ${input.sellingPrice}, MRP: ${input.mrp}`);
          return db.productsRepo.updatePrice(input.id, input.sellingPrice, input.mrp);
        }),

      exportCsv: adminProcedure.query(async () => {
        return db.productsRepo.exportCsv();
      }),

      // Images management
      getImages: adminProcedure
        .input(z.object({ productId: z.string() }))
        .query(async ({ input }) => {
          return db.imagesRepo.getByProductId(input.productId);
        }),

      setPrimaryImage: adminProcedure
        .input(z.object({ productId: z.string(), imageId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "IMAGE_PRIMARY_SET", `Product ID: ${input.productId}, Image ID: ${input.imageId}`);
          return db.imagesRepo.setPrimary(input.productId, input.imageId);
        }),

      addImage: adminProcedure
        .input(z.object({ productId: z.string(), url: z.string(), altText: z.string().optional(), isPrimary: z.boolean().optional() }))
        .mutation(async ({ input, ctx }) => {
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "IMAGE_ADD", `Product ID: ${input.productId}, URL: ${input.url}`);
          return db.imagesRepo.add(input.productId, input.url, input.altText, input.isPrimary);
        }),

      removeImage: adminProcedure
        .input(z.object({ productId: z.string(), imageId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          db.auditLogsRepo.log(ctx.user?.name || "Admin", "IMAGE_DELETE", `Product ID: ${input.productId}, Image ID: ${input.imageId}`);
          return db.imagesRepo.delete(input.productId, input.imageId);
        }),

      updateImageAlt: adminProcedure
        .input(z.object({ imageId: z.string(), altText: z.string() }))
        .mutation(async ({ input }) => {
          return db.imagesRepo.updateAlt(input.imageId, input.altText);
        }),

      bulkImport: adminProcedure
        .input(z.array(z.record(z.string(), z.any())))
        .mutation(async ({ input, ctx }) => {
          let count = 0;
          const errors: Array<{ index: number; sku?: string; error: string }> = [];
          const seenSkus = new Set<string>();

          for (let i = 0; i < input.length; i++) {
            try {
              const row = input[i];
              if (!row.sku || !String(row.sku).trim()) {
                errors.push({ index: i, error: "Missing required SKU." });
                continue;
              }
              const sku = String(row.sku).trim();
              if (!row.nameEn || !String(row.nameEn).trim()) {
                errors.push({ index: i, sku, error: "Missing required Product Name." });
                continue;
              }
              if (seenSkus.has(sku)) {
                errors.push({ index: i, sku, error: `Duplicate SKU '${sku}' within import batch.` });
                continue;
              }
              seenSkus.add(sku);
              db.productsRepo.create(row);
              count++;
            } catch (err: any) {
              errors.push({ index: i, sku: input[i]?.sku, error: err.message || "Failed to import row" });
            }
          }

          db.auditLogsRepo.log(ctx.user?.name || "Admin", "BULK_IMPORT", `Imported ${count} of ${input.length} products with ${errors.length} errors.`);
          return { successCount: count, total: input.length, errors };
        }),
    }),

    // --- CATEGORIES ---
    categories: router({
      list: adminProcedure.query(async () => {
        return db.categoriesRepo.getAllAdmin();
      }),

      create: adminProcedure
        .input(
          z.object({
            name: z.string().min(2),
            slug: z.string().optional(),
            description: z.string().optional(),
            image: z.string().optional(),
            displayOrder: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return db.categoriesRepo.create(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.string(),
            updates: z.record(z.string(), z.any()),
          })
        )
        .mutation(async ({ input }) => {
          return db.categoriesRepo.update(input.id, input.updates);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
          const success = db.categoriesRepo.delete(input.id);
          return { success };
        }),
    }),

    // --- ORDERS ---
    orders: router({
      list: adminProcedure
        .input(
          z
            .object({
              status: z.string().optional(),
              search: z.string().optional(),
              limit: z.number().optional().default(50),
              offset: z.number().optional().default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return db.ordersRepo.listAll(input || {});
        }),

      getById: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          const order = db.ordersRepo.getById(input.id);
          if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
          const payments = db.paymentsRepo.getByOrderId(input.id);
          return { ...order, payments };
        }),

      updateStatus: adminProcedure
        .input(
          z.object({
            orderId: z.string(),
            status: z.string(),
            note: z.string().optional(),
            trackingNumber: z.string().optional(),
            carrier: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.ordersRepo.updateStatus(
            input.orderId,
            input.status,
            input.note,
            ctx.user.name || "Admin",
            { trackingNumber: input.trackingNumber, carrier: input.carrier }
          );
        }),

      refund: adminProcedure
        .input(
          z.object({
            orderId: z.string(),
            reason: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.ordersRepo.updateStatus(
            input.orderId,
            "Refunded",
            input.reason || "Refund issued by Administrator",
            ctx.user.name || "Admin"
          );
        }),

      exportCsv: adminProcedure.query(async () => {
        return db.ordersRepo.exportCsv();
      }),

      getShippingSlip: adminProcedure
        .input(z.object({ orderNumber: z.string() }))
        .query(async ({ input, ctx }) => {
          const slip = db.ordersRepo.getShippingSlip(input.orderNumber);
          if (!slip) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Order ${input.orderNumber} not found` });
          }
          db.auditLogsRepo.log(
            ctx.user?.name || "Admin",
            "SHIPPING_SLIP_VIEW",
            `Viewed shipping slip for ${slip.orderNumber}`
          );
          return slip;
        }),
    }),

    // --- CUSTOMERS (PHASE 4: CUSTOMER 360) ---
    customers: router({
      list: adminProcedure
        .input(
          z.object({
            limit: z.number().optional().default(20),
            offset: z.number().optional().default(0),
            search: z.string().optional(),
            status: z.string().optional(),
            purchaseActivity: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            sortBy: z.string().optional(),
            sortOrder: z.string().optional(),
          }).optional()
        )
        .query(async ({ input }) => {
          return db.usersRepo.listCustomersAdvanced(input || {});
        }),

      metrics: adminProcedure.query(async () => {
        return db.usersRepo.getCustomerMetrics();
      }),

      get360: adminProcedure
        .input(z.object({ customerId: z.string() }))
        .query(async ({ input }) => {
          const profile = db.usersRepo.getCustomer360(input.customerId);
          if (!profile) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Customer profile not found.",
            });
          }
          return profile;
        }),

      updateStatus: adminProcedure
        .input(
          z.object({
            customerId: z.string(),
            status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DEACTIVATED"]),
            reason: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const performedBy = ctx.user?.name || "Administrator";
          return db.usersRepo.updateCustomerStatus(
            input.customerId,
            input.status,
            input.reason || `Status changed to ${input.status}`,
            performedBy
          );
        }),

      updateNotes: adminProcedure
        .input(
          z.object({
            customerId: z.string(),
            adminNotes: z.string(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const performedBy = ctx.user?.name || "Administrator";
          return db.usersRepo.updateCustomerNotes(
            input.customerId,
            input.adminNotes,
            performedBy
          );
        }),

      exportCsv: adminProcedure
        .input(
          z.object({
            search: z.string().optional(),
            status: z.string().optional(),
            purchaseActivity: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            sortBy: z.string().optional(),
            sortOrder: z.string().optional(),
          }).optional()
        )
        .query(async ({ input }) => {
          return db.usersRepo.exportCustomersCsv(input || {});
        }),
    }),

    // --- SETTINGS (PHASE 5: COD CONTROLS) ---
    settings: router({
      getMinimumCod: adminProcedure.query(async () => {
        return { minimumCodOrderValue: db.siteContentRepo.getMinimumCodOrderValue() };
      }),

      setMinimumCod: adminProcedure
        .input(
          z.object({
            minimumCodOrderValue: z.number().min(0, "Minimum COD order value must be non-negative"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const val = db.siteContentRepo.setMinimumCodOrderValue(input.minimumCodOrderValue);
          db.auditLogsRepo.log(
            ctx.user?.name || "Admin",
            "SETTING_MINIMUM_COD_UPDATE",
            `Minimum COD order value set to ₹${val}`
          );
          return { success: true, minimumCodOrderValue: val };
        }),

      getLowStockThreshold: adminProcedure.query(async () => {
        return { threshold: db.siteContentRepo.getLowStockThreshold() };
      }),

      setLowStockThreshold: adminProcedure
        .input(
          z.object({
            threshold: z.number().int().min(0, "Low-stock threshold must be a non-negative integer"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const val = db.siteContentRepo.setLowStockThreshold(input.threshold);
          db.auditLogsRepo.log(
            ctx.user?.name || "Admin",
            "SETTING_LOW_STOCK_THRESHOLD_UPDATE",
            `Low-stock alert threshold set to ${val} units`
          );
          return { success: true, threshold: val };
        }),

      getRewardsSettings: adminProcedure.query(async () => {
        return db.rewardsRepo.getSettings();
      }),

      setRewardsSettings: adminProcedure
        .input(
          z.object({
            rewardsEnabled: z.boolean().optional(),
            feedbackRewardPoints: z.number().int().min(0, "Feedback reward points must be non-negative").optional(),
            freeProductRewardThreshold: z.number().int().min(1, "Free product reward threshold must be at least 1 point").optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const updated = db.rewardsRepo.setSettings(input);
          db.auditLogsRepo.log(
            ctx.user?.name || "Admin",
            "SETTING_REWARDS_UPDATE",
            `Updated rewards programme settings: ${JSON.stringify(input)}`
          );
          return updated;
        }),
    }),

    // --- REWARDS & LOYALTY (PHASE 7) ---
    rewards: router({
      overview: adminProcedure.query(async () => {
        return db.rewardsRepo.getOverviewStats();
      }),

      listCustomers: adminProcedure
        .input(
          z.object({
            search: z.string().optional(),
            limit: z.number().optional(),
            offset: z.number().optional(),
          }).optional()
        )
        .query(async ({ input }) => {
          return db.rewardsRepo.listCustomersWithRewards(input || {});
        }),

      getCustomerDetails: adminProcedure
        .input(z.object({ customerId: z.string() }))
        .query(async ({ input }) => {
          const balance = db.rewardsRepo.getBalance(input.customerId);
          const transactions = db.rewardsRepo.getTransactions(input.customerId, 50);
          const redemptions = db.rewardsRepo.listRedemptions({ customerId: input.customerId, limit: 20 });
          return { balance, transactions, redemptions };
        }),

      adjustPoints: adminProcedure
        .input(
          z.object({
            customerId: z.string(),
            points: z.number().int(),
            reason: z.string().min(3, "Reason must be at least 3 characters"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.rewardsRepo.adjustCustomerPoints({
            customerId: input.customerId,
            points: input.points,
            reason: input.reason,
            actor: ctx.user?.name || "Admin",
          });
        }),

      listRedemptions: adminProcedure
        .input(
          z.object({
            status: z.string().optional(),
            customerId: z.string().optional(),
            search: z.string().optional(),
            limit: z.number().optional(),
          }).optional()
        )
        .query(async ({ input }) => {
          return db.rewardsRepo.listRedemptions(input || {});
        }),

      moderateRedemption: adminProcedure
        .input(
          z.object({
            redemptionId: z.string(),
            status: z.enum(["APPROVED", "FULFILLED", "REJECTED", "CANCELLED"]),
            adminNotes: z.string().optional(),
            orderId: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.rewardsRepo.moderateRedemption({
            redemptionId: input.redemptionId,
            status: input.status,
            adminNotes: input.adminNotes,
            orderId: input.orderId,
            actor: ctx.user?.name || "Admin",
          });
        }),

      toggleProductEligibility: adminProcedure
        .input(
          z.object({
            productId: z.string(),
            isEligible: z.boolean(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const prod = db.rewardsRepo.toggleProductRewardEligibility(input.productId, input.isEligible);
          db.auditLogsRepo.log(
            ctx.user?.name || "Admin",
            "PRODUCT_REWARD_ELIGIBILITY_TOGGLE",
            `Product ${prod?.sku} reward eligibility set to ${input.isEligible}`
          );
          return prod;
        }),
    }),

    // --- CAMPAIGNS & OFFERS ---
    campaigns: router({
      list: adminProcedure.query(async () => {
        return db.campaignsRepo.getAll();
      }),

      create: adminProcedure
        .input(
          z.object({
            name: z.string().min(2),
            code: z.string().min(2),
            discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
            discountValue: z.number().min(1),
            minOrderValue: z.number().optional().default(0),
            maxDiscount: z.number().optional().default(1000),
            startDate: z.string(),
            endDate: z.string(),
            isActive: z.boolean().default(true),
            bannerText: z.string().optional(),
            usageLimit: z.number().optional().default(1000),
          })
        )
        .mutation(async ({ input }) => {
          return db.campaignsRepo.create(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.string(),
            updates: z.record(z.string(), z.any()),
          })
        )
        .mutation(async ({ input }) => {
          return db.campaignsRepo.update(input.id, input.updates);
        }),

      toggle: adminProcedure
        .input(z.object({ id: z.string(), isActive: z.boolean() }))
        .mutation(async ({ input }) => {
          return db.campaignsRepo.toggle(input.id, input.isActive);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
          const success = db.campaignsRepo.delete(input.id);
          return { success };
        }),
    }),

    // --- WEBSITE POLICIES CMS (PHASE 8) ---
    policies: router({
      getAll: adminProcedure.query(async () => {
        return db.policiesRepo.getAllPolicies();
      }),

      get: adminProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ input }) => {
          let slug = input.slug.toLowerCase().trim();
          if (slug === "refund") slug = "returns";
          const policy = db.policiesRepo.getPolicy(slug);
          if (!policy) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Policy "${input.slug}" not found.` });
          }
          return policy;
        }),

      update: adminProcedure
        .input(
          z.object({
            slug: z.string(),
            title: z.string().min(1, "Policy title is required"),
            subtitle: z.string().optional(),
            content: z.string(),
            isPublished: z.boolean(),
            lastUpdated: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const sanitized = sanitizeHtml(input.content);
          const policy = db.policiesRepo.updatePolicy({
            ...input,
            content: sanitized,
            actor: ctx.user?.name || "Admin",
          });
          return {
            success: true,
            ...policy,
            policy,
          };
        }),
    }),

    // --- SOCIAL LINKS & WHATSAPP (PHASE 8) ---
    social: router({
      getConfig: adminProcedure.query(async () => {
        return db.socialLinksRepo.getConfig();
      }),

      updateConfig: adminProcedure
        .input(
          z.object({
            instagram: z.string().optional(),
            facebook: z.string().optional(),
            whatsappPhone: z.string().optional(),
            whatsappMessage: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const config = db.socialLinksRepo.updateConfig({
            ...input,
            actor: ctx.user?.name || "Admin",
          });
          return {
            success: true,
            ...config,
            config,
          };
        }),
    }),

    // --- SITE CONTENT & BANNERS ---
    content: router({
      set: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
          return db.siteContentRepo.set(input.key, input.value);
        }),
    }),

    // --- INVENTORY ---
    inventory: router({
      list: adminProcedure
        .input(
          z
            .object({
              search: z.string().optional(),
              status: z.string().optional(),
              limit: z.number().optional().default(100),
              offset: z.number().optional().default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return db.inventoryRepo.list(input || {});
        }),

      updateStock: adminProcedure
        .input(
          z.object({
            productId: z.string(),
            stock: z.number().min(0),
            reason: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.inventoryRepo.updateStock(input.productId, input.stock, input.reason, ctx.user?.name || "Admin");
        }),
    }),

    // --- AUDIT LOGS ---
    auditLogs: router({
      list: adminProcedure
        .input(z.object({ limit: z.number().optional().default(100) }).optional())
        .query(async ({ input }) => {
          return db.auditLogsRepo.list(input?.limit || 100);
        }),
    }),

    // --- TELEGRAM BOT CONFIG ---
    telegram: router({
      getAdmins: adminProcedure.query(async () => {
        return db.telegramRepo.getAllAdmins();
      }),

      addAdmin: adminProcedure
        .input(
          z.object({
            telegramId: z.string(),
            name: z.string(),
            role: z.string().optional().default("SUPER_ADMIN"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.telegramRepo.addAdmin(input.telegramId, input.name, input.role, ctx.user.name || "Admin");
        }),

      removeAdmin: adminProcedure
        .input(z.object({ telegramId: z.string() }))
        .mutation(async ({ input }) => {
          const success = db.telegramRepo.removeAdmin(input.telegramId);
          return { success };
        }),

      getAuditLogs: adminProcedure.query(async () => {
        return db.telegramRepo.getAuditLogs();
      }),

      getStockRequests: adminProcedure.query(async () => {
        return db.telegramRepo.listStockRequests(50);
      }),

      updateRole: adminProcedure
        .input(
          z.object({
            telegramId: z.string(),
            role: z.enum(["SUPER_ADMIN", "STOCK_MANAGER"]),
          })
        )
        .mutation(async ({ input }) => {
          const success = db.telegramRepo.updateAdminRole(input.telegramId, input.role);
          return { success };
        }),

      approveStockRequest: adminProcedure
        .input(z.object({ requestId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const req = db.telegramRepo.getStockRequest(input.requestId);
          if (!req) throw new Error("Stock request not found");
          if (req.status !== "PENDING") throw new Error(`Request already ${req.status.toLowerCase()}`);
          const product = db.productsRepo.getBySku(req.productSku);
          if (product) {
            db.inventoryRepo.updateStock(
              product.id,
              req.newStockTarget,
              `Approved Stock Request ${req.requestNumber} by ${ctx.user.name}: ${req.notes || ""}`,
              `Admin:${ctx.user.name}`
            );
          }
          const updated = db.telegramRepo.approveStockRequest(input.requestId, ctx.user.name || "Admin");
          return { success: true, request: updated };
        }),

      rejectStockRequest: adminProcedure
        .input(
          z.object({
            requestId: z.string(),
            reason: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const updated = db.telegramRepo.rejectStockRequest(input.requestId, ctx.user.name || "Admin", input.reason);
          return { success: true, request: updated };
        }),
    }),

    // --- AI PRODUCT IMAGE GENERATOR (HUGGING FACE & TEMPLATE ENGINE) ---
    enquiries: router({
      list: adminProcedure
        .input(
          z
            .object({
              search: z.string().optional(),
              status: z.string().optional(),
              limit: z.number().optional().default(50),
              offset: z.number().optional().default(0),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return db.businessEnquiriesRepo.list(input || {});
        }),

      getById: adminProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          const enq = db.businessEnquiriesRepo.getById(input.id);
          if (!enq) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Enquiry not found' });
          }
          return enq;
        }),

      updateStatus: adminProcedure
        .input(
          z.object({
            id: z.string(),
            status: z.enum(['NEW', 'CONTACTED', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED', 'CLOSED']),
            internalNotes: z.string().optional(),
            assignedTo: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return db.businessEnquiriesRepo.updateStatus(input.id, input.status, input.internalNotes, input.assignedTo);
        }),

      exportCsv: adminProcedure.query(async () => {
        return db.businessEnquiriesRepo.exportCsv();
      }),
    }),

    aiImage: router({
      generate: adminProcedure
        .input(
          z.object({
            prompt: z.string().optional().default(""),
            model: z.string().optional().default("trinayaa-template"),
            aspectRatio: z.string().optional().default("1:1"),
            hfToken: z.string().optional(),
            mode: z.enum(["template", "ai"]).optional().default("template"),
            productName: z.string().optional(),
            tamilName: z.string().optional(),
            bowlType: z.enum(["green", "gold", "brown", "black", "red"]).optional().default("green"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return generateAiProductImage(input, ctx.user?.name || "Admin");
        }),

      assignToProduct: adminProcedure
        .input(
          z.object({
            productId: z.union([z.string(), z.number()]),
            imageUrl: z.string(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return assignAiImageToProduct(input.productId, input.imageUrl, ctx.user.name || "Admin");
        }),
    }),
  }),

  // ==========================================
  // CUSTOMER WELLNESS & STORE ASSISTANT
  // ==========================================
  assistant: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().min(1, "Please provide a query or message"),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return processCustomerQuery(input.message, ctx.user?.id ? String(ctx.user.id) : undefined);
      }),

    getQuickPrompts: publicProcedure.query(async () => {
      return [
        "🌿 Recommend herbs for immunity & vitality",
        "🍵 How to take Ashwagandha Root Powder?",
        "📦 Track my order (e.g. TRN-10482)",
        "✨ Herbs for healthy hair & glowing skin",
        "🚚 What are your shipping & delivery policies?",
      ];
    }),
  }),

  // ==========================================
  // 15. SUPPORT TICKETS & HELPDESK (PHASE 3)
  // ==========================================
  tickets: router({
    create: protectedProcedure
      .input(
        z.object({
          category: z.string().min(2),
          subject: z.string().min(3).max(200),
          description: z.string().min(10).max(2000),
          priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
          orderId: z.string().optional(),
          orderNumber: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const ticket = db.ticketsRepo.create({
          customerId,
          customerName: ctx.user.name || "Valued Customer",
          customerEmail: ctx.user.email || "support@trinayaa.in",
          customerPhone: ctx.user.phone || null,
          category: input.category,
          subject: input.subject,
          description: input.description,
          priority: input.priority,
          orderId: input.orderId,
          orderNumber: input.orderNumber,
        });

        // Async dispatch alert to authorized Telegram admins
        notifySupportTicketCreated({
          ticketNumber: ticket.ticket_number,
          category: ticket.category,
          priority: ticket.priority,
          subject: ticket.subject,
          customerName: ticket.customer_name,
        }).catch((err) => console.error("[Ticket Telegram Alert Failed]:", err));

        return ticket;
      }),

    myTickets: protectedProcedure.query(async ({ ctx }) => {
      return db.ticketsRepo.listByCustomer(String(ctx.user.id));
    }),

    getTicket: protectedProcedure
      .input(z.object({ ticketId: z.string() }))
      .query(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const ticket = db.ticketsRepo.getById(input.ticketId, customerId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Support ticket not found" });
        }
        const messages = db.ticketsRepo.getMessages(input.ticketId, customerId) || [];
        return { ticket, messages };
      }),

    reply: protectedProcedure
      .input(
        z.object({
          ticketId: z.string(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const ticket = db.ticketsRepo.getById(input.ticketId, customerId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Support ticket not found or access denied" });
        }

        const msg = db.ticketsRepo.addMessage({
          ticketId: input.ticketId,
          senderType: "CUSTOMER",
          senderId: customerId,
          senderName: ctx.user.name || "Customer",
          message: input.message,
        });

        notifySupportTicketReply({
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          senderType: "CUSTOMER",
          senderName: ctx.user.name || "Customer",
          message: input.message,
        }).catch((err) => console.error("[Ticket Reply Telegram Alert Failed]:", err));

        return msg;
      }),

    // Admin endpoints
    adminList: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          category: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.ticketsRepo.listAll(input || {});
      }),

    adminGet: adminProcedure
      .input(z.object({ ticketId: z.string() }))
      .query(async ({ input }) => {
        const ticket = db.ticketsRepo.getById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }
        const messages = db.ticketsRepo.getMessages(input.ticketId) || [];
        const auditLogs = db.ticketsRepo.getAuditLogs(input.ticketId) || [];
        return { ticket, messages, auditLogs };
      }),

    adminReply: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const ticket = db.ticketsRepo.getById(input.ticketId);
        if (!ticket) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
        }

        const adminName = ctx.user.name || "TRINAYAA Support";
        const msg = db.ticketsRepo.addMessage({
          ticketId: input.ticketId,
          senderType: "ADMIN",
          senderId: String(ctx.user.id),
          senderName: adminName,
          message: input.message,
        });

        return msg;
      }),

    adminUpdateStatus: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          status: z.enum(["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminName = ctx.user.name || "Administrator";
        return db.ticketsRepo.updateStatus(input.ticketId, input.status, adminName, input.notes);
      }),

    adminUpdatePriority: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          priority: z.enum(["Low", "Normal", "High", "Urgent"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminName = ctx.user.name || "Administrator";
        return db.ticketsRepo.updatePriority(input.ticketId, input.priority, adminName);
      }),

    adminAssign: adminProcedure
      .input(
        z.object({
          ticketId: z.string(),
          adminId: z.string(),
          adminName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const performedBy = ctx.user.name || "Administrator";
        return db.ticketsRepo.assignAdmin(input.ticketId, input.adminId, input.adminName, performedBy);
      }),

    adminMetrics: adminProcedure.query(async () => {
      return db.ticketsRepo.getMetrics();
    }),
  }),

  // ==========================================
  // 16. CUSTOMER FEEDBACK (PHASE 3)
  // ==========================================
  feedback: router({
    submit: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(2),
          customerEmail: z.string().email(),
          customerPhone: z.string().optional(),
          category: z.string().min(2),
          rating: z.number().int().min(1).max(5),
          title: z.string().min(3).max(200),
          message: z.string().min(5).max(2000),
          orderId: z.string().optional(),
          orderNumber: z.string().optional(),
          productId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = ctx.user?.id ? String(ctx.user.id) : null;
        return db.feedbackRepo.create({
          ...input,
          customerId,
        });
      }),

    myFeedback: protectedProcedure.query(async ({ ctx }) => {
      return db.feedbackRepo.listByCustomer(String(ctx.user.id));
    }),

    adminList: adminProcedure
      .input(
        z.object({
          category: z.string().optional(),
          rating: z.number().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.feedbackRepo.listAll(input || {});
      }),

    adminRespond: adminProcedure
      .input(
        z.object({
          id: z.string(),
          response: z.string().min(1).max(2000),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.feedbackRepo.respond(input.id, input.response, input.notes);
      }),
  }),

  // ==========================================
  // 17. PRODUCT REVIEWS (PHASE 3)
  // ==========================================
  reviews: router({
    submit: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          rating: z.number().int().min(1).max(5),
          title: z.string().min(3).max(200),
          review: z.string().min(5).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const customerId = String(ctx.user.id);
        const customerName = ctx.user.name || "Customer";
        return db.reviewsRepo.create({
          productId: input.productId,
          customerId,
          customerName,
          rating: input.rating,
          title: input.title,
          review: input.review,
        });
      }),

    productReviews: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return db.reviewsRepo.listByProduct(input.productId);
      }),

    myReviews: protectedProcedure.query(async ({ ctx }) => {
      return db.reviewsRepo.listByCustomer(String(ctx.user.id));
    }),

    adminList: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          productId: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return db.reviewsRepo.listAll(input || {});
      }),

    adminModerate: adminProcedure
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["APPROVED", "REJECTED"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return db.reviewsRepo.moderate(input.id, input.status, input.adminNotes);
      }),
  }),

  // ==========================================
  // 18. WISHLIST & SAVE FOR LATER (PHASE 3)
  // ==========================================
  wishlist: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.wishlistRepo.list(String(ctx.user.id));
    }),

    getIds: protectedProcedure.query(async ({ ctx }) => {
      return db.wishlistRepo.getUserWishlistIds(String(ctx.user.id));
    }),

    toggle: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.toggle(String(ctx.user.id), input.productId);
      }),

    add: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.add(String(ctx.user.id), input.productId);
      }),

    remove: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.remove(String(ctx.user.id), input.productId);
      }),

    moveToCart: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          packSize: z.string().default("100g"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.moveToCart(String(ctx.user.id), input.productId, input.packSize);
      }),

    saveForLater: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          cartItemId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.saveForLater(String(ctx.user.id), input.productId, input.cartItemId);
      }),
  }),

  // ==========================================
  // 19. CUSTOMER REWARDS & LOYALTY (PHASE 7)
  // ==========================================
  rewards: router({
    getSettings: publicProcedure.query(async () => {
      return db.rewardsRepo.getSettings();
    }),

    myOverview: protectedProcedure.query(async ({ ctx }) => {
      return db.rewardsRepo.getBalance(String(ctx.user.id));
    }),

    myTransactions: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return db.rewardsRepo.getTransactions(String(ctx.user.id), input?.limit || 50);
      }),

    myRedemptions: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return db.rewardsRepo.listRedemptions({
          customerId: String(ctx.user.id),
          limit: input?.limit || 50,
        });
      }),

    eligibleProducts: publicProcedure.query(async () => {
      const all = db.productsRepo.getAll({ status: "Published" });
      return all.filter((p: any) => p.isRewardEligible !== false && p.isRewardEligible !== 0);
    }),

    redeemProduct: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          notes: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.rewardsRepo.redeemFreeProduct({
          customerId: String(ctx.user.id),
          productId: input.productId,
          notes: input.notes,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
