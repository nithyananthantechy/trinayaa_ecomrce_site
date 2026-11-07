import re

with open('server/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update formatProduct to include isRewardEligible
old_fmt = 'isCodAvailable: p.isCodAvailable !== undefined ? (p.isCodAvailable === 1 || p.isCodAvailable === true || p.isCodAvailable === "1") : true,\n    sizes,'
new_fmt = 'isCodAvailable: p.isCodAvailable !== undefined ? (p.isCodAvailable === 1 || p.isCodAvailable === true || p.isCodAvailable === "1") : true,\n    isRewardEligible: p.isRewardEligible !== undefined ? (p.isRewardEligible === 1 || p.isRewardEligible === true || p.isRewardEligible === "1") : true,\n    sizes,'
assert old_fmt in content, "old_fmt not found in db.ts"
content = content.replace(old_fmt, new_fmt, 1)

# 2. Update productsRepo.update allowed list
old_allowed = '"featured", "isCodAvailable", "seoTitle"'
new_allowed = '"featured", "isCodAvailable", "isRewardEligible", "seoTitle"'
assert old_allowed in content, "old_allowed not found in db.ts"
content = content.replace(old_allowed, new_allowed, 1)

old_check = 'if (key === "featured" || key === "isCodAvailable") {'
new_check = 'if (key === "featured" || key === "isCodAvailable" || key === "isRewardEligible") {'
assert old_check in content, "old_check not found in db.ts"
content = content.replace(old_check, new_check, 1)

# 3. Add reward settings to siteContentRepo
old_site_content = '''  setLowStockThreshold(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Low-stock threshold must be a non-negative integer.");
    }
    const intVal = Math.floor(value);
    this.set("low_stock_threshold", String(intVal));
    return intVal;
  }
};'''

new_site_content = '''  setLowStockThreshold(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Low-stock threshold must be a non-negative integer.");
    }
    const intVal = Math.floor(value);
    this.set("low_stock_threshold", String(intVal));
    return intVal;
  },

  getFeedbackRewardPoints(): number {
    const val = this.get("feedback_reward_points");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) < 0) {
      return 50;
    }
    return Math.floor(Number(val));
  },

  setFeedbackRewardPoints(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Feedback reward points must be a non-negative integer.");
    }
    const intVal = Math.floor(value);
    this.set("feedback_reward_points", String(intVal));
    return intVal;
  },

  getFreeProductRewardThreshold(): number {
    const val = this.get("free_product_reward_threshold");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) <= 0) {
      return 200;
    }
    return Math.floor(Number(val));
  },

  setFreeProductRewardThreshold(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value <= 0) {
      throw new Error("Free product reward threshold must be a positive integer greater than zero.");
    }
    const intVal = Math.floor(value);
    this.set("free_product_reward_threshold", String(intVal));
    return intVal;
  },

  getRewardsEnabled(): boolean {
    const val = this.get("rewards_enabled");
    if (val === null || val === undefined) return true;
    return val !== "false" && val !== "0";
  },

  setRewardsEnabled(value: boolean): boolean {
    this.set("rewards_enabled", value ? "true" : "false");
    return value;
  }
};'''

assert old_site_content in content, "old_site_content not found in db.ts"
content = content.replace(old_site_content, new_site_content, 1)

# 4. Hook rewards into feedbackRepo.respond
old_fb_respond = '''  respond(id: string, response: string, internalNotes?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customer_feedback
      SET admin_response = ?, admin_responded_at = ?, internal_notes = ?, status = 'REVIEWED', updated_at = ?
      WHERE id = ?
    `).run(response, now, internalNotes || null, now, id);
    return this.getById(id);
  },'''

new_fb_respond = '''  respond(id: string, response: string, internalNotes?: string) {
    const db = getDatabase();
    const fb = this.getById(id);
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customer_feedback
      SET admin_response = ?, admin_responded_at = ?, internal_notes = ?, status = 'REVIEWED', updated_at = ?
      WHERE id = ?
    `).run(response, now, internalNotes || null, now, id);

    if (fb && fb.customer_id) {
      try {
        const enabled = siteContentRepo.getRewardsEnabled();
        const pts = siteContentRepo.getFeedbackRewardPoints();
        if (enabled && pts > 0) {
          rewardsRepo.awardPoints({
            customerId: fb.customer_id,
            type: "FEEDBACK_EARNED",
            points: pts,
            referenceType: "FEEDBACK",
            referenceId: id,
            description: `Reward points for customer feedback: ${fb.title || fb.category || "Feedback"}`,
            actor: "Admin",
          });
        }
      } catch (rewardErr) {
        console.error("[Rewards] Failed to award feedback points:", rewardErr);
      }
    }
    return this.getById(id);
  },'''

assert old_fb_respond in content, "old_fb_respond not found in db.ts"
content = content.replace(old_fb_respond, new_fb_respond, 1)

# 5. Hook rewards into reviewsRepo.moderate
old_rev_moderate = '''  moderate(id: string, status: "APPROVED" | "REJECTED", adminNotes?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE product_reviews
      SET status = ?, admin_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(status, adminNotes || null, now, id);
    return this.getById(id);
  },'''

new_rev_moderate = '''  moderate(id: string, status: "APPROVED" | "REJECTED", adminNotes?: string) {
    const db = getDatabase();
    const review = this.getById(id);
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE product_reviews
      SET status = ?, admin_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(status, adminNotes || null, now, id);

    if (review && review.customer_id) {
      try {
        if (status === "APPROVED") {
          const enabled = siteContentRepo.getRewardsEnabled();
          const pts = siteContentRepo.getFeedbackRewardPoints();
          if (enabled && pts > 0) {
            rewardsRepo.awardPoints({
              customerId: review.customer_id,
              type: "FEEDBACK_EARNED",
              points: pts,
              referenceType: "REVIEW",
              referenceId: id,
              description: `Reward points for approved product review: ${review.title || "Product Review"}`,
              actor: "Admin",
            });
          }
        } else if (status === "REJECTED") {
          rewardsRepo.reversePoints({
            customerId: review.customer_id,
            referenceType: "REVIEW",
            referenceId: id,
            reason: "Review rejected by administrator",
            actor: "Admin",
          });
        }
      } catch (rewardErr) {
        console.error("[Rewards] Failed to process review reward/reversal:", rewardErr);
      }
    }
    return this.getById(id);
  },'''

assert old_rev_moderate in content, "old_rev_moderate not found in db.ts"
content = content.replace(old_rev_moderate, new_rev_moderate, 1)

# 6. Append rewardsRepo to db.ts
rewards_repo_code = '''

// ==========================================
// 21. CUSTOMER REWARDS & LOYALTY REPOSITORY (PHASE 7)
// ==========================================
export const rewardsRepo = {
  getSettings() {
    return {
      rewardsEnabled: siteContentRepo.getRewardsEnabled(),
      feedbackRewardPoints: siteContentRepo.getFeedbackRewardPoints(),
      freeProductRewardThreshold: siteContentRepo.getFreeProductRewardThreshold(),
    };
  },

  setSettings(settings: {
    rewardsEnabled?: boolean;
    feedbackRewardPoints?: number;
    freeProductRewardThreshold?: number;
  }) {
    if (settings.rewardsEnabled !== undefined) {
      siteContentRepo.setRewardsEnabled(settings.rewardsEnabled);
    }
    if (settings.feedbackRewardPoints !== undefined) {
      siteContentRepo.setFeedbackRewardPoints(settings.feedbackRewardPoints);
    }
    if (settings.freeProductRewardThreshold !== undefined) {
      siteContentRepo.setFreeProductRewardThreshold(settings.freeProductRewardThreshold);
    }
    return this.getSettings();
  },

  getBalance(customerId: string) {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT transactionType, points
      FROM customer_reward_transactions
      WHERE customerId = ?
    `).all(customerId) as Array<{ transactionType: string; points: number }>;

    let balance = 0;
    let totalEarned = 0;
    let totalRedeemed = 0;

    for (const row of rows) {
      balance += row.points;
      if (row.points > 0) {
        totalEarned += row.points;
      } else if (row.points < 0) {
        totalRedeemed += Math.abs(row.points);
      }
    }

    const threshold = siteContentRepo.getFreeProductRewardThreshold();
    const rewardsEnabled = siteContentRepo.getRewardsEnabled();
    const canRedeem = rewardsEnabled && balance >= threshold;
    const pointsToNextReward = balance >= threshold ? 0 : threshold - balance;

    return {
      customerId,
      balance: Math.max(0, balance),
      totalEarned,
      totalRedeemed,
      freeProductRewardThreshold: threshold,
      pointsToNextReward,
      canRedeem,
      rewardsEnabled,
    };
  },

  getTransactions(customerId: string, limit = 50) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM customer_reward_transactions
      WHERE customerId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).all(customerId, limit) as any[];
  },

  awardPoints(params: {
    customerId: string;
    type: "FEEDBACK_EARNED" | "ADMIN_CREDIT";
    points: number;
    referenceType?: string;
    referenceId?: string;
    description: string;
    actor?: string;
  }) {
    const db = getDatabase();

    // Check if rewards program is enabled (unless admin manual credit)
    if (params.type === "FEEDBACK_EARNED" && !siteContentRepo.getRewardsEnabled()) {
      return null;
    }

    if (!params.points || params.points <= 0) {
      throw new Error("Points to award must be a positive integer.");
    }

    // Deduplication check: if referenceType and referenceId provided, ensure not already awarded
    if (params.referenceType && params.referenceId) {
      const existing = db.prepare(`
        SELECT id FROM customer_reward_transactions
        WHERE customerId = ? AND referenceType = ? AND referenceId = ? AND transactionType = ?
      `).get(params.customerId, params.referenceType, params.referenceId, params.type) as any;

      if (existing) {
        // Idempotent: already awarded
        return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(existing.id) as any;
      }
    }

    const id = "rtx_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_reward_transactions (
        id, customerId, transactionType, points, referenceType, referenceId,
        description, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.customerId,
      params.type,
      Math.floor(params.points),
      params.referenceType || null,
      params.referenceId || null,
      params.description,
      now,
      params.actor || "System"
    );

    auditLogsRepo.log(
      params.actor || "System",
      "REWARD_POINTS_AWARDED",
      `Awarded ${params.points} points to customer ${params.customerId} (${params.type})`
    );

    return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(id) as any;
  },

  reversePoints(params: {
    customerId: string;
    referenceType: string;
    referenceId: string;
    reason: string;
    actor?: string;
  }) {
    const db = getDatabase();

    // Find the original transaction
    const original = db.prepare(`
      SELECT * FROM customer_reward_transactions
      WHERE customerId = ? AND referenceType = ? AND referenceId = ? AND transactionType != 'REVERSAL'
      ORDER BY createdAt DESC LIMIT 1
    `).get(params.customerId, params.referenceType, params.referenceId) as any;

    if (!original) {
      return null;
    }

    // Check if already reversed
    const existingReversal = db.prepare(`
      SELECT id FROM customer_reward_transactions
      WHERE customerId = ? AND referenceType = ? AND referenceId = ? AND transactionType = 'REVERSAL'
    `).get(params.customerId, params.referenceType, params.referenceId) as any;

    if (existingReversal) {
      return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(existingReversal.id) as any;
    }

    // Reverse the points: if original was +50, reversal is -50; if original was -200, reversal is +200
    const reversePoints = -original.points;
    const id = "rtx_rev_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_reward_transactions (
        id, customerId, transactionType, points, referenceType, referenceId,
        description, createdAt, createdBy
      ) VALUES (?, ?, 'REVERSAL', ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.customerId,
      reversePoints,
      params.referenceType,
      params.referenceId,
      `Reversal: ${params.reason}`,
      now,
      params.actor || "Admin"
    );

    auditLogsRepo.log(
      params.actor || "Admin",
      "REWARD_POINTS_REVERSED",
      `Reversed ${reversePoints} points for customer ${params.customerId} (${params.referenceType}:${params.referenceId})`
    );

    return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(id) as any;
  },

  adjustCustomerPoints(params: {
    customerId: string;
    points: number; // Positive for credit, negative for debit
    reason: string;
    actor: string;
  }) {
    const db = getDatabase();
    if (!params.points || params.points === 0) {
      throw new Error("Adjustment points cannot be zero.");
    }
    if (!params.reason || !params.reason.trim()) {
      throw new Error("A reason is mandatory for manual reward point adjustments.");
    }
    if (!params.actor || !params.actor.trim()) {
      throw new Error("Administrator identity is required for manual adjustments.");
    }

    const { balance } = this.getBalance(params.customerId);
    if (params.points < 0 && balance < Math.abs(params.points)) {
      throw new Error(`Insufficient customer points. Available balance is ${balance}, cannot deduct ${Math.abs(params.points)} points.`);
    }

    const type = params.points > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT";
    const id = "rtx_adj_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_reward_transactions (
        id, customerId, transactionType, points, referenceType, referenceId,
        description, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?, ?)
    `).run(
      id,
      params.customerId,
      type,
      Math.floor(params.points),
      id,
      params.reason.trim(),
      now,
      params.actor.trim()
    );

    auditLogsRepo.log(
      params.actor.trim(),
      `REWARD_${type}`,
      `Adjusted points by ${params.points} for customer ${params.customerId}: ${params.reason.trim()}`
    );

    return this.getBalance(params.customerId);
  },

  redeemFreeProduct(params: {
    customerId: string;
    productId: string;
    notes?: string;
  }) {
    const db = getDatabase();

    if (!siteContentRepo.getRewardsEnabled()) {
      throw new Error("The TRINAYAA rewards loyalty programme is currently inactive.");
    }

    const product = productsRepo.getById(params.productId);
    if (!product) {
      throw new Error("Selected product not found in catalogue.");
    }

    if (product.status !== "Published") {
      throw new Error("Selected product is not currently available for redemption.");
    }

    if (product.isRewardEligible === false || product.isRewardEligible === 0) {
      throw new Error("This product is marked as ineligible for reward points redemption.");
    }

    const threshold = siteContentRepo.getFreeProductRewardThreshold();

    // Execute atomically
    const executeTx = db.transaction(() => {
      const { balance } = this.getBalance(params.customerId);
      if (balance < threshold) {
        throw new Error(`Insufficient reward points. You have ${balance} points, but ${threshold} points are required to redeem this product.`);
      }

      const redemptionId = "rdm_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();

      // 1. Create redemption request
      db.prepare(`
        INSERT INTO customer_reward_redemptions (
          id, customerId, rewardProductId, pointsSpent, status, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, ?)
      `).run(
        redemptionId,
        params.customerId,
        params.productId,
        threshold,
        params.notes || null,
        now,
        now
      );

      // 2. Deduct points ledger transaction
      const txId = "rtx_rdm_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      db.prepare(`
        INSERT INTO customer_reward_transactions (
          id, customerId, transactionType, points, referenceType, referenceId,
          description, createdAt, createdBy
        ) VALUES (?, ?, 'REWARD_REDEEMED', ?, 'REDEMPTION', ?, ?, ?, ?)
      `).run(
        txId,
        params.customerId,
        -threshold,
        redemptionId,
        `Redemption: Free ${product.nameEn} (SKU: ${product.sku})`,
        now,
        params.customerId
      );

      auditLogsRepo.log(
        params.customerId,
        "REWARD_PRODUCT_REDEEMED",
        `Requested free product ${product.sku} for ${threshold} points (Redemption ID: ${redemptionId})`
      );

      return redemptionId;
    });

    const newRedemptionId = executeTx();
    return this.getRedemptionById(newRedemptionId);
  },

  getRedemptionById(id: string) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT r.*, p.sku as productSku, p.nameEn as productName, p.primaryImage as productImage,
             u.name as customerName, u.email as customerEmail, u.phone as customerPhone
      FROM customer_reward_redemptions r
      LEFT JOIN products p ON p.id = r.rewardProductId
      LEFT JOIN users u ON u.id = r.customerId
      WHERE r.id = ?
    `).get(id) as any;
    return row || null;
  },

  moderateRedemption(params: {
    redemptionId: string;
    status: "APPROVED" | "FULFILLED" | "REJECTED" | "CANCELLED";
    adminNotes?: string;
    orderId?: string;
    actor?: string;
  }) {
    const db = getDatabase();
    const redemption = this.getRedemptionById(params.redemptionId);
    if (!redemption) {
      throw new Error("Redemption request not found.");
    }

    const now = new Date().toISOString();
    const fulfilledAt = params.status === "FULFILLED" ? now : (redemption.fulfilledAt || null);

    // If changing to REJECTED or CANCELLED, restore points if not already reversed
    if (params.status === "REJECTED" || params.status === "CANCELLED") {
      this.reversePoints({
        customerId: redemption.customerId,
        referenceType: "REDEMPTION",
        referenceId: redemption.id,
        reason: `Restoration for ${params.status.toLowerCase()} redemption: ${params.adminNotes || "Request rejected/cancelled"}`,
        actor: params.actor || "Admin",
      });
    }

    db.prepare(`
      UPDATE customer_reward_redemptions
      SET status = ?, adminNotes = ?, orderId = COALESCE(?, orderId),
          updatedAt = ?, fulfilledAt = ?
      WHERE id = ?
    `).run(
      params.status,
      params.adminNotes !== undefined ? params.adminNotes : redemption.adminNotes,
      params.orderId || null,
      now,
      fulfilledAt,
      params.redemptionId
    );

    auditLogsRepo.log(
      params.actor || "Admin",
      "REWARD_REDEMPTION_MODERATED",
      `Redemption ${params.redemptionId} marked as ${params.status}`
    );

    return this.getRedemptionById(params.redemptionId);
  },

  listRedemptions(filters: { status?: string; customerId?: string; search?: string; limit?: number } = {}) {
    const db = getDatabase();
    let query = `
      SELECT r.*, p.sku as productSku, p.nameEn as productName, p.primaryImage as productImage,
             u.name as customerName, u.email as customerEmail, u.phone as customerPhone
      FROM customer_reward_redemptions r
      LEFT JOIN products p ON p.id = r.rewardProductId
      LEFT JOIN users u ON u.id = r.customerId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status && filters.status !== "ALL") {
      query += " AND r.status = ?";
      params.push(filters.status);
    }
    if (filters.customerId) {
      query += " AND r.customerId = ?";
      params.push(filters.customerId);
    }
    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += " AND (r.id LIKE ? OR p.nameEn LIKE ? OR p.sku LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      params.push(term, term, term, term, term);
    }

    query += " ORDER BY r.createdAt DESC";
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as any[];
  },

  getOverviewStats() {
    const db = getDatabase();
    const participating = db.prepare(`
      SELECT COUNT(DISTINCT customerId) as count
      FROM customer_reward_transactions
    `).get() as { count: number };

    const pointsIssued = db.prepare(`
      SELECT COALESCE(SUM(points), 0) as total
      FROM customer_reward_transactions
      WHERE points > 0
    `).get() as { total: number };

    const pointsRedeemed = db.prepare(`
      SELECT COALESCE(ABS(SUM(points)), 0) as total
      FROM customer_reward_transactions
      WHERE transactionType = 'REWARD_REDEEMED'
    `).get() as { total: number };

    const redemptionCounts = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'REQUESTED' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'FULFILLED' THEN 1 ELSE 0 END) as fulfilled,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM customer_reward_redemptions
    `).get() as any;

    return {
      participatingCustomers: participating?.count || 0,
      totalPointsIssued: pointsIssued?.total || 0,
      totalPointsRedeemed: pointsRedeemed?.total || 0,
      totalRedemptions: redemptionCounts?.total || 0,
      pendingRedemptions: redemptionCounts?.pending || 0,
      approvedRedemptions: redemptionCounts?.approved || 0,
      fulfilledRedemptions: redemptionCounts?.fulfilled || 0,
      rejectedRedemptions: redemptionCounts?.rejected || 0,
      settings: this.getSettings(),
    };
  },

  listCustomersWithRewards(filters: { search?: string; limit?: number; offset?: number } = {}) {
    const db = getDatabase();
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.status, u.createdAt,
             COALESCE(SUM(t.points), 0) as balance,
             COALESCE(SUM(CASE WHEN t.points > 0 THEN t.points ELSE 0 END), 0) as totalEarned,
             COALESCE(ABS(SUM(CASE WHEN t.transactionType = 'REWARD_REDEEMED' THEN t.points ELSE 0 END)), 0) as totalRedeemed,
             COUNT(t.id) as transactionCount
      FROM users u
      LEFT JOIN customer_reward_transactions t ON t.customerId = u.id
      WHERE u.role = 'CUSTOMER'
    `;
    const params: any[] = [];

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      params.push(term, term, term);
    }

    query += " GROUP BY u.id ORDER BY balance DESC, u.name ASC";
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    return db.prepare(query).all(...params) as any[];
  },

  toggleProductRewardEligibility(productId: string, isEligible: boolean) {
    const db = getDatabase();
    const val = isEligible ? 1 : 0;
    db.prepare("UPDATE products SET isRewardEligible = ?, updatedAt = ? WHERE id = ?")
      .run(val, new Date().toISOString(), productId);
    return productsRepo.getById(productId);
  },
};
'''

content += rewards_repo_code

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched server/db.ts for Phase 7!")
