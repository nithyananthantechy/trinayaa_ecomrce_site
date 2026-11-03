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

export const appRouter = router({
  system: systemRouter,

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

        if (user.status === "SUSPENDED") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your account is temporarily suspended. Please contact support.",
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
        return db.productsRepo.getAll(input || {});
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
        return product;
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
        return product;
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
        return product;
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
        return db.productsRepo.getRelated(input.categoryId, input.excludeId, input.limit);
      }),

    getFeatured: publicProcedure.query(async () => {
      return db.productsRepo.getAll({ limit: 12 });
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
    }),

    // --- CUSTOMERS ---
    customers: router({
      list: adminProcedure
        .input(
          z.object({
            limit: z.number().optional().default(100),
            offset: z.number().optional().default(0),
          }).optional()
        )
        .query(async ({ input }) => {
          return db.usersRepo.listCustomers(input?.limit, input?.offset);
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
    }),

    // --- AI PRODUCT IMAGE GENERATOR (HUGGING FACE & FLUX) ---
    aiImage: router({
      generate: adminProcedure
        .input(
          z.object({
            prompt: z.string().min(3),
            model: z.string().optional().default("black-forest-labs/FLUX.1-schnell"),
            aspectRatio: z.string().optional().default("1:1"),
            hfToken: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return generateAiProductImage(input, ctx.user.name || "Admin");
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
});

export type AppRouter = typeof appRouter;
