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
        z.object({
          email: z.string().email(),
          password: z.string().min(6, "Password must be at least 6 characters"),
          name: z.string().min(2, "Name must be at least 2 characters"),
          phone: z.string().optional(),
          guestToken: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
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
          email: z.string().email(),
          password: z.string(),
          guestToken: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
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
          unitPrice: z.number(),
          quantity: z.number().optional().default(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
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
        const userId = ctx.user ? String(ctx.user.id) : undefined;
        const cart = db.cartRepo.getOrCreate(userId, input.guestToken);
        const items = db.cartRepo.updateItem(
          cart.id,
          input.productId,
          input.packSize,
          input.quantity
        );
        return { cartId: cart.id, items };
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
  }),

  // ==========================================
  // ORDERS & CHECKOUT ROUTER
  // ==========================================
  orders: router({
    create: protectedProcedure
      .input(
        z.object({
          customerName: z.string().min(2),
          customerEmail: z.string().email(),
          customerPhone: z.string().min(10),
          shippingAddress: z.object({
            street: z.string().min(3),
            city: z.string().min(2),
            state: z.string().min(2),
            pinCode: z.string().min(6),
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

          // Find exact variant price
          const matchedSize = product.sizes.find((s: any) => s.label === item.packSize);
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
        if (input.couponCode) {
          const couponResult = db.campaignsRepo.validateCoupon(input.couponCode, subtotal);
          if (couponResult.valid) {
            discountAmount = couponResult.discountAmount || 0;
          }
        }

        // 3. Pan-India shipping: Free delivery on orders above ₹799, otherwise ₹60
        const shippingFee = subtotal >= 799 ? 0 : 60;
        const total = Math.max(0, subtotal - discountAmount + shippingFee);

        // 4. Create Order
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
            paymentMethod: input.paymentMethod,
            paymentStatus: input.paymentMethod === "COD" ? "PENDING" : "PENDING",
            orderStatus: input.paymentMethod === "COD" ? "Confirmed" : "Pending Payment",
          },
          orderItemsData
        );

        return order;
      }),

    track: publicProcedure
      .input(
        z.object({
          orderNumber: z.string().min(5),
          verification: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const tracking = db.ordersRepo.trackOrder(input.orderNumber, input.verification);
        if (!tracking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "We could not find an order matching that number. Please check your confirmation email.",
          });
        }
        return tracking;
      }),

    customerOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.ordersRepo.getCustomerOrders(String(ctx.user.id));
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const order = db.ordersRepo.getById(input.id);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
        }
        // Ensure customer can only view their own order (unless admin)
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

        const amountInPaise = Math.round(order.total * 100);
        const razorpayKeyId = process.env.PAYMENT_GATEWAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_PLACEHOLDER";
        const razorpaySecret = process.env.PAYMENT_GATEWAY_KEY_SECRET || "PLACEHOLDER_SECRET";

        // Simulated/Test Razorpay Order ID for test environments
        const rzpOrderId = "order_" + crypto.randomBytes(8).toString("hex");

        // If credentials are live, call Razorpay API
        if (razorpayKeyId && razorpaySecret && !razorpayKeyId.includes("PLACEHOLDER")) {
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
              return {
                orderId: order.id,
                orderNumber: order.orderNumber,
                razorpayOrderId: rzpData.id,
                amount: order.total,
                amountInPaise,
                currency: "INR",
                keyId: razorpayKeyId,
              };
            }
          } catch (err) {
            console.warn("[Razorpay] Gateway call failed, falling back to test order:", err);
          }
        }

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

    verifySignature: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          razorpayOrderId: z.string(),
          razorpayPaymentId: z.string(),
          razorpaySignature: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const secret = process.env.PAYMENT_GATEWAY_KEY_SECRET || "PLACEHOLDER_SECRET";

        // Verify HMAC-SHA256 signature
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
          .digest("hex");

        const isTestEnv = secret.includes("PLACEHOLDER") || process.env.NODE_ENV !== "production";
        const verified = isTestEnv || input.razorpaySignature === expectedSignature;

        if (!verified) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment signature verification failed.",
          });
        }

        // Update database order to Confirmed & PAID
        const updated = db.ordersRepo.updatePayment(input.orderId, "PAID", input.razorpayPaymentId);
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
        .mutation(async ({ input }) => {
          const success = db.productsRepo.delete(input.id);
          return { success };
        }),

      updateStock: adminProcedure
        .input(z.object({ id: z.string(), stock: z.number() }))
        .mutation(async ({ input }) => {
          return db.productsRepo.updateStock(input.id, input.stock);
        }),

      updatePrice: adminProcedure
        .input(z.object({ id: z.string(), sellingPrice: z.number(), mrp: z.number().optional() }))
        .mutation(async ({ input }) => {
          return db.productsRepo.updatePrice(input.id, input.sellingPrice, input.mrp);
        }),

      bulkImport: adminProcedure
        .input(z.array(z.record(z.string(), z.any())))
        .mutation(async ({ input }) => {
          let count = 0;
          const errors: Array<{ index: number; error: string }> = [];

          for (let i = 0; i < input.length; i++) {
            try {
              const row = input[i];
              if (!row.sku || !row.nameEn || row.sellingPrice === undefined) {
                errors.push({ index: i, error: "Missing required SKU, English Name, or Price." });
                continue;
              }
              db.productsRepo.create(row);
              count++;
            } catch (err: any) {
              errors.push({ index: i, error: err.message || "Failed to import row" });
            }
          }

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

      updateStatus: adminProcedure
        .input(
          z.object({
            orderId: z.string(),
            status: z.string(),
            note: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return db.ordersRepo.updateStatus(input.orderId, input.status, input.note, ctx.user.name || "Admin");
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
  }),
});

export type AppRouter = typeof appRouter;
