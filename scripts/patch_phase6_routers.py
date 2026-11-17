with open('server/routers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update public settings router with getLowStockThreshold
old_pub_settings = """  settings: router({
    getMinimumCod: publicProcedure.query(async () => {
      return { minimumCodOrderValue: db.siteContentRepo.getMinimumCodOrderValue() };
    }),
  }),"""

new_pub_settings = """  settings: router({
    getMinimumCod: publicProcedure.query(async () => {
      return { minimumCodOrderValue: db.siteContentRepo.getMinimumCodOrderValue() };
    }),
    getLowStockThreshold: publicProcedure.query(async () => {
      return { threshold: db.siteContentRepo.getLowStockThreshold() };
    }),
  }),"""

assert old_pub_settings in content, "Could not find old_pub_settings"
content = content.replace(old_pub_settings, new_pub_settings, 1)

# 2. Update public products router with sanitizePublicProduct
old_prod_list = """    list: publicProcedure
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
      }),"""

new_prod_list = """    list: publicProcedure
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
      }),"""

assert old_prod_list in content, "Could not find old_prod_list"
content = content.replace(old_prod_list, new_prod_list, 1)

old_prod_slug = """    getBySlug: publicProcedure
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
      }),"""

new_prod_slug = """    getBySlug: publicProcedure
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
      }),"""

assert old_prod_slug in content, "Could not find old_prod_slug"
content = content.replace(old_prod_slug, new_prod_slug, 1)

old_prod_id = """    getById: publicProcedure
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
      }),"""

new_prod_id = """    getById: publicProcedure
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
      }),"""

assert old_prod_id in content, "Could not find old_prod_id"
content = content.replace(old_prod_id, new_prod_id, 1)

old_prod_sku = """    getBySku: publicProcedure
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
      }),"""

new_prod_sku = """    getBySku: publicProcedure
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
      }),"""

assert old_prod_sku in content, "Could not find old_prod_sku"
content = content.replace(old_prod_sku, new_prod_sku, 1)

old_prod_related = """    getRelated: publicProcedure
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
    }),"""

new_prod_related = """    getRelated: publicProcedure
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
    }),"""

assert old_prod_related in content, "Could not find old_prod_related"
content = content.replace(old_prod_related, new_prod_related, 1)

# 3. Add getShippingSlip to admin.orders
old_admin_orders = """      exportCsv: adminProcedure.query(async () => {
        return db.ordersRepo.exportCsv();
      }),
    }),"""

new_admin_orders = """      exportCsv: adminProcedure.query(async () => {
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
    }),"""

assert old_admin_orders in content, "Could not find old_admin_orders"
content = content.replace(old_admin_orders, new_admin_orders, 1)

# 4. Add getLowStockThreshold & setLowStockThreshold to admin.settings
old_admin_settings = """          return { success: true, minimumCodOrderValue: val };
        }),
    }),"""

new_admin_settings = """          return { success: true, minimumCodOrderValue: val };
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
    }),"""

assert old_admin_settings in content, "Could not find old_admin_settings"
content = content.replace(old_admin_settings, new_admin_settings, 1)

with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ server/routers.ts patched successfully for Phase 6")
