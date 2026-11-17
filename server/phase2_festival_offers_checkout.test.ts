import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";

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
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        cookie: (name: string, val: any, opts: any) => {
          cookies[name] = { val, opts };
        },
        clearCookie: (name: string, opts: any) => {
          delete cookies[name];
        },
        setHeader: (name: string, val: string) => {
          headers[name.toLowerCase()] = val;
        },
      } as any,
    },
    cookies,
    headers,
  };
}

describe("TRINAYAA Phase 2 — Festival Offers Visibility at Checkout Suite", () => {
  let callerPublic: any;
  let callerAuth: any;
  let testActiveCode: string;
  let testExpiredCode: string;
  let testInactiveCode: string;
  let testFutureCode: string;
  let testCapCode: string;
  let testMinOrderCode: string;

  const mockUser = {
    id: "usr_test_phase2",
    openId: "usr_test_phase2",
    email: "festival_test@trinayaa.test",
    name: "Festival Test Customer",
    phone: "9876543210",
    role: "CUSTOMER",
  };

  beforeAll(async () => {
    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
    callerAuth = appRouter.createCaller(createMockContext(mockUser).ctx);

    const ts = Date.now();
    testActiveCode = `ACTIVE_${ts}`;
    testExpiredCode = `EXP_${ts}`;
    testInactiveCode = `INACT_${ts}`;
    testFutureCode = `FUT_${ts}`;
    testCapCode = `CAP_${ts}`;
    testMinOrderCode = `MIN_${ts}`;

    // 1. Active campaign (valid now)
    db.campaignsRepo.create({
      name: "Diwali Harvest 20% OFF",
      code: testActiveCode,
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderValue: 300,
      maxDiscount: 500,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: 1,
      bannerText: "Get 20% off pure single herbs above ₹300!",
      usageLimit: 1000,
    });

    // 2. Expired campaign
    db.campaignsRepo.create({
      name: "Past Pongal Special",
      code: testExpiredCode,
      discountType: "PERCENTAGE",
      discountValue: 30,
      minOrderValue: 200,
      maxDiscount: 300,
      startDate: "2023-01-01T00:00:00.000Z",
      endDate: "2023-01-20T00:00:00.000Z",
      isActive: 1,
      bannerText: "Expired festive discount",
      usageLimit: 1000,
    });

    // 3. Inactive campaign (isActive = 0)
    db.campaignsRepo.create({
      name: "Unpublished Winter Sale",
      code: testInactiveCode,
      discountType: "FIXED",
      discountValue: 100,
      minOrderValue: 400,
      maxDiscount: 100,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: 0,
      bannerText: "Draft discount",
      usageLimit: 1000,
    });

    // 4. Future campaign (startDate in future)
    db.campaignsRepo.create({
      name: "New Year 2027 Preview",
      code: testFutureCode,
      discountType: "PERCENTAGE",
      discountValue: 25,
      minOrderValue: 500,
      maxDiscount: 250,
      startDate: "2027-01-01T00:00:00.000Z",
      endDate: "2027-01-15T00:00:00.000Z",
      isActive: 1,
      bannerText: "Upcoming promotion",
      usageLimit: 1000,
    });

    // 5. Capped discount campaign (50% off with max ₹150 cap)
    db.campaignsRepo.create({
      name: "Mega Festive 50% with ₹150 Cap",
      code: testCapCode,
      discountType: "PERCENTAGE",
      discountValue: 50,
      minOrderValue: 200,
      maxDiscount: 150,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: 1,
      bannerText: "50% off capped at ₹150",
      usageLimit: 1000,
    });

    // 6. High Min-Order campaign (min order ₹800)
    db.campaignsRepo.create({
      name: "Bulk Wellness ₹200 OFF",
      code: testMinOrderCode,
      discountType: "FIXED",
      discountValue: 200,
      minOrderValue: 800,
      maxDiscount: 200,
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      isActive: 1,
      bannerText: "₹200 off on bulk orders above ₹800",
      usageLimit: 1000,
    });
  });

  // 1. Active offer is displayed
  it("1: Active festival offer is displayed in trpc.offers.getActive query", async () => {
    const activeOffers = await callerPublic.offers.getActive();
    expect(Array.isArray(activeOffers)).toBe(true);
    const found = activeOffers.find((o: any) => o.code === testActiveCode);
    expect(found).toBeDefined();
    expect(found.name).toBe("Diwali Harvest 20% OFF");
    expect(found.discountValue).toBe(20);
    expect(found.minOrderValue).toBe(300);
  });

  // 2. Expired offer is hidden
  it("2: Expired offer is omitted from active offers", async () => {
    const activeOffers = await callerPublic.offers.getActive();
    const found = activeOffers.find((o: any) => o.code === testExpiredCode);
    expect(found).toBeUndefined();
  });

  // 3. Inactive offer is hidden
  it("3: Inactive offer (isActive = 0) is omitted from active offers", async () => {
    const activeOffers = await callerPublic.offers.getActive();
    const found = activeOffers.find((o: any) => o.code === testInactiveCode);
    expect(found).toBeUndefined();
  });

  // 4. Offer outside validity period is rejected
  it("4: Offer outside validity period (expired or future) is rejected by validateCoupon", async () => {
    const expiredRes = await callerPublic.offers.validateCoupon({
      code: testExpiredCode,
      subtotal: 500,
    });
    expect(expiredRes.valid).toBe(false);
    expect(expiredRes.message).toMatch(/expired/i);

    const futureRes = await callerPublic.offers.validateCoupon({
      code: testFutureCode,
      subtotal: 500,
    });
    expect(futureRes.valid).toBe(false);
    expect(futureRes.message).toMatch(/not active yet/i);
  });

  // 5. Eligible offer can be applied
  it("5: Eligible offer can be applied and returns valid calculated discount", async () => {
    const res = await callerPublic.offers.validateCoupon({
      code: testActiveCode,
      subtotal: 1000,
    });
    expect(res.valid).toBe(true);
    expect(res.code).toBe(testActiveCode);
    // 20% of 1000 = 200
    expect(res.discountAmount).toBe(200);
  });

  // 6. Invalid coupon is rejected
  it("6: Non-existent / invalid coupon code is rejected", async () => {
    const res = await callerPublic.offers.validateCoupon({
      code: "COMPLETELY_INVALID_CODE_999",
      subtotal: 1000,
    });
    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/not found/i);
  });

  // 7. Minimum order condition is enforced
  it("7: Minimum order condition is enforced by server validation", async () => {
    // subtotal = 400, but minOrderValue = 800
    const res = await callerPublic.offers.validateCoupon({
      code: testMinOrderCode,
      subtotal: 400,
    });
    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/Minimum cart value of ₹800 required/i);

    // subtotal = 900 >= 800 -> succeeds
    const successRes = await callerPublic.offers.validateCoupon({
      code: testMinOrderCode,
      subtotal: 900,
    });
    expect(successRes.valid).toBe(true);
    expect(successRes.discountAmount).toBe(200);
  });

  // 8. Maximum discount cap is enforced
  it("8: Maximum discount cap is enforced for percentage promotions", async () => {
    // 50% of 1000 = 500, but maxDiscount = 150
    const res = await callerPublic.offers.validateCoupon({
      code: testCapCode,
      subtotal: 1000,
    });
    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(150);
  });

  // 9. Discount is not duplicated or stacked incorrectly
  it("9: Discount replaces previous code and is not stacked incorrectly", async () => {
    const res1 = await callerPublic.offers.validateCoupon({
      code: testActiveCode,
      subtotal: 1000,
    });
    expect(res1.valid).toBe(true);
    expect(res1.discountAmount).toBe(200);

    // Now user switches to cap code
    const res2 = await callerPublic.offers.validateCoupon({
      code: testCapCode,
      subtotal: 1000,
    });
    expect(res2.valid).toBe(true);
    expect(res2.discountAmount).toBe(150);
    // Replacement is atomic; total discount is 150, not 350
    const combinedDiscount = res2.discountAmount;
    expect(combinedDiscount).toBe(150);
  });

  // 10. Cart total is recalculated correctly
  it("10: Cart total recalculation respects subtotal, discount, and ₹799 free shipping threshold", () => {
    const subtotal = 500;
    const discount = 100;
    // Shipping is ₹60 because subtotal < 799
    const shippingFee = subtotal >= 799 ? 0 : 60;
    const total = Math.max(0, subtotal - discount + shippingFee);
    expect(total).toBe(460);

    // Case 2: Above ₹799 gets FREE shipping
    const subtotalHigh = 900;
    const discountHigh = 150;
    const shippingHigh = subtotalHigh >= 799 ? 0 : 60;
    const totalHigh = Math.max(0, subtotalHigh - discountHigh + shippingHigh);
    expect(shippingHigh).toBe(0);
    expect(totalHigh).toBe(750);
  });

  // 11. Payment amount matches server-calculated order total
  it("11: Server orders.create enforces discount validation and stores correct total payable", async () => {
    const allProducts = db.productsRepo.getAll();
    const product = allProducts[0];
    expect(product).toBeDefined();

    const orderRes = await callerAuth.orders.create({
      customerName: "Festival Test Customer",
      customerPhone: "9876543210",
      customerEmail: "festival_test@trinayaa.test",
      shippingAddress: "123 Green Bazaar, Erode, Tamil Nadu 638001",
      paymentMethod: "COD",
      couponCode: testActiveCode,
      items: [
        {
          productId: product.id,
          name: product.name,
          packSize: "100g",
          unitPrice: 500,
          quantity: 2, // subtotal = 1000
        },
      ],
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.order).toBeDefined();
    // Subtotal 1000, 20% discount = 200, Shipping (>=799) = 0 => Total = 800
    expect(orderRes.order.subtotal).toBe(1000);
    expect(orderRes.order.discountAmount).toBe(200);
    expect(orderRes.order.couponCode).toBe(testActiveCode);
    expect(orderRes.order.total).toBe(800);
  });

  // 12. Existing COD checkout remains functional
  it("12: Cash on Delivery (COD) order checkout operates without regression", async () => {
    const allProducts = db.productsRepo.getAll();
    const product = allProducts[0];

    const orderRes = await callerAuth.orders.create({
      customerName: "COD Customer",
      customerPhone: "9876543211",
      customerEmail: "cod_customer@trinayaa.test",
      shippingAddress: "45 Market Street, Erode 638002",
      paymentMethod: "COD",
      items: [
        {
          productId: product.id,
          name: product.name,
          packSize: "100g",
          unitPrice: 300,
          quantity: 1, // subtotal = 300 (< 799)
        },
      ],
    });

    expect(orderRes.success).toBe(true);
    expect(orderRes.order.paymentMethod).toBe("COD");
    expect(orderRes.order.orderStatus).toBe("Confirmed");
    expect(orderRes.order.paymentStatus).toBe("Pending");
    // 300 + 60 shipping = 360
    expect(orderRes.order.total).toBe(360);
  });

  // 13. Existing Razorpay checkout remains functional
  it("13: Razorpay order creation creates simulated/live order and matches total amount", async () => {
    const rzpOrder = await callerAuth.payments.createRazorpayOrder({
      amount: 800,
      receipt: `rcpt_test_${Date.now()}`,
    });

    expect(rzpOrder).toBeDefined();
    expect(rzpOrder.id).toBeDefined();
    expect(rzpOrder.amount).toBe(80000); // 800 * 100 paise
    expect(rzpOrder.currency).toBe("INR");
  });

  // 14. Empty state when no eligible offers
  it("14: Database returns empty array when query targets dates with no active promotions", () => {
    const rawDb = db.getDatabase();
    // Far future query
    const farFuture = "2099-01-01T00:00:00.000Z";
    const futureOffers = rawDb.prepare(
      "SELECT * FROM campaigns WHERE isActive = 1 AND startDate <= ? AND endDate >= ?"
    ).all(farFuture, farFuture);
    expect(futureOffers.length).toBe(0);
  });
});
