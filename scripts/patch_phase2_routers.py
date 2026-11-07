import re

with open('server/routers.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports: import smsService helpers
import_marker = 'import { processCustomerQuery } from "./customerAssistant";'
import_insert = '''import { processCustomerQuery } from "./customerAssistant";
import { normalizeIndianPhone, isValidIndianPhone, generateSecureOtp, hashOtp, sendOtpSms } from "./smsService";'''

if "normalizeIndianPhone" not in text:
    text = text.replace(import_marker, import_insert, 1)
    print("Added smsService imports to server/routers.ts.")

# 2. Add requestOtp and verifyOtp to auth router
auth_insert = '''    requestOtp: publicProcedure
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
        } else if (user.status === "SUSPENDED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account is temporarily suspended. Please contact support.",
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

    '''

auth_marker = 'adminLogin: publicProcedure'
if "requestOtp: publicProcedure" not in text:
    text = text.replace(auth_marker, auth_insert + auth_marker, 1)
    print("Added requestOtp and verifyOtp to auth router.")

# 3. Add account router right before addresses router
account_router = '''  // ==========================================
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
          phone: z.string().regex(/^(?:\\+91)?[6-9]\\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
          addressLine1: z.string().min(3, "House / building number & street is required"),
          addressLine2: z.string().optional(),
          street: z.string().optional(),
          landmark: z.string().optional(),
          city: z.string().min(2, "City is required"),
          district: z.string().optional(),
          state: z.string().min(2, "State is required").default("Tamil Nadu"),
          pinCode: z.string().regex(/^\\d{6}$/, "Please enter a valid 6-digit Indian PIN code"),
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
          phone: z.string().regex(/^(?:\\+91)?[6-9]\\d{9}$/).optional(),
          addressLine1: z.string().min(3).optional(),
          addressLine2: z.string().optional(),
          landmark: z.string().optional(),
          city: z.string().min(2).optional(),
          district: z.string().optional(),
          state: z.string().min(2).optional(),
          pinCode: z.string().regex(/^\\d{6}$/).optional(),
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

'''

addresses_marker = 'addresses: router({'
if "account: router({" not in text:
    text = text.replace(addresses_marker, account_router + addresses_marker, 1)
    print("Added account router to server/routers.ts.")

with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("server/routers.ts patched successfully.")
