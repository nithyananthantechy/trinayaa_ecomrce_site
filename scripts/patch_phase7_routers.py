with open('server/routers.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add getRewardsSettings and setRewardsSettings inside admin.settings
target_settings = '''      setLowStockThreshold: adminProcedure
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
        }),'''

replacement_settings = '''      setLowStockThreshold: adminProcedure
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
        }),'''

assert target_settings in content, "target_settings not found in routers.ts"
content = content.replace(target_settings, replacement_settings, 1)

# 2. Add rewards router inside admin router
target_admin_end = '''    // --- CAMPAIGNS & OFFERS ---'''
admin_rewards_code = '''    // --- REWARDS & LOYALTY (PHASE 7) ---
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

    // --- CAMPAIGNS & OFFERS ---'''

assert target_admin_end in content, "target_admin_end not found in routers.ts"
content = content.replace(target_admin_end, admin_rewards_code, 1)

# 3. Add customer rewards router to appRouter
target_wishlist_end = '''    saveForLater: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          cartItemId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.wishlistRepo.saveForLater(String(ctx.user.id), input.productId, input.cartItemId);
      }),
  }),'''

rewards_router_code = '''    saveForLater: protectedProcedure
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
  }),'''

assert target_wishlist_end in content, "target_wishlist_end not found in routers.ts"
content = content.replace(target_wishlist_end, rewards_router_code, 1)

with open('server/routers.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched server/routers.ts for Phase 7!")
