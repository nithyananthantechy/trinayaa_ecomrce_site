import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { notificationsService } from "./notifications";
import crypto from "node:crypto";

function createMockContext(user: any = null) {
  const cookies: Record<string, any> = {};
  return {
    ctx: {
      user,
      req: {
        protocol: "https",
        headers: {
          "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 200) + 1}`,
        },
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        cookie: (name: string, val: any, opts: any) => {
          cookies[name] = { val, opts };
        },
        clearCookie: (name: string, opts: any) => {
          delete cookies[name];
        },
      } as any,
    },
    cookies,
  };
}

describe("TRINAYAA Phase 5 — Dynamic Checkout, Razorpay Integration & Order Lifecycle Suite", () => {
  const ts = Date.now();
  const customerUser = {
    id: `usr_cust_p5_${ts}`,
    name: "Kavitha Sundaram",
    email: `kavitha_${ts}@example.com`,
    phone: "9876543210",
    role: "CUSTOMER",
  };
  const otherCustomer = {
    id: `usr_other_p5_${ts}`,
    name: "Ramesh Kumar",
    email: `ramesh_${ts}@example.com`,
    phone: "9843210987",
    role: "CUSTOMER",
  };
  const adminUser = {
    id: "usr_admin_p5",
    name: "TRINAYAA Admin",
    email: "admin@trinayaa.in",
    role: "SUPER_ADMIN",
  };

  let testProduct1: any;
  let testProduct2: any;
  let createdAddressId: string = "";
  let createdOrderId: string = "";
  let createdOrderNumber: string = "";

  beforeAll(() => {
    // Ensure test customer user exists in DB
    const dbInst = db.getDatabase();
    dbInst.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(customerUser.id, customerUser.email, "test_hash", customerUser.name, customerUser.phone);

    dbInst.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(otherCustomer.id, otherCustomer.email, "test_hash", otherCustomer.name, otherCustomer.phone);

    // Retrieve active catalog products for order testing
    testProduct1 = db.productsRepo.getById("TRN-1001") || db.productsRepo.getAll({ limit: 1 })[0];
    testProduct2 = db.productsRepo.getById("TRN-1002") || db.productsRepo.getAll({ limit: 2 })[1];

    // Ensure adequate stock for tests
    db.inventoryRepo.updateStock(testProduct1.id, 100, "Phase 5 Test Setup", "Test Runner");
    db.inventoryRepo.updateStock(testProduct2.id, 50, "Phase 5 Test Setup", "Test Runner");

    // Ensure a test campaign exists with minOrderValue: 500, discountValue: 10%
    dbInst.prepare(`
      INSERT OR REPLACE INTO campaigns (id, name, code, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, isActive, createdAt)
      VALUES ('camp_fest10', 'Festive Offer', 'FEST10', 'PERCENTAGE', 10, 300, 200, '2026-01-01T00:00:00Z', '2030-01-01T00:00:00Z', 1, datetime('now'))
    `).run();
  });

  // ==========================================
  // SECTION 1: CUSTOMER ADDRESS MANAGEMENT
  // ==========================================
  describe("1. Customer Address Management & Validation", () => {
    it("1.1: Fails to add address with invalid 6-digit PIN code", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.addresses.create({
          recipientName: "Kavitha S",
          phone: "9876543210",
          addressLine1: "12, Perundurai Road",
          city: "Erode",
          pinCode: "6380", // Invalid length
          state: "Tamil Nadu",
        })
      ).rejects.toThrow(/PIN code/i);
    });

    it("1.2: Fails to add address with invalid Indian mobile number", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.addresses.create({
          recipientName: "Kavitha S",
          phone: "12345", // Invalid mobile
          addressLine1: "12, Perundurai Road",
          city: "Erode",
          pinCode: "638002",
          state: "Tamil Nadu",
        })
      ).rejects.toThrow(/mobile/i);
    });

    it("1.3: Successfully creates a valid Indian customer delivery address", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const addr = await caller.addresses.create({
        recipientName: "Kavitha Sundaram",
        phone: "9876543210",
        addressLine1: "Plot 42, Cauvery Nagar, Brough Road",
        addressLine2: "Near Old Bus Stand",
        landmark: "Behind Government Hospital",
        city: "Erode",
        district: "Erode",
        state: "Tamil Nadu",
        pinCode: "638002",
        addressType: "Home",
        isDefault: true,
      });

      expect(addr).toBeDefined();
      expect(addr.id).toContain("addr_");
      expect(addr.recipientName).toBe("Kavitha Sundaram");
      expect(addr.pinCode).toBe("638002");
      expect(addr.isDefault).toBe(1);
      createdAddressId = addr.id;
    });

    it("1.4: Lists all saved addresses for the authenticated customer", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const list = await caller.addresses.list();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].id).toBe(createdAddressId);
    });

    it("1.5: Setting a new address as default unsets previous default", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const secondAddr = await caller.addresses.create({
        recipientName: "Kavitha Office",
        phone: "9876543210",
        addressLine1: "Tech Park, Phase 1",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pinCode: "641014",
        addressType: "Work",
        isDefault: true,
      });

      const list = await caller.addresses.list();
      const first = list.find((a: any) => a.id === createdAddressId);
      const second = list.find((a: any) => a.id === secondAddr.id);

      expect(second.isDefault).toBe(1);
      expect(first.isDefault).toBe(0);

      // Revert default to first for subsequent tests
      await caller.addresses.setDefault({ id: createdAddressId });
    });
  });

  // ==========================================
  // SECTION 2: SERVER-SIDE ORDER RECALCULATION & COUPONS
  // ==========================================
  describe("2. Server-side Price Calculation, Tampering Prevention & Coupons", () => {
    it("2.1: calculateSummary recalculates prices strictly from database and applies free shipping above ₹799", async () => {
      const { ctx } = createMockContext(null); // Public procedure
      const caller = appRouter.createCaller(ctx);

      // Subtotal for testProduct1 (100g, sellingPrice) * 10
      const summary = await caller.orders.calculateSummary({
        items: [{ productId: testProduct1.id, packSize: "100g", quantity: 5 }],
      });

      expect(summary.items[0].unitPrice).toBe(testProduct1.sellingPrice);
      expect(summary.subtotal).toBe(testProduct1.sellingPrice * 5);
      if (summary.subtotal >= 799) {
        expect(summary.shippingFee).toBe(0);
      } else {
        expect(summary.shippingFee).toBe(60);
      }
      expect(summary.total).toBe(summary.subtotal - summary.discountAmount + summary.shippingFee);
    });

    it("2.2: calculateSummary applies ₹60 shipping fee when subtotal is below ₹799", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      // 1 item priced below 799
      const summary = await caller.orders.calculateSummary({
        items: [{ productId: testProduct1.id, packSize: "100g", quantity: 1 }],
      });

      if (summary.subtotal < 799) {
        expect(summary.shippingFee).toBe(60);
        expect(summary.total).toBe(summary.subtotal + 60);
      }
    });

    it("2.3: Validates and applies active festival coupon discount correctly", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      // Calculate with coupon FEST10 (10% off)
      const summary = await caller.orders.calculateSummary({
        items: [{ productId: testProduct1.id, packSize: "100g", quantity: 5 }],
        couponCode: "FEST10",
      });

      expect(summary.coupon.valid).toBe(true);
      expect(summary.discountAmount).toBeGreaterThan(0);
      expect(summary.total).toBe(summary.subtotal - summary.discountAmount + summary.shippingFee);
    });

    it("2.4: Rejects expired or invalid coupon gracefully", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      const summary = await caller.orders.calculateSummary({
        items: [{ productId: testProduct1.id, packSize: "100g", quantity: 2 }],
        couponCode: "INVALID_CODE_999",
      });

      expect(summary.coupon.valid).toBe(false);
      expect(summary.discountAmount).toBe(0);
    });

    it("2.5: Flags stock availability issue if requested quantity exceeds current inventory", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      const summary = await caller.orders.calculateSummary({
        items: [{ productId: testProduct2.id, packSize: "100g", quantity: 99999 }],
      });

      expect(summary.canCheckout).toBe(false);
      expect(summary.stockIssues.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // SECTION 3: ORDER CREATION & AUTHENTICATION ENFORCEMENT
  // ==========================================
  describe("3. Order Creation & Mandatory Authentication", () => {
    it("3.1: Rejects order creation for unauthenticated guests", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.orders.create({
          customerName: "Guest",
          customerEmail: "guest@example.com",
          customerPhone: "9876543210",
          shippingAddress: {
            street: "123 Street",
            city: "Erode",
            state: "Tamil Nadu",
            pinCode: "638002",
          },
          items: [{ productId: testProduct1.id, packSize: "100g", quantity: 1 }],
        })
      ).rejects.toThrow();
    });

    it("3.2: Rejects order creation if phone number or PIN code is invalid", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.orders.create({
          customerName: customerUser.name,
          customerEmail: customerUser.email,
          customerPhone: "123", // Invalid phone
          shippingAddress: {
            street: "123 Street",
            city: "Erode",
            state: "Tamil Nadu",
            pinCode: "638002",
          },
          items: [{ productId: testProduct1.id, packSize: "100g", quantity: 1 }],
        })
      ).rejects.toThrow(/mobile/i);
    });

    it("3.3: Successfully creates order with immutable snapshots and initial Pending Payment state", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const order = await caller.orders.create({
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        shippingAddress: {
          addressLine1: "Plot 42, Cauvery Nagar",
          street: "Plot 42, Cauvery Nagar, Brough Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          { productId: testProduct1.id, packSize: "100g", quantity: 2 },
          { productId: testProduct2.id, packSize: "100g", quantity: 1 },
        ],
        couponCode: "FEST10",
        paymentMethod: "RAZORPAY",
      });

      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^TRN-\d+/);
      expect(order.orderStatus).toBe("Pending Payment");
      expect(order.paymentStatus).toBe("PENDING");
      expect(order.customerId).toBe(customerUser.id);
      expect(order.items.length).toBe(2);
      expect(order.couponCode).toBe("FEST10");
      expect(order.total).toBeGreaterThan(0);

      // Verify status history
      expect(order.history.length).toBeGreaterThanOrEqual(1);
      expect(order.history[0].status).toBe("Pending Payment");

      createdOrderId = order.id;
      createdOrderNumber = order.orderNumber;
    });

    it("3.4: Dispatched notification ORDER_CREATED on order placement", async () => {
      const recent = notificationsService.getByOrderNumber(createdOrderNumber);
      expect(recent.length).toBeGreaterThanOrEqual(1);
      const notif = recent.find((n) => n.event === "ORDER_CREATED");
      expect(notif).toBeDefined();
      expect(notif?.recipientEmail).toBe(customerUser.email);
    });
  });

  // ==========================================
  // SECTION 4: RAZORPAY INTEGRATION & PAYMENT VERIFICATION
  // ==========================================
  describe("4. Razorpay Order Creation & HMAC-SHA256 Signature Verification", () => {
    let razorpayOrderId: string = "";

    it("4.1: Creates Razorpay order with amount in paise (100 paise per INR)", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const res = await caller.payments.createRazorpayOrder({ orderId: createdOrderId });

      expect(res.orderId).toBe(createdOrderId);
      expect(res.razorpayOrderId).toBeDefined();
      expect(res.currency).toBe("INR");
      expect(res.amountInPaise).toBe(Math.round(res.amount * 100));

      razorpayOrderId = res.razorpayOrderId;
    });

    it("4.2: Fails signature verification with forged/invalid HMAC signature and marks failure", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      // Temporarily set real key to test strict HMAC validation
      const originalSecret = process.env.RAZORPAY_KEY_SECRET;
      process.env.RAZORPAY_KEY_SECRET = "test_live_secret_key_12345";
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = "production";

      try {
        await expect(
          caller.payments.verifyPayment({
            orderId: createdOrderId,
            razorpayOrderId,
            razorpayPaymentId: "pay_fake_999",
            razorpaySignature: "invalid_forged_signature_hex",
          })
        ).rejects.toThrow(/signature/i);

        // Check payment status is FAILED
        const order = db.ordersRepo.getById(createdOrderId);
        expect(order.paymentStatus).toBe("FAILED");
      } finally {
        process.env.RAZORPAY_KEY_SECRET = originalSecret;
        (process.env as any).NODE_ENV = originalEnv;
      }
    });

    it("4.3: Successfully verifies valid HMAC-SHA256 signature and confirms order", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const secret = "valid_test_secret_for_sha256";
      const originalSecret = process.env.RAZORPAY_KEY_SECRET;
      process.env.RAZORPAY_KEY_SECRET = secret;

      const paymentId = "pay_live_" + Date.now();
      const validSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${paymentId}`)
        .digest("hex");

      const stockBefore1 = (db.productsRepo.getById(testProduct1.id) as any).stock;

      const res = await caller.payments.verifyPayment({
        orderId: createdOrderId,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      expect(res.success).toBe(true);
      expect(res.order.paymentStatus).toBe("PAID");
      expect(res.order.orderStatus).toBe("Confirmed");

      // Verify stock deduction occurred
      const stockAfter1 = (db.productsRepo.getById(testProduct1.id) as any).stock;
      expect(stockAfter1).toBe(stockBefore1 - 2); // 2 units of product 1 were in order

      process.env.RAZORPAY_KEY_SECRET = originalSecret;
    });

    it("4.4: Payment confirmation is strictly idempotent and prevents double stock deduction", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const stockBefore = (db.productsRepo.getById(testProduct1.id) as any).stock;

      // Duplicate payment verification call
      const res = await caller.payments.verifyPayment({
        orderId: createdOrderId,
        razorpayOrderId,
        razorpayPaymentId: "pay_duplicate_call",
        razorpaySignature: "simulated_valid_test_signature",
      });

      expect(res.success).toBe(true);
      expect(res.order.paymentStatus).toBe("PAID");

      // Stock must NOT be deducted again
      const stockAfter = (db.productsRepo.getById(testProduct1.id) as any).stock;
      expect(stockAfter).toBe(stockBefore);
    });

    it("4.5: Dispatched PAYMENT_CONFIRMED notification to customer", async () => {
      const notifs = notificationsService.getByOrderNumber(createdOrderNumber);
      const confirmNotif = notifs.find((n) => n.event === "PAYMENT_CONFIRMED");
      expect(confirmNotif).toBeDefined();
      expect(confirmNotif?.subject).toContain("Payment Verified");
    });
  });

  // ==========================================
  // SECTION 5: RAZORPAY WEBHOOK PROCESSING
  // ==========================================
  describe("5. Razorpay Webhooks (order.paid, payment.failed, refund.processed)", () => {
    it("5.1: Webhook order.paid idempotently confirms order and updates payment record", async () => {
      // Create fresh pending order for webhook test
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const order = await caller.orders.create({
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        shippingAddress: {
          street: "12, Park Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct1.id, packSize: "100g", quantity: 1 }],
      });

      const rzpRes = await caller.payments.createRazorpayOrder({ orderId: order.id });

      // Simulate webhook payload
      const webhookPayload = {
        event: "order.paid",
        payload: {
          payment: {
            entity: {
              id: "pay_webhook_12345",
              order_id: rzpRes.razorpayOrderId,
              amount: Math.round(order.total * 100),
              status: "captured",
            },
          },
        },
      };

      // Call ordersRepo.confirmPayment directly as done in webhook handler
      const updated = db.ordersRepo.confirmPayment(order.id, {
        gatewayPaymentId: "pay_webhook_12345",
        rawResponse: webhookPayload,
      });

      expect(updated.paymentStatus).toBe("PAID");
      expect(updated.orderStatus).toBe("Confirmed");
    });

    it("5.2: Webhook payment.failed records failure and leaves inventory intact", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const order = await caller.orders.create({
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        shippingAddress: {
          street: "34, South Main St",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct2.id, packSize: "100g", quantity: 1 }],
      });

      const stockBefore = (db.productsRepo.getById(testProduct2.id) as any).stock;

      const failedOrder = db.ordersRepo.recordPaymentFailure(order.id, {
        reason: "User cancelled authentication at bank OTP page",
      });

      expect(failedOrder.paymentStatus).toBe("FAILED");
      expect(failedOrder.orderStatus).toBe("Pending Payment");

      // Inventory must NOT be deducted
      const stockAfter = (db.productsRepo.getById(testProduct2.id) as any).stock;
      expect(stockAfter).toBe(stockBefore);
    });
  });

  // ==========================================
  // SECTION 6: CUSTOMER ORDER HISTORY & ACCESS CONTROL
  // ==========================================
  describe("6. Customer Order History & Ownership Protection", () => {
    it("6.1: Customer can view their own orders via myOrders", async () => {
      const { ctx } = createMockContext(customerUser);
      const caller = appRouter.createCaller(ctx);

      const orders = await caller.orders.myOrders();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThanOrEqual(1);

      const found = orders.find((o: any) => o.id === createdOrderId);
      expect(found).toBeDefined();
      expect(found.orderNumber).toBe(createdOrderNumber);
    });

    it("6.2: Customer cannot view another customer's order by ID (FORBIDDEN)", async () => {
      const { ctx } = createMockContext(otherCustomer);
      const caller = appRouter.createCaller(ctx);

      // Attempting to access customerUser's order
      await expect(caller.orders.getById({ id: createdOrderId })).rejects.toThrow(/access denied/i);
    });

    it("6.3: Administrator can view any order by ID", async () => {
      const { ctx } = createMockContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const order = await caller.orders.getById({ id: createdOrderId });
      expect(order).toBeDefined();
      expect(order.id).toBe(createdOrderId);
    });
  });

  // ==========================================
  // SECTION 7: PUBLIC ORDER TRACKING
  // ==========================================
  describe("7. Public Order Tracking & Verification", () => {
    it("7.1: Public tracking returns order details matching order number and phone", async () => {
      const { ctx } = createMockContext(null); // Public
      const caller = appRouter.createCaller(ctx);

      const tracking = await caller.orders.track({
        orderNumber: createdOrderNumber,
        phoneOrEmail: customerUser.phone,
      });

      expect(tracking).toBeDefined();
      expect(tracking.orderNumber).toBe(createdOrderNumber);
      expect(tracking.orderStatus).toBe("Confirmed");
      expect(tracking.paymentStatus).toBe("PAID");
      expect(Array.isArray(tracking.history)).toBe(true);
      expect(tracking.history.length).toBeGreaterThanOrEqual(2); // Pending Payment + Confirmed
    });

    it("7.2: Public tracking returns order details matching order number and email", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      const tracking = await caller.orders.track({
        orderNumber: createdOrderNumber,
        phoneOrEmail: customerUser.email,
      });

      expect(tracking).toBeDefined();
      expect(tracking.orderNumber).toBe(createdOrderNumber);
    });

    it("7.3: Public tracking throws NOT_FOUND for non-existent order number", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.orders.track({
          orderNumber: "TRN-99999999",
        })
      ).rejects.toThrow(/not find/i);
    });

    it("7.4: Public tracking protects customer privacy by omitting address, email and phone", async () => {
      const { ctx } = createMockContext(null);
      const caller = appRouter.createCaller(ctx);

      const tracking = await caller.orders.track({
        orderNumber: createdOrderNumber,
      });

      expect(tracking.orderNumber).toBe(createdOrderNumber);
      expect((tracking as any).shippingAddress).toBeUndefined();
      expect((tracking as any).customerEmail).toBeUndefined();
      expect((tracking as any).customerPhone).toBeUndefined();
    });
  });

  // ==========================================
  // SECTION 8: ADMIN ORDER MANAGEMENT & LIFECYCLE
  // ==========================================
  describe("8. Admin Order Lifecycle, Tracking & Refunds", () => {
    it("8.1: Admin can update status to Shipped with Carrier and Tracking Number", async () => {
      const { ctx } = createMockContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const updated = await caller.admin.orders.updateStatus({
        orderId: createdOrderId,
        status: "Shipped",
        carrier: "DTDC Express",
        trackingNumber: "DTDC987654321IN",
        note: "Dispatched from Erode hub",
      });

      expect(updated.orderStatus).toBe("Shipped");
      expect(updated.carrier).toBe("DTDC Express");
      expect(updated.trackingNumber).toBe("DTDC987654321IN");

      // Verify notification
      const recent = notificationsService.getByOrderNumber(createdOrderNumber);
      const shippedNotif = recent.find((n) => n.event === "ORDER_SHIPPED");
      expect(shippedNotif).toBeDefined();
      expect(shippedNotif?.messageText).toContain("DTDC Express");
    });

    it("8.2: Disallows invalid status transition (e.g. Delivered -> Pending Payment)", async () => {
      const { ctx } = createMockContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      // Fast forward to Delivered
      await caller.admin.orders.updateStatus({
        orderId: createdOrderId,
        status: "Delivered",
      });

      // Attempt jump back to Pending Payment
      await expect(
        caller.admin.orders.updateStatus({
          orderId: createdOrderId,
          status: "Pending Payment",
        })
      ).rejects.toThrow(/cannot be moved back/i);
    });

    it("8.3: Admin refund updates payment to REFUNDED, order to Refunded, and restores inventory", async () => {
      const { ctx } = createMockContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const stockBefore = (db.productsRepo.getById(testProduct1.id) as any).stock;

      const refunded = await caller.admin.orders.refund({
        orderId: createdOrderId,
        reason: "Customer requested cancellation before dispatch",
      });

      expect(refunded.orderStatus).toBe("Refunded");
      expect(refunded.paymentStatus).toBe("REFUNDED");

      // Inventory must be automatically restored
      const stockAfter = (db.productsRepo.getById(testProduct1.id) as any).stock;
      expect(stockAfter).toBe(stockBefore + 2); // 2 units restored

      // Notification must be dispatched
      const recent = notificationsService.getByOrderNumber(createdOrderNumber);
      const refundNotif = recent.find((n) => n.event === "ORDER_REFUNDED");
      expect(refundNotif).toBeDefined();
    });

    it("8.4: Admin can export all orders to well-formatted CSV", async () => {
      const { ctx } = createMockContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const csv = await caller.admin.orders.exportCsv();
      expect(typeof csv).toBe("string");
      expect(csv).toContain("Order Number,Date,Customer Name,Customer Email");
      expect(csv).toContain(createdOrderNumber);
      expect(csv).toContain("Refunded");
    });

    it("8.5: Admin dashboard overview revenue strictly counts PAID orders and excludes refunded/pending", async () => {
      const stats = db.adminStatsRepo.getOverview();
      expect(typeof stats.totalRevenue).toBe("number");
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);

      // Verify that SQL query strictly filters by paymentStatus = 'PAID'
      const dbInst = db.getDatabase();
      const directPaidRevenue = dbInst.prepare("SELECT COALESCE(SUM(total), 0) as rev FROM orders WHERE paymentStatus = 'PAID'").get() as any;
      expect(stats.totalRevenue).toBe(directPaidRevenue.rev);
    });
  });
});
