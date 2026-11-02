import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { handleTelegramUpdate } from "./telegram";
import crypto from "node:crypto";

function createMockContext(user: any = null) {
  const cookies: Record<string, any> = {};
  return {
    ctx: {
      user,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {
        cookie: (name: string, val: any, opts: any) => {
          cookies[name] = { val, opts };
        },
        clearCookie: (name: string) => {
          delete cookies[name];
        },
      } as any,
    },
    cookies,
  };
}

describe("TRINAYAA E-Commerce Functional & Acceptance Tests", () => {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";
  let registeredUserId: string = "";

  // 1. Customer registration
  it("1. Customer registration hashes password and returns session", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      email: testEmail,
      password: testPassword,
      name: "Lakshmi Narayanan",
      phone: "+919876543210",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.token).toBeDefined();
    registeredUserId = result.user.id;

    const dbUser = db.usersRepo.getByEmail(testEmail);
    expect(dbUser).toBeDefined();
    expect(dbUser.passwordHash).not.toBe(testPassword);
    expect(dbUser.passwordHash).toContain(":");
  });

  // 2. Customer login
  it("2. Customer login verifies password and returns user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result.user.email).toBe(testEmail);
    expect(result.token).toBeDefined();

    // Invalid password should fail
    await expect(
      caller.auth.login({ email: testEmail, password: "WrongPassword!" })
    ).rejects.toThrow("Invalid email or password");
  });

  // 3. Guest browsing
  it("3. Guest can browse products without logging in", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list({ limit: 10 });
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].nameEn).toBeDefined();
    expect(products[0].price).toBeGreaterThan(0);
  });

  // 4. Guest cart persistence
  it("4. Guest cart persists items using guestToken", async () => {
    const guestToken = "guest_token_" + Date.now();
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list({ limit: 1 });
    const product = products[0];

    const addRes = await caller.cart.add({
      guestToken,
      productId: product.id,
      packSize: "100 g",
      unitPrice: product.price,
      quantity: 2,
    });

    expect(addRes.items.length).toBeGreaterThan(0);

    const fetchedCart = await caller.cart.get({ guestToken });
    expect(fetchedCart.items.some((i: any) => i.productId === product.id)).toBe(true);
  });

  // 5. Mandatory login before checkout
  it("5. Mandatory login before checkout is strictly enforced by protectedProcedure", async () => {
    const { ctx } = createMockContext(null); // Unauthenticated context
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.create({
        customerName: "Guest User",
        customerEmail: "guest@example.com",
        customerPhone: "+919876543210",
        shippingAddress: {
          street: "123 Herb Lane",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: "prod_sample", packSize: "100 g", quantity: 1 }],
      })
    ).rejects.toThrow();
  });

  // 6 & 7. Product creation and editing
  let createdProductId = "";
  it("6 & 7. Product creation and editing works dynamically in admin panel", async () => {
    const adminUser = { id: "usr_admin", role: "ADMIN", name: "Admin" };
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const newSku = "TRN-TEST-" + Date.now();
    const created = await caller.admin.products.create({
      sku: newSku,
      nameEn: "Wild Thyme Herb",
      nameTa: "காட்டு ஓமம்",
      sellingPrice: 160,
      mrp: 200,
      stock: 50,
      status: "Published",
    });

    expect(created).toBeDefined();
    expect(created.sku).toBe(newSku);
    createdProductId = created.id;

    // Edit product
    const updated = await caller.admin.products.update({
      id: createdProductId,
      updates: { sellingPrice: 175, stock: 45 },
    });
    expect(updated.price).toBe(175);
    expect(updated.stock).toBe(45);
  });

  // 8 & 9. Product image mapping & upload verification
  it("8 & 9. Product image mapping ensures individual image assignment and valid paths", () => {
    const mappingReport = require("../data/product_image_mapping_report.json");
    expect(mappingReport.totalCatalogProducts).toBe(162);
    expect(mappingReport.collagesAssigned).toBe(0);
    expect(mappingReport.placeholdersAssigned).toBe(0);
    expect(mappingReport.items.length).toBe(162);
    for (const item of mappingReport.items) {
      expect(item.assignedImage).toMatch(/^\/images\/products\/(packaged|featured)\/.+\.png$/);
    }
  });

  // 10. Catalogue bulk import
  it("10. Catalogue bulk import imports rows and reports errors for invalid rows", async () => {
    const adminUser = { id: "usr_admin", role: "ADMIN", name: "Admin" };
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const bulkSku = "TRN-BULK-" + Date.now();
    const bulkData = [
      { sku: bulkSku, nameEn: "Brahmi Leaves", nameTa: "வல்லாரை", sellingPrice: 190 },
      { sku: "", nameEn: "Invalid Item", sellingPrice: 100 }, // Invalid: missing SKU
    ];

    const result = await caller.admin.products.bulkImport(bulkData);
    expect(result.successCount).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].index).toBe(1);
  });

  // 11 & 12. Product pricing and inventory updates
  it("11 & 12. Admin can update price and inventory in real-time", async () => {
    const adminUser = { id: "usr_admin", role: "ADMIN", name: "Admin" };
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const updatedPrice = await caller.admin.products.updatePrice({
      id: createdProductId,
      sellingPrice: 185,
      mrp: 220,
    });
    expect(updatedPrice.price).toBe(185);

    const updatedStock = await caller.admin.products.updateStock({
      id: createdProductId,
      stock: 120,
    });
    expect(updatedStock.stock).toBe(120);
    expect(updatedStock.stockAvailability).toBe("In Stock");
  });

  // 13 & 14. Coupon validation and expired offer rejection
  it("13 & 14. Valid coupons apply discount; expired coupons are rejected", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Active coupon
    const validResult = await caller.offers.validateCoupon({
      code: "FESTIVE15",
      subtotal: 1000,
    });
    expect(validResult.valid).toBe(true);
    expect(validResult.discountAmount).toBe(150);

    // Below minimum order value
    const belowMinResult = await caller.offers.validateCoupon({
      code: "FESTIVE15",
      subtotal: 200,
    });
    expect(belowMinResult.valid).toBe(false);

    // Expired campaign test
    const adminUser = { id: "usr_admin", role: "ADMIN", name: "Admin" };
    const adminCaller = appRouter.createCaller(createMockContext(adminUser).ctx);
    const expiredCode = "EXPIRED_" + Date.now();
    await adminCaller.admin.campaigns.create({
      name: "Past Diwali Offer",
      code: expiredCode,
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderValue: 100,
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-01-10T00:00:00.000Z",
    });

    const expiredResult = await caller.offers.validateCoupon({
      code: expiredCode,
      subtotal: 500,
    });
    expect(expiredResult.valid).toBe(false);
    expect(expiredResult.message).toContain("expired");
  });

  // 15, 16, 17. Order creation, Razorpay order and HMAC signature verification
  let testOrderId = "";
  let testOrderNumber = "";
  it("15, 16 & 17. Real order creation, Razorpay order generation, and signature verification", async () => {
    const authedUser = { id: registeredUserId, email: testEmail, name: "Lakshmi Narayanan", role: "CUSTOMER" };
    const { ctx } = createMockContext(authedUser);
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list({ limit: 1 });
    const product = products[0];

    const order = await caller.orders.create({
      customerName: "Lakshmi Narayanan",
      customerEmail: testEmail,
      customerPhone: "+919876543210",
      shippingAddress: {
        street: "42 Herbal Garden Way",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638002",
      },
      items: [
        {
          productId: product.id,
          packSize: "100 g",
          quantity: 2,
        },
      ],
      paymentMethod: "RAZORPAY",
    });

    expect(order).toBeDefined();
    expect(order.orderNumber).toMatch(/^TRN-\d+$/);
    expect(order.orderStatus).toBe("Pending Payment");
    testOrderId = order.id;
    testOrderNumber = order.orderNumber;

    // Create Razorpay order
    const rzpOrder = await caller.payments.createRazorpayOrder({ orderId: testOrderId });
    expect(rzpOrder.razorpayOrderId).toBeDefined();

    // Verify payment signature
    const secret = "test_secret_for_unit_tests";
    process.env.PAYMENT_GATEWAY_KEY_SECRET = secret;
    const rzpPaymentId = "pay_test_" + Date.now();
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${rzpOrder.razorpayOrderId}|${rzpPaymentId}`)
      .digest("hex");

    const verificationResult = await caller.payments.verifySignature({
      orderId: testOrderId,
      razorpayOrderId: rzpOrder.razorpayOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: validSignature,
    });

    expect(verificationResult.success).toBe(true);
    expect(verificationResult.order.paymentStatus).toBe("PAID");
    expect(verificationResult.order.orderStatus).toBe("Confirmed");
  });

  // 18. Customer order history
  it("18. Customer can view their own timestamped order history", async () => {
    const authedUser = { id: registeredUserId, email: testEmail, name: "Lakshmi Narayanan", role: "CUSTOMER" };
    const { ctx } = createMockContext(authedUser);
    const caller = appRouter.createCaller(ctx);

    const history = await caller.orders.customerOrders();
    expect(history.length).toBeGreaterThan(0);
    expect(history.some((o: any) => o.id === testOrderId)).toBe(true);
  });

  // 19. Public order tracking privacy
  it("19. Order tracking returns status timeline while protecting customer private data", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const tracking = await caller.orders.track({
      orderNumber: testOrderNumber,
    });

    expect(tracking.orderNumber).toBe(testOrderNumber);
    expect(tracking.orderStatus).toBe("Confirmed");
    expect(tracking.history).toBeDefined();
    expect(tracking.history.length).toBeGreaterThan(0);
    // Ensure customer address / email / phone are not exposed to the public tracking endpoint
    expect((tracking as any).customerEmail).toBeUndefined();
    expect((tracking as any).shippingAddress).toBeUndefined();
  });

  // 20. Admin authorization
  it("20. Non-admins cannot access admin procedures", async () => {
    const normalUser = { id: registeredUserId, email: testEmail, role: "CUSTOMER", name: "Customer" };
    const { ctx } = createMockContext(normalUser);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.dashboardOverview()).rejects.toThrow();
  });

  // 21, 22, 23. Telegram bot authorization, product updates, and order updates
  it("21, 22 & 23. Telegram admin bot handles authorized updates and logs audits", async () => {
    // Add telegram admin ID
    const telegramAdminId = "9988776655";
    db.telegramRepo.addAdmin(telegramAdminId, "Telegram Admin");

    // Test product lookup via telegram
    await handleTelegramUpdate({
      message: {
        chat: { id: 12345 },
        from: { id: telegramAdminId, username: "admin_tester" },
        text: "/product TRN-1001",
      },
    });

    // Test stock update via telegram
    await handleTelegramUpdate({
      message: {
        chat: { id: 12345 },
        from: { id: telegramAdminId, username: "admin_tester" },
        text: "/stock TRN-1001 88",
      },
    });
    const updatedProd = db.productsRepo.getBySku("TRN-1001");
    expect(updatedProd.stock).toBe(88);

    // Test order status update via telegram
    await handleTelegramUpdate({
      message: {
        chat: { id: 12345 },
        from: { id: telegramAdminId, username: "admin_tester" },
        text: `/status ${testOrderNumber} Shipped`,
      },
    });
    const updatedOrder = db.ordersRepo.getByOrderNumber(testOrderNumber);
    expect(updatedOrder.orderStatus).toBe("Shipped");

    // Verify audit logs were written
    const audits = db.telegramRepo.getAuditLogs(5);
    expect(audits.some((a: any) => a.telegramUserId === telegramAdminId)).toBe(true);

    // Unauthorized user test
    await handleTelegramUpdate({
      message: {
        chat: { id: 12345 },
        from: { id: "unauthorized_user_123", username: "stranger" },
        text: "/stats",
      },
    });
    const unauthorizedAudit = db.telegramRepo.getAuditLogs(5);
    expect(unauthorizedAudit.some((a: any) => a.command === "UNAUTHORIZED_ATTEMPT")).toBe(true);
  });
});
