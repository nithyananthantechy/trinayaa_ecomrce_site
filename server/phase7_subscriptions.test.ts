import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";
import { TRPCError } from "@trpc/server";

function createMockContext(user: any = null) {
  const cookies: Record<string, any> = {};
  const headers: Record<string, string> = {};

  return {
    ctx: {
      user,
      req: {
        protocol: "https",
        headers,
        cookies,
        ip: "127.0.0.1",
      } as any,
      res: {
        cookie: (name: string, val: string) => {
          cookies[name] = val;
        },
        clearCookie: (name: string) => {
          delete cookies[name];
        },
      } as any,
    },
  };
}

describe("TRINAYAA Phase 7: Product Subscriptions & Recurring Delivery Management", () => {
  let customerUser: any;
  let otherCustomerUser: any;
  let adminUser: any;
  let retailUser: any;
  let eligibleProduct: any;
  let variantProduct: any;
  let customerCaller: any;
  let otherCustomerCaller: any;
  let adminCaller: any;
  let retailCaller: any;
  let guestCaller: any;

  beforeAll(() => {
    const database = db.getDatabase();

    // 1. Seed or retrieve botanical test products
    const products = db.productsRepo.getAll({ limit: 20 });
    expect(products.length).toBeGreaterThan(0);

    eligibleProduct = products.find((p: any) => p.stock > 10 && p.isCodAvailable !== false) || products[0];
    database.prepare(`
      UPDATE products 
      SET isSubscriptionEligible = 1, stock = 100, isCodAvailable = 1, sellingPrice = 250
      WHERE id = ?
    `).run(eligibleProduct.id);
    eligibleProduct = db.productsRepo.getById(eligibleProduct.id);

    // Retrieve or create a variant for testing
    let variants = database.prepare("SELECT * FROM product_variants WHERE productId = ?").all(eligibleProduct.id) as any[];
    if (!variants || variants.length === 0) {
      const vId = "var_p7_" + Date.now();
      database.prepare(`
        INSERT INTO product_variants (id, productId, packSize, price, mrp, stock, sku)
        VALUES (?, ?, '250g Jar', 320, 399, 40, 'SKU-VAR-P7-1')
      `).run(vId, eligibleProduct.id);
      variants = database.prepare("SELECT * FROM product_variants WHERE productId = ?").all(eligibleProduct.id) as any[];
    }
    variantProduct = variants[0];

    // 2. Seed test users
    const custId = "cust_p7_" + Date.now();
    const otherCustId = "cust_p7_other_" + Date.now();
    const admId = "admin_p7_" + Date.now();
    const retailId = "retail_p7_" + Date.now();

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(custId, "Meera Sundaram", `meera_${Date.now()}@trinayaa.test`);

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(otherCustId, "Vignesh Kumar", `vignesh_${Date.now()}@trinayaa.test`);

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'SUPER_ADMIN', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(admId, "Admin Senthil", `admin_p7_${Date.now()}@trinayaa.test`);

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'RETAIL_SHOP_HANDLER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(retailId, "Retail Shop Handler Erode", `retail_p7_${Date.now()}@trinayaa.test`);

    customerUser = database.prepare("SELECT * FROM users WHERE id = ?").get(custId);
    otherCustomerUser = database.prepare("SELECT * FROM users WHERE id = ?").get(otherCustId);
    adminUser = database.prepare("SELECT * FROM users WHERE id = ?").get(admId);
    retailUser = database.prepare("SELECT * FROM users WHERE id = ?").get(retailId);

    customerCaller = appRouter.createCaller(createMockContext(customerUser).ctx);
    otherCustomerCaller = appRouter.createCaller(createMockContext(otherCustomerUser).ctx);
    adminCaller = appRouter.createCaller(createMockContext(adminUser).ctx);
    retailCaller = appRouter.createCaller(createMockContext(retailUser).ctx);
    guestCaller = appRouter.createCaller(createMockContext(null).ctx);
  });

  // ==========================================
  // Test 1: Customer Subscription Creation
  // ==========================================
  it("creates a subscription with locked unit price, delivery frequency, address snapshot and initial cycle", async () => {
    const input = {
      productId: eligibleProduct.id,
      variantId: variantProduct.id,
      frequency: "30_DAYS" as const,
      quantity: 2,
      paymentPreference: "COD" as const,
      deliveryAddress: {
        fullName: "Meera Sundaram",
        phone: "9876543210",
        addressLine1: "12 Perundurai Road",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638011",
      },
    };

    const sub = await customerCaller.subscriptions.create(input);

    expect(sub).toBeDefined();
    expect(sub.id).toBeDefined();
    expect(sub.subscriptionNumber).toMatch(/^TRN-SUB-\d{4}-\d{5}$/);
    expect(sub.customerId).toBe(customerUser.id);
    expect(sub.status).toBe("ACTIVE");
    expect(sub.frequency).toBe("30_DAYS");
    expect(sub.frequencyDays).toBe(30);
    expect(sub.quantity).toBe(2);
    expect(sub.unitPrice).toBe(variantProduct.price);
    const expectedSubtotal = variantProduct.price * 2;
    const expectedShipping = expectedSubtotal >= 799 ? 0 : 60;
    expect(sub.subtotal).toBe(expectedSubtotal);
    expect(sub.shippingFee).toBe(expectedShipping);
    expect(sub.totalPerCycle).toBe(expectedSubtotal + expectedShipping);
    expect(sub.productName).toBe(eligibleProduct.name);
    expect(sub.variantLabel).toBe(variantProduct.packSize);
    expect(sub.nextDeliveryDate).toBeDefined();

    // Verify initial cycle in database
    const database = db.getDatabase();
    const cycle = database.prepare("SELECT * FROM subscription_cycles WHERE subscription_id = ?").get(sub.id);
    expect(cycle).toBeDefined();
    expect(cycle.cycle_number).toBe(1);
    expect(cycle.cycle_reference).toBe(`${sub.subscriptionNumber}-C1`);
    expect(cycle.status).toBe("PENDING");

    // Verify creation event in history
    const history = database.prepare("SELECT * FROM subscription_history WHERE subscription_id = ? AND action = 'CREATED'").get(sub.id);
    expect(history).toBeDefined();
  });

  // ==========================================
  // Test 2: Free Shipping Threshold for Subscriptions >= 799
  // ==========================================
  it("calculates zero shipping charge when subscription subtotal is >= 799", async () => {
    // Determine quantity required to exceed Rs. 799 threshold
    const qty = Math.ceil(800 / variantProduct.price);
    const expectedSubtotal = variantProduct.price * qty;

    const input = {
      productId: eligibleProduct.id,
      variantId: variantProduct.id,
      frequency: "15_DAYS" as const,
      quantity: qty,
      paymentPreference: "COD" as const,
      deliveryAddress: {
        fullName: "Meera Sundaram",
        phone: "9876543210",
        addressLine1: "12 Perundurai Road",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638011",
      },
    };

    const sub = await customerCaller.subscriptions.create(input);
    expect(sub.subtotal).toBe(expectedSubtotal);
    expect(sub.shippingFee).toBe(0);
    expect(sub.totalPerCycle).toBe(expectedSubtotal);
  });

  // ==========================================
  // Test 3: Reject Subscription for Ineligible Product
  // ==========================================
  it("rejects subscription creation for products marked not eligible", async () => {
    const database = db.getDatabase();
    const ts = Date.now();
    const ineligId = "prod_inelig_" + ts;
    database.prepare(`
      INSERT INTO products (id, sku, nameEn, nameTa, slug, sellingPrice, mrp, discountPrice, stock, isSubscriptionEligible, status, createdAt, updatedAt)
      VALUES (?, ?, 'Limited Seasonal Saffron', 'குங்குமப்பூ', ?, 999, 1200, 999, 10, 0, 'Published', datetime('now'), datetime('now'))
    `).run(ineligId, "SKU-INEL-" + ts, "seasonal-saffron-" + ts);

    await expect(
      customerCaller.subscriptions.create({
        productId: ineligId,
        frequency: "30_DAYS",
        quantity: 1,
        paymentPreference: "COD",
        deliveryAddress: {
          fullName: "Meera",
          phone: "9876543210",
          addressLine1: "Road 1",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
      })
    ).rejects.toThrow(/not eligible for subscription/i);
  });

  // ==========================================
  // Test 4: Reject Subscription for Insufficient Stock
  // ==========================================
  it("rejects subscription creation when requested quantity exceeds available stock", async () => {
    await expect(
      customerCaller.subscriptions.create({
        productId: eligibleProduct.id,
        frequency: "30_DAYS",
        quantity: 99999,
        paymentPreference: "COD",
        deliveryAddress: {
          fullName: "Meera",
          phone: "9876543210",
          addressLine1: "Road 1",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
      })
    ).rejects.toThrow(/insufficient stock/i);
  });

  // ==========================================
  // Test 5: Reject Guest Subscription Creation
  // ==========================================
  it("rejects unauthenticated subscription creation attempts", async () => {
    await expect(
      guestCaller.subscriptions.create({
        productId: eligibleProduct.id,
        frequency: "30_DAYS",
        quantity: 1,
        paymentPreference: "COD",
        deliveryAddress: {
          fullName: "Guest",
          phone: "9876543210",
          addressLine1: "Road 1",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
      })
    ).rejects.toThrow();
  });

  // ==========================================
  // Test 6: Customer Isolation & Security
  // ==========================================
  it("prevents Customer B from viewing, pausing, skipping or cancelling Customer A's subscription", async () => {
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    // Customer B cannot get details
    await expect(
      otherCustomerCaller.subscriptions.getById({ id: sub.id })
    ).rejects.toThrow(/Access denied|not authorized/i);

    // Customer B cannot pause
    await expect(
      otherCustomerCaller.subscriptions.pause({ id: sub.id, reason: "Unauthorized attempt" })
    ).rejects.toThrow(/Access denied|not authorized/i);

    // Customer B cannot skip
    await expect(
      otherCustomerCaller.subscriptions.skipNext({ id: sub.id })
    ).rejects.toThrow(/Access denied|not authorized/i);

    // Customer B cannot update
    await expect(
      otherCustomerCaller.subscriptions.update({ id: sub.id, quantity: 5 })
    ).rejects.toThrow(/Access denied|not authorized/i);

    // Customer B cannot cancel
    await expect(
      otherCustomerCaller.subscriptions.cancel({ id: sub.id, reason: "Unauthorized attempt" })
    ).rejects.toThrow(/Access denied|not authorized/i);
  });

  // ==========================================
  // Test 7: Pause and Resume Lifecycle
  // ==========================================
  it("allows customer to pause and resume subscription with proper schedule recalibration", async () => {
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    // Pause
    const paused = await customerCaller.subscriptions.pause({
      id: sub.id,
      reason: "Traveling out of town for holidays",
    });
    expect(paused.status).toBe("PAUSED");
    expect(paused.pauseReason).toBe("Traveling out of town for holidays");

    // History check
    const database = db.getDatabase();
    const pauseHist = database.prepare("SELECT * FROM subscription_history WHERE subscription_id = ? AND action = 'PAUSED'").get(sub.id);
    expect(pauseHist).toBeDefined();

    // Resume
    const resumed = await customerCaller.subscriptions.resume({ id: sub.id });
    expect(resumed.status).toBe("ACTIVE");
    expect(resumed.pauseReason).toBeNull();

    const resumeHist = database.prepare("SELECT * FROM subscription_history WHERE subscription_id = ? AND action = 'RESUMED'").get(sub.id);
    expect(resumeHist).toBeDefined();
  });

  // ==========================================
  // Test 8: Skip Next Scheduled Delivery
  // ==========================================
  it("skips next delivery cycle and advances next scheduled delivery date without generating an order", async () => {
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    const originalNextDate = new Date(sub.nextDeliveryDate).getTime();
    const skipped = await customerCaller.subscriptions.skipNext({ id: sub.id });

    const newNextDate = new Date(skipped.nextDeliveryDate).getTime();
    expect(newNextDate).toBeGreaterThan(originalNextDate);

    // Verify cycle was marked SKIPPED
    const database = db.getDatabase();
    const cycle = database.prepare("SELECT * FROM subscription_cycles WHERE subscription_id = ? AND status = 'SKIPPED'").get(sub.id);
    expect(cycle).toBeDefined();
    expect(cycle.status).toBe("SKIPPED");
  });

  // ==========================================
  // Test 9: Update Subscription Preferences (Quantity & Frequency)
  // ==========================================
  it("updates subscription quantity and frequency, recalibrating totals and intervals", async () => {
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      variantId: variantProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    // Update quantity to reach free shipping threshold (>= 799)
    const targetQty = Math.ceil(800 / sub.unitPrice);
    const expectedSubtotal = targetQty * sub.unitPrice;

    const updated = await customerCaller.subscriptions.update({
      id: sub.id,
      quantity: targetQty,
      frequency: "60_DAYS",
    });

    expect(updated.quantity).toBe(targetQty);
    expect(updated.subtotal).toBe(expectedSubtotal);
    expect(updated.shippingFee).toBe(0);
    expect(updated.totalPerCycle).toBe(expectedSubtotal);
    expect(updated.frequency).toBe("60_DAYS");
    expect(updated.frequencyDays).toBe(60);
  });

  // ==========================================
  // Test 10: Cancellation Lifecycle
  // ==========================================
  it("cancels subscription with reason, cancels pending cycles and prevents further operations", async () => {
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    const cancelled = await customerCaller.subscriptions.cancel({
      id: sub.id,
      reason: "No longer needing daily Moringa",
    });

    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancellationReason).toBe("No longer needing daily Moringa");

    // Cannot pause cancelled subscription
    await expect(
      customerCaller.subscriptions.pause({ id: sub.id, reason: "Pause attempt" })
    ).rejects.toThrow(/cannot.*pause|Cancelled/i);

    // Cannot resume cancelled subscription
    await expect(
      customerCaller.subscriptions.resume({ id: sub.id })
    ).rejects.toThrow(/cannot.*resume|Cancelled/i);

    // Cannot skip cancelled subscription
    await expect(
      customerCaller.subscriptions.skipNext({ id: sub.id })
    ).rejects.toThrow(/cannot.*skip|Only active/i);
  });

  // ==========================================
  // Test 11: Idempotent Recurring Cycle Processing (COD)
  // ==========================================
  it("processes due recurring cycles, decrements inventory, creates linked order and advances schedule", async () => {
    const database = db.getDatabase();
    // Create an active subscription
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 2,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera Sundaram",
        phone: "9876543210",
        addressLine1: "12 Perundurai Road",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638011",
      },
    });

    // Set next delivery date in the past so it is due
    database.prepare(`
      UPDATE customer_subscriptions
      SET next_delivery_date = datetime('now', '-2 days')
      WHERE id = ?
    `).run(sub.id);

    // Record baseline product stock
    const initialProduct = db.productsRepo.getById(eligibleProduct.id);
    const initialStock = initialProduct.stock;

    // Trigger processing specifically for this subscription
    const results = await db.subscriptionsRepo.processDueCycles({ subscriptionId: sub.id });
    expect(results.succeeded).toBe(1);

    // Verify cycle was generated
    const cycle = database.prepare("SELECT * FROM subscription_cycles WHERE subscription_id = ? AND cycle_number = 1").get(sub.id);
    expect(cycle).toBeDefined();
    expect(cycle.status).toBe("ORDER_GENERATED");
    expect(cycle.order_id).toBeDefined();

    // Verify order was created in orders table
    const order = database.prepare("SELECT * FROM orders WHERE id = ?").get(cycle.order_id);
    expect(order).toBeDefined();
    expect(order.isSubscriptionOrder).toBe(1);
    expect(order.subscriptionId).toBe(sub.id);
    expect(order.subscriptionCycleId).toBe(cycle.cycle_reference);
    expect(order.paymentMethod).toBe("COD");

    // Verify stock was decremented
    const updatedProduct = db.productsRepo.getById(eligibleProduct.id);
    expect(updatedProduct.stock).toBe(initialStock - sub.quantity);

    // Verify subscription next delivery date was advanced
    const updatedSub = db.subscriptionsRepo.getById(sub.id);
    const advancedDate = new Date(updatedSub.nextDeliveryDate).getTime();
    const pastDate = new Date().getTime() - 2 * 24 * 3600 * 1000;
    expect(advancedDate).toBeGreaterThan(pastDate);

    // Verify cycle 2 is now scheduled
    const nextCycle = database.prepare("SELECT * FROM subscription_cycles WHERE subscription_id = ? AND cycle_number = 2").get(sub.id);
    expect(nextCycle).toBeDefined();
    expect(nextCycle.status).toBe("PENDING");
  });

  // ==========================================
  // Test 12: Duplicate Cycle Prevention (Idempotency)
  // ==========================================
  it("prevents duplicate order generation for already-processed cycles", async () => {
    const database = db.getDatabase();
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera Sundaram",
        phone: "9876543210",
        addressLine1: "12 Perundurai Road",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638011",
      },
    });

    database.prepare(`
      UPDATE customer_subscriptions
      SET next_delivery_date = datetime('now', '-2 days')
      WHERE id = ?
    `).run(sub.id);

    // Process first time
    await db.subscriptionsRepo.processDueCycles({ subscriptionId: sub.id });
    const countAfterFirst = database.prepare("SELECT COUNT(*) as count FROM orders WHERE subscriptionId = ?").get(sub.id).count;
    expect(countAfterFirst).toBe(1);

    // Process second time immediately (should be idempotent and not create duplicate order)
    await db.subscriptionsRepo.processDueCycles({ subscriptionId: sub.id });
    const countAfterSecond = database.prepare("SELECT COUNT(*) as count FROM orders WHERE subscriptionId = ?").get(sub.id).count;
    expect(countAfterSecond).toBe(1);
  });

  // ==========================================
  // Test 13: Insufficient Inventory During Cycle Processing
  // ==========================================
  it("handles out of stock during due cycle processing by marking cycle FAILED and alerting admin", async () => {
    const database = db.getDatabase();
    const ts = Date.now();
    const lowStockProdId = "prod_low_stock_" + ts;
    database.prepare(`
      INSERT INTO products (id, sku, nameEn, nameTa, slug, sellingPrice, mrp, discountPrice, stock, isSubscriptionEligible, isCodAvailable, status, createdAt, updatedAt)
      VALUES (?, ?, 'Rare Red Sandalwood Powder', 'சந்தனம்', ?, 450, 500, 450, 10, 1, 1, 'Published', datetime('now'), datetime('now'))
    `).run(lowStockProdId, "SKU-LOW-" + ts, "rare-sandalwood-" + ts);

    const sub = await customerCaller.subscriptions.create({
      productId: lowStockProdId,
      frequency: "30_DAYS",
      quantity: 5,
      paymentPreference: "COD",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    // Now drop stock to 0 to simulate stockout before renewal
    database.prepare("UPDATE products SET stock = 0 WHERE id = ?").run(lowStockProdId);

    // Set next delivery date in the past
    database.prepare(`
      UPDATE customer_subscriptions
      SET next_delivery_date = datetime('now', '-1 day')
      WHERE id = ?
    `).run(sub.id);

    // Run cycle processing
    const results = await db.subscriptionsRepo.processDueCycles();
    const failedItem = results.results.find((d: any) => d.subscriptionId === sub.id);
    expect(failedItem).toBeDefined();
    expect(failedItem.status).toBe("FAILED");
    expect(failedItem.reason).toMatch(/insufficient stock|inventory/i);

    // Cycle in database must be FAILED
    const cycle = database.prepare("SELECT * FROM subscription_cycles WHERE subscription_id = ? AND cycle_number = 1").get(sub.id);
    expect(cycle.status).toBe("FAILED");
    expect(cycle.failure_reason).toMatch(/insufficient stock|inventory/i);

    // Schedule must NOT have been advanced
    const subAfter = db.subscriptionsRepo.getById(sub.id);
    expect(new Date(subAfter.nextDeliveryDate).getTime()).toBeLessThan(Date.now());
  });

  // ==========================================
  // Test 14: Manual Renewal Payment Flow (Option B)
  // ==========================================
  it("supports manual renewal payment processing for online subscriptions", async () => {
    const database = db.getDatabase();
    const sub = await customerCaller.subscriptions.create({
      productId: eligibleProduct.id,
      frequency: "30_DAYS",
      quantity: 1,
      paymentPreference: "MANUAL_RENEWAL",
      deliveryAddress: {
        fullName: "Meera",
        phone: "9876543210",
        addressLine1: "Road 1",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      },
    });

    // Set next delivery date in the past so it triggers renewal payment request
    database.prepare(`
      UPDATE customer_subscriptions
      SET next_delivery_date = datetime('now', '-1 day')
      WHERE id = ?
    `).run(sub.id);

    // Processing marks cycle PAYMENT_PENDING
    const results = await db.subscriptionsRepo.processDueCycles();
    const pendingItem = results.results.find((d: any) => d.subscriptionId === sub.id);
    expect(pendingItem).toBeDefined();
    expect(pendingItem.status).toBe("PAYMENT_PENDING");

    // Cycle in DB must be PAYMENT_PENDING
    const cycle = database.prepare("SELECT * FROM subscription_cycles WHERE subscription_id = ? AND cycle_number = 1").get(sub.id);
    expect(cycle.status).toBe("PAYMENT_PENDING");

    // Customer completes payment
    const paymentResult = await customerCaller.subscriptions.payRenewal({
      cycleId: cycle.id,
      razorpayPaymentId: "pay_test_phase7_" + Date.now(),
    });

    expect(paymentResult.order).toBeDefined();
    expect(paymentResult.order.id).toBeDefined();

    // Cycle must now be ORDER_GENERATED
    const updatedCycle = database.prepare("SELECT * FROM subscription_cycles WHERE id = ?").get(cycle.id);
    expect(updatedCycle.status).toBe("ORDER_GENERATED");
  });

  // ==========================================
  // Test 15: Admin Subscriptions Management
  // ==========================================
  it("allows administrators to view KPI stats, filter subscriptions, and trigger batch processing", async () => {
    const stats = await adminCaller.admin.subscriptions.getStats();
    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.active).toBeGreaterThanOrEqual(1);

    const list = await adminCaller.admin.subscriptions.list({
      status: "ACTIVE",
      limit: 10,
    });
    expect(list.subscriptions).toBeDefined();
    expect(Array.isArray(list.subscriptions)).toBe(true);

    // Admin can trigger batch processing
    const processResult = await adminCaller.admin.subscriptions.processDueCycles();
    expect(processResult.totalEligible).toBeDefined();
    expect(processResult.results).toBeDefined();
  });

  // ==========================================
  // Test 16: Role-Based Access Control (Retail Shop Handler Denied)
  // ==========================================
  it("strictly denies Retail Shop Handler access to admin subscription management procedures", async () => {
    await expect(
      retailCaller.admin.subscriptions.getStats()
    ).rejects.toThrow(/permission|Access denied|forbidden|admin only/i);

    await expect(
      retailCaller.admin.subscriptions.list({})
    ).rejects.toThrow(/permission|Access denied|forbidden|admin only/i);

    await expect(
      retailCaller.admin.subscriptions.processDueCycles()
    ).rejects.toThrow(/permission|Access denied|forbidden|admin only/i);
  });
});
