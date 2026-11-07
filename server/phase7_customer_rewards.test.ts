import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";

describe("TRINAYAA Phase 7 — Customer Rewards, Feedback Points & Free-Product Redemption", () => {
  const originalSettings = db.rewardsRepo.getSettings();

  const mockAdminCtx: any = {
    user: {
      id: "admin_test_p7",
      name: "Admin Tester",
      email: "admin_p7@trinayaa.com",
      role: "ADMIN",
    },
    res: { cookie: () => {} },
  };

  const mockCustomerCtx: any = {
    user: {
      id: "cust_reward_test_01",
      name: "Sundar Rajan",
      email: "sundar_rewards@example.com",
      role: "CUSTOMER",
    },
    res: { cookie: () => {} },
  };

  const adminCaller = appRouter.createCaller(mockAdminCtx);
  const customerCaller = appRouter.createCaller(mockCustomerCtx);

  beforeAll(() => {
    // Ensure test customer exists with exact id
    const rawDb = db.getDatabase();
    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, 'hash123', ?, ?, 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run("cust_reward_test_01", "sundar_rewards@example.com", "Sundar Rajan", "+919876543210");
  });

  afterAll(() => {
    // Restore original settings
    db.rewardsRepo.setSettings(originalSettings);

    // Clean up test transactions and redemptions for test customer
    const rawDb = db.getDatabase();
    rawDb.prepare("DELETE FROM customer_reward_transactions WHERE customerId = ?").run("cust_reward_test_01");
    rawDb.prepare("DELETE FROM customer_reward_redemptions WHERE customerId = ?").run("cust_reward_test_01");
    rawDb.prepare("DELETE FROM product_reviews WHERE customer_id = ?").run("cust_reward_test_01");
    rawDb.prepare("DELETE FROM customer_feedback WHERE customer_id = ?").run("cust_reward_test_01");
  });

  beforeEach(() => {
    // Reset points for test customer
    const rawDb = db.getDatabase();
    rawDb.prepare("DELETE FROM customer_reward_transactions WHERE customerId = ?").run("cust_reward_test_01");
    rawDb.prepare("DELETE FROM customer_reward_redemptions WHERE customerId = ?").run("cust_reward_test_01");
    db.rewardsRepo.setSettings({
      rewardsEnabled: true,
      feedbackRewardPoints: 50,
      freeProductRewardThreshold: 200,
    });
  });

  // ==========================================
  // 1. CONFIGURABLE REWARD SETTINGS
  // ==========================================
  describe("1. Configurable Reward Settings", () => {
    it("1.1: Reads default rewards configuration", async () => {
      const settings = await adminCaller.admin.settings.getRewardsSettings();
      expect(settings.rewardsEnabled).toBe(true);
      expect(settings.feedbackRewardPoints).toBe(50);
      expect(settings.freeProductRewardThreshold).toBe(200);
    });

    it("1.2: Updates rewards settings via admin procedure", async () => {
      const updated = await adminCaller.admin.settings.setRewardsSettings({
        feedbackRewardPoints: 75,
        freeProductRewardThreshold: 250,
        rewardsEnabled: true,
      });

      expect(updated.feedbackRewardPoints).toBe(75);
      expect(updated.freeProductRewardThreshold).toBe(250);
      expect(updated.rewardsEnabled).toBe(true);

      const verified = db.rewardsRepo.getSettings();
      expect(verified.feedbackRewardPoints).toBe(75);
      expect(verified.freeProductRewardThreshold).toBe(250);
    });

    it("1.3: Validates settings: rejects negative feedback points and invalid threshold", () => {
      expect(() => db.siteContentRepo.setFeedbackRewardPoints(-10)).toThrow();
      expect(() => db.siteContentRepo.setFreeProductRewardThreshold(0)).toThrow();
      expect(() => db.siteContentRepo.setFreeProductRewardThreshold(-50)).toThrow();
    });

    it("1.4: Public endpoint allows clients to query active rewards configuration", async () => {
      const pubSettings = await customerCaller.rewards.getSettings();
      expect(pubSettings).toBeDefined();
      expect(typeof pubSettings.rewardsEnabled).toBe("boolean");
      expect(pubSettings.feedbackRewardPoints).toBeGreaterThan(0);
      expect(pubSettings.freeProductRewardThreshold).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 2. EARNING POINTS FROM REVIEWS & FEEDBACK
  // ==========================================
  describe("2. Earning Points from Feedback & Product Reviews", () => {
    it("2.1: Awards points only when a product review is APPROVED by an admin", async () => {
      // Create a pending review for TRN-1001
      const review = db.reviewsRepo.create({
        productId: "prod_1",
        customerId: "cust_reward_test_01",
        customerName: "Sundar Rajan",
        rating: 5,
        title: "Pure Moringa Powder",
        review: "Excellent quality and packaging, fresh fragrance.",
      });

      // Initially 0 points
      let balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(0);

      // Admin approves review
      await adminCaller.reviews.adminModerate({
        id: review.id,
        status: "APPROVED",
        adminNotes: "Approved verified feedback",
      });

      // Verify points were awarded
      balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(50);
      expect(balance.totalEarned).toBe(50);

      const txs = db.rewardsRepo.getTransactions("cust_reward_test_01");
      expect(txs.length).toBe(1);
      expect(txs[0].transactionType).toBe("FEEDBACK_EARNED");
      expect(txs[0].points).toBe(50);
      expect(txs[0].referenceType).toBe("REVIEW");
      expect(txs[0].referenceId).toBe(review.id);
    });

    it("2.2: Idempotency: Repeated approval does not duplicate reward points", async () => {
      const review = db.reviewsRepo.create({
        productId: "prod_1",
        customerId: "cust_reward_test_01",
        customerName: "Sundar Rajan",
        rating: 5,
        title: "Amla Berry Review",
        review: "Very authentic and pure botanical product.",
      });

      // Approve once
      await adminCaller.reviews.adminModerate({ id: review.id, status: "APPROVED" });
      let balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(50);

      // Approve again (idempotent check)
      await adminCaller.reviews.adminModerate({ id: review.id, status: "APPROVED" });
      balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(50);

      const txs = db.rewardsRepo.getTransactions("cust_reward_test_01");
      const reviewTxs = txs.filter((t) => t.referenceId === review.id);
      expect(reviewTxs.length).toBe(1);
    });

    it("2.3: Reversal: Rejecting a previously approved review reverses points", async () => {
      const review = db.reviewsRepo.create({
        productId: "prod_1",
        customerId: "cust_reward_test_01",
        customerName: "Sundar Rajan",
        rating: 4,
        title: "Test for Reversal",
        review: "Initially approved, later flagged as spam.",
      });

      await adminCaller.reviews.adminModerate({ id: review.id, status: "APPROVED" });
      let balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(50);

      // Admin subsequently rejects the review
      await adminCaller.reviews.adminModerate({
        id: review.id,
        status: "REJECTED",
        adminNotes: "Spam content detected upon re-review",
      });

      balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(0);

      const txs = db.rewardsRepo.getTransactions("cust_reward_test_01");
      const reversalTx = txs.find((t) => t.transactionType === "REVERSAL" && t.referenceId === review.id);
      expect(reversalTx).toBeDefined();
      expect(reversalTx.points).toBe(-50);
    });

    it("2.4: General store feedback awards points when reviewed/responded by admin", async () => {
      const fb = db.feedbackRepo.create({
        customerId: "cust_reward_test_01",
        customerName: "Sundar Rajan",
        customerEmail: "sundar_rewards@example.com",
        category: "Product Quality",
        rating: 5,
        title: "Packaging Feedback",
        message: "The new pouch zip locks are fantastic and preserve freshness well.",
      });

      // Admin responds to feedback
      await adminCaller.feedback.adminRespond({
        id: fb.id,
        response: "Thank you for the kind feedback on our botanical pouch design!",
      });

      const balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(50);

      const txs = db.rewardsRepo.getTransactions("cust_reward_test_01");
      const fbTx = txs.find((t) => t.referenceType === "FEEDBACK" && t.referenceId === fb.id);
      expect(fbTx).toBeDefined();
      expect(fbTx.points).toBe(50);
    });

    it("2.5: Guest feedback (without customerId) does not award reward points", async () => {
      const guestFb = db.feedbackRepo.create({
        customerName: "Anonymous Guest",
        customerEmail: "guest@example.com",
        category: "Delivery",
        rating: 4,
        title: "Fast Delivery",
        message: "Delivered quickly to Coimbatore.",
      });

      await adminCaller.feedback.adminRespond({
        id: guestFb.id,
        response: "Thank you for shopping with TRINAYAA!",
      });

      // Verify no orphan transaction was created
      const rawDb = db.getDatabase();
      const orphan = rawDb.prepare("SELECT * FROM customer_reward_transactions WHERE referenceId = ?").get(guestFb.id);
      expect(orphan).toBeUndefined();
    });

    it("2.6: Does not award points when rewards_enabled is toggled off", async () => {
      db.rewardsRepo.setSettings({ rewardsEnabled: false });

      const review = db.reviewsRepo.create({
        productId: "prod_1",
        customerId: "cust_reward_test_01",
        customerName: "Sundar Rajan",
        rating: 5,
        title: "Review during rewards suspension",
        review: "Great herbal quality.",
      });

      await adminCaller.reviews.adminModerate({ id: review.id, status: "APPROVED" });
      const balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(0);
    });
  });

  // ==========================================
  // 3. FREE-PRODUCT REWARD REDEMPTION
  // ==========================================
  describe("3. Free-Product Reward Redemption", () => {
    it("3.1: Rejects redemption when customer has insufficient points", async () => {
      // Customer has 0 points, threshold is 200
      await expect(
        customerCaller.rewards.redeemProduct({
          productId: "prod_1",
        })
      ).rejects.toThrow(/Insufficient reward points/i);
    });

    it("3.2: Successfully redeems free product when points threshold is met", async () => {
      // Credit customer with 250 points
      db.rewardsRepo.awardPoints({
        customerId: "cust_reward_test_01",
        type: "ADMIN_CREDIT",
        points: 250,
        description: "Loyalty welcome grant",
        actor: "Admin",
      });

      let overview = await customerCaller.rewards.myOverview();
      expect(overview.balance).toBe(250);
      expect(overview.canRedeem).toBe(true);

      // Redeem free product prod_1
      const redemption = await customerCaller.rewards.redeemProduct({
        productId: "prod_1",
        notes: "Deliver with my upcoming subscription order",
      });

      expect(redemption).toBeDefined();
      expect(redemption.status).toBe("REQUESTED");
      expect(redemption.pointsSpent).toBe(200);
      expect(redemption.rewardProductId).toBe("prod_1");

      // Balance should now be 50
      overview = await customerCaller.rewards.myOverview();
      expect(overview.balance).toBe(50);
      expect(overview.totalRedeemed).toBe(200);
      expect(overview.canRedeem).toBe(false);

      // Verify transaction ledger
      const txs = await customerCaller.rewards.myTransactions();
      const redeemTx = txs.find((t) => t.transactionType === "REWARD_REDEEMED");
      expect(redeemTx).toBeDefined();
      expect(redeemTx.points).toBe(-200);
      expect(redeemTx.referenceId).toBe(redemption.id);
    });

    it("3.3: Prevents double-spend: Cannot redeem a second time if balance dropped below threshold", async () => {
      // Credit exactly 200 points
      db.rewardsRepo.awardPoints({
        customerId: "cust_reward_test_01",
        type: "ADMIN_CREDIT",
        points: 200,
        description: "Exact threshold grant",
        actor: "Admin",
      });

      // First redemption succeeds
      await customerCaller.rewards.redeemProduct({ productId: "prod_1" });

      // Immediate second redemption must fail
      await expect(
        customerCaller.rewards.redeemProduct({ productId: "prod_1" })
      ).rejects.toThrow(/Insufficient reward points/i);
    });

    it("3.4: Rejects redemption of product marked ineligible (isRewardEligible = 0)", async () => {
      db.rewardsRepo.awardPoints({
        customerId: "cust_reward_test_01",
        type: "ADMIN_CREDIT",
        points: 300,
        description: "Sufficient grant",
        actor: "Admin",
      });

      // Mark prod_1 ineligible
      await adminCaller.admin.rewards.toggleProductEligibility({
        productId: "prod_1",
        isEligible: false,
      });

      await expect(
        customerCaller.rewards.redeemProduct({ productId: "prod_1" })
      ).rejects.toThrow(/ineligible/i);

      // Restore eligibility
      await adminCaller.admin.rewards.toggleProductEligibility({
        productId: "prod_1",
        isEligible: true,
      });
    });

    it("3.5: Admin moderation: Approving and fulfilling a redemption", async () => {
      db.rewardsRepo.awardPoints({
        customerId: "cust_reward_test_01",
        type: "ADMIN_CREDIT",
        points: 200,
        description: "Grant for admin fulfillment test",
      });

      const rdm = await customerCaller.rewards.redeemProduct({ productId: "prod_1" });

      // Admin approves
      const approved = await adminCaller.admin.rewards.moderateRedemption({
        redemptionId: rdm.id,
        status: "APPROVED",
        adminNotes: "Pouch packed and assigned to packing team",
      });
      expect(approved.status).toBe("APPROVED");

      // Admin fulfills with dispatch tracking
      const fulfilled = await adminCaller.admin.rewards.moderateRedemption({
        redemptionId: rdm.id,
        status: "FULFILLED",
        orderId: "TRN-REW-8899",
        adminNotes: "Dispatched via ST Courier",
      });
      expect(fulfilled.status).toBe("FULFILLED");
      expect(fulfilled.orderId).toBe("TRN-REW-8899");
      expect(fulfilled.fulfilledAt).toBeDefined();
    });

    it("3.6: Admin moderation: Rejecting a redemption safely restores points to customer", async () => {
      db.rewardsRepo.awardPoints({
        customerId: "cust_reward_test_01",
        type: "ADMIN_CREDIT",
        points: 200,
        description: "Grant for rejection restoration test",
      });

      const rdm = await customerCaller.rewards.redeemProduct({ productId: "prod_1" });

      let balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(0);

      // Admin rejects redemption (e.g. out of stock or duplicate request)
      await adminCaller.admin.rewards.moderateRedemption({
        redemptionId: rdm.id,
        status: "REJECTED",
        adminNotes: "Item temporarily out of stock; points restored to account",
      });

      // Balance should be restored to 200!
      balance = db.rewardsRepo.getBalance("cust_reward_test_01");
      expect(balance.balance).toBe(200);

      const txs = db.rewardsRepo.getTransactions("cust_reward_test_01");
      const restoreTx = txs.find((t) => t.transactionType === "REVERSAL" && t.referenceId === rdm.id);
      expect(restoreTx).toBeDefined();
      expect(restoreTx.points).toBe(200);
    });
  });

  // ==========================================
  // 4. ADMIN CUSTOMER REWARDS 360 & MANUAL ADJUSTMENTS
  // ==========================================
  describe("4. Admin Customer Rewards & Manual Adjustments", () => {
    it("4.1: Admin overview returns aggregate rewards metrics", async () => {
      // Award some points and create redemption
      db.rewardsRepo.awardPoints({
        customerId: "cust_reward_test_01",
        type: "ADMIN_CREDIT",
        points: 200,
        description: "Overview test credit",
      });
      await customerCaller.rewards.redeemProduct({ productId: "prod_1" });

      const overview = await adminCaller.admin.rewards.overview();
      expect(overview.participatingCustomers).toBeGreaterThan(0);
      expect(overview.totalPointsIssued).toBeGreaterThan(0);
      expect(overview.totalPointsRedeemed).toBeGreaterThan(0);
      expect(overview.totalRedemptions).toBeGreaterThan(0);
    });

    it("4.2: Admin can manually credit customer reward points with mandatory audit reason", async () => {
      const result = await adminCaller.admin.rewards.adjustPoints({
        customerId: "cust_reward_test_01",
        points: 120,
        reason: "Customer goodwill loyalty bonus for photo review",
      });

      expect(result.balance).toBe(120);

      const txs = db.rewardsRepo.getTransactions("cust_reward_test_01");
      const adjTx = txs.find((t) => t.transactionType === "ADMIN_CREDIT");
      expect(adjTx).toBeDefined();
      expect(adjTx.points).toBe(120);
      expect(adjTx.description).toContain("goodwill loyalty bonus");
    });

    it("4.3: Admin can manually debit points, but cannot debit more than available balance", async () => {
      // Credit 100 points
      await adminCaller.admin.rewards.adjustPoints({
        customerId: "cust_reward_test_01",
        points: 100,
        reason: "Initial bonus",
      });

      // Debit 40 points
      const debited = await adminCaller.admin.rewards.adjustPoints({
        customerId: "cust_reward_test_01",
        points: -40,
        reason: "Manual correction for duplicate credit",
      });
      expect(debited.balance).toBe(60);

      // Attempting to debit 100 when balance is 60 must fail
      await expect(
        adminCaller.admin.rewards.adjustPoints({
          customerId: "cust_reward_test_01",
          points: -100,
          reason: "Excessive deduction",
        })
      ).rejects.toThrow(/Insufficient customer points/i);
    });

    it("4.4: Admin customer list returns customer loyalty profiles and balances", async () => {
      const customers = await adminCaller.admin.rewards.listCustomers({
        search: "Sundar",
      });

      expect(customers.length).toBeGreaterThan(0);
      const testCust = customers.find((c: any) => c.id === "cust_reward_test_01");
      expect(testCust).toBeDefined();
      expect(testCust.name).toBe("Sundar Rajan");
      expect(typeof testCust.balance).toBe("number");
    });
  });

  // ==========================================
  // 5. CATALOGUE & REWARD PRODUCTS ELIGIBILITY
  // ==========================================
  describe("5. Catalogue Integrity & Eligible Products", () => {
    it("5.1: Exactly 162 catalog products exist in the store database", () => {
      const rawDb = db.getDatabase();
      const count = rawDb.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number };
      expect(count.cnt).toBe(162);
    });

    it("5.2: Public eligibleProducts query returns only published products marked for rewards", async () => {
      const eligible = await customerCaller.rewards.eligibleProducts();
      expect(Array.isArray(eligible)).toBe(true);
      expect(eligible.length).toBeGreaterThan(0);
      for (const p of eligible) {
        expect(p.status).toBe("Published");
        expect(p.isRewardEligible).not.toBe(false);
      }
    });
  });
});
