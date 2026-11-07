with open('server/routers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add sanitizeHtml import at top
old_top = 'import { normalizeIndianPhone, isValidIndianPhone, generateSecureOtp, hashOtp, sendOtpSms } from "./smsService";'
new_top = 'import { normalizeIndianPhone, isValidIndianPhone, generateSecureOtp, hashOtp, sendOtpSms } from "./smsService";\nimport { sanitizeHtml } from "./sanitize";'
assert old_top in content, "old_top not found in routers.ts"
content = content.replace(old_top, new_top, 1)

# 2. Add policy and social queries in public content router
old_content_router = '''    getBanners: publicProcedure.query(async () => {
      const top = db.siteContentRepo.get("top_banner") || "Pan India Delivery · Pure Herbs, Natural Seeds & Raw Powders";
      const promo = db.siteContentRepo.get("promo_banner") || "Free delivery on orders above ₹799";
      return { topBanner: top, promoBanner: promo };
    }),
  }),'''

new_content_router = '''    getBanners: publicProcedure.query(async () => {
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
  }),'''

assert old_content_router in content, "old_content_router not found in routers.ts"
content = content.replace(old_content_router, new_content_router, 1)

# 3. Add policies and social routers inside admin router
old_admin_content = '''    // --- SITE CONTENT & BANNERS ---
    content: router({
      set: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
          return db.siteContentRepo.set(input.key, input.value);
        }),
    }),'''

new_admin_content = '''    // --- WEBSITE POLICIES CMS (PHASE 8) ---
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
          return db.policiesRepo.updatePolicy({
            ...input,
            content: sanitized,
            actor: ctx.user?.name || "Admin",
          });
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
          return db.socialLinksRepo.updateConfig({
            ...input,
            actor: ctx.user?.name || "Admin",
          });
        }),
    }),

    // --- SITE CONTENT & BANNERS ---
    content: router({
      set: adminProcedure
        .input(z.object({ key: z.string(), value: z.string() }))
        .mutation(async ({ input }) => {
          return db.siteContentRepo.set(input.key, input.value);
        }),
    }),'''

assert old_admin_content in content, "old_admin_content not found in routers.ts"
content = content.replace(old_admin_content, new_admin_content, 1)

with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched server/routers.ts for Phase 8!")
