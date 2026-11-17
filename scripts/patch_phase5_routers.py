import os

routers_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server", "routers.ts")

with open(routers_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update orders.create to validate COD eligibility
cod_check_code = """        // Validate COD Eligibility strictly on server
        if (input.paymentMethod === "COD") {
          const codCheck = db.checkOrderCodEligibility(input.items, subtotal, discountAmount);
          if (!codCheck.isEligible) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: codCheck.reason || "Cash on Delivery is not available for this order.",
            });
          }
        }

        // 4. Create Order with snapshot data"""

target_order_create = "// 4. Create Order with snapshot data"
if target_order_create in content and "Validate COD Eligibility strictly on server" not in content:
    content = content.replace(target_order_create, cod_check_code, 1)
    print("✓ Added server-side COD validation to orders.create")

# 2. Add checkCodEligibility query to orders router
orders_check_cod = """    checkCodEligibility: publicProcedure
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

    track: publicProcedure"""

target_track = "    track: publicProcedure"
if target_track in content and "checkCodEligibility:" not in content:
    content = content.replace(target_track, orders_check_cod, 1)
    print("✓ Added orders.checkCodEligibility procedure")

# 3. Add toggleCod to admin.products
admin_toggle_cod = """      toggleCod: adminProcedure
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

      updateStock: adminProcedure"""

target_update_stock = "      updateStock: adminProcedure"
if target_update_stock in content and "toggleCod: adminProcedure" not in content:
    content = content.replace(target_update_stock, admin_toggle_cod, 1)
    print("✓ Added admin.products.toggleCod procedure with audit logging")

# 4. Add settings sub-router to admin router
admin_settings_code = """    // --- SETTINGS (PHASE 5: COD CONTROLS) ---
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
    }),

    // --- CAMPAIGNS & OFFERS ---"""

target_campaigns = "    // --- CAMPAIGNS & OFFERS ---"
if target_campaigns in content and "getMinimumCod: adminProcedure" not in content:
    content = content.replace(target_campaigns, admin_settings_code, 1)
    print("✓ Added admin.settings sub-router for minimum COD configuration")

# 5. Add public settings router to root appRouter
public_settings_code = """  // ==========================================
  // STORE SETTINGS & CONFIGURATION (PHASE 5)
  // ==========================================
  settings: router({
    getMinimumCod: publicProcedure.query(async () => {
      return { minimumCodOrderValue: db.siteContentRepo.getMinimumCodOrderValue() };
    }),
  }),

  // ==========================================
  // 1. AUTHENTICATION & GUEST TOKENS"""

target_auth = """  // ==========================================
  // 1. AUTHENTICATION & GUEST TOKENS"""

if target_auth in content and "getMinimumCod: publicProcedure" not in content:
    content = content.replace(target_auth, public_settings_code, 1)
    print("✓ Added public settings.getMinimumCod procedure to appRouter")

with open(routers_path, "w", encoding="utf-8") as f:
    f.write(content)

print("server/routers.ts patched successfully.")
