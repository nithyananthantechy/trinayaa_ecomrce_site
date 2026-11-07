import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("TRINAYAA Phase 5 — Product-Level COD Controls & Configurable Minimum COD Order Value Suite", () => {
  const ts = Date.now();
  let adminUser: any;
  let adminCaller: any;
  let customerUser: any;
  let customerCaller: any;
  let testProdEnabled: any;
  let testProdDisabled: any;
  let testProdCheap: any;
  const initialMinCod = db.siteContentRepo.getMinimumCodOrderValue();

  const publicCaller = appRouter.createCaller({
    user: null as any,
    session: null as any,
    req: { socket: { remoteAddress: `127.0.0.${ts % 200}` } } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  });

  beforeAll(async () => {
    // 1. Admin account
    adminUser = db.usersRepo.create({
      email: `admin_p5_${ts}@trinayaa.test`,
      password: "AdminPassword123!",
      name: "Admin P5 Operator",
      phone: "9876500001",
      role: "ADMIN",
    });

    adminCaller = appRouter.createCaller({
      user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "ADMIN" } as any,
      session: { openId: adminUser.id } as any,
      req: { socket: { remoteAddress: "127.0.0.1" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // 2. Customer account
    customerUser = db.usersRepo.create({
      email: `cust_p5_${ts}@trinayaa.test`,
      password: "CustomerPassword123!",
      name: "Kavitha Sundaram",
      phone: "9840223344",
      role: "CUSTOMER",
    });

    customerCaller = appRouter.createCaller({
      user: { id: customerUser.id, email: customerUser.email, name: customerUser.name, role: "CUSTOMER" } as any,
      session: { openId: customerUser.id } as any,
      req: { socket: { remoteAddress: "127.0.0.2" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // 3. Test Products
    // A: COD Enabled, standard price 200
    testProdEnabled = db.productsRepo.create({
      sku: `TRN-T5-EN-${ts}`,
      nameEn: "Wild Indigo Powder",
      nameTa: "காட்டு அவுரி பொடி",
      sellingPrice: 200,
      mrp: 250,
      stock: 50,
      isCodAvailable: 1,
    });

    // B: COD Disabled, price 300
    testProdDisabled = db.productsRepo.create({
      sku: `TRN-T5-DIS-${ts}`,
      nameEn: "Rare Saffron Strands",
      nameTa: "குங்குமப்பூ",
      sellingPrice: 300,
      mrp: 350,
      stock: 50,
      isCodAvailable: 0,
    });

    // C: Low-cost product, price 50 (for minimum order value boundary testing)
    testProdCheap = db.productsRepo.create({
      sku: `TRN-T5-LOW-${ts}`,
      nameEn: "Trial Botanical Sachet",
      nameTa: "மூலிகை மாதிரி",
      sellingPrice: 50,
      mrp: 60,
      stock: 100,
      isCodAvailable: 1,
    });

    // Ensure baseline store minimum COD is set to initial 150
    db.siteContentRepo.setMinimumCodOrderValue(150);
  });

  afterAll(() => {
    // Clean up temporary test products and campaigns to preserve exact 162 catalog count
    const rawDb = db.getDatabase();
    if (testProdEnabled && testProdDisabled && testProdCheap) {
      rawDb.prepare("DELETE FROM products WHERE id IN (?, ?, ?)").run(
        testProdEnabled.id,
        testProdDisabled.id,
        testProdCheap.id
      );
    }
    rawDb.prepare("DELETE FROM campaigns WHERE code LIKE 'COD%'").run();
    // Restore initial store setting
    db.siteContentRepo.setMinimumCodOrderValue(initialMinCod);
  });

  // ==========================================
  // 1. PRODUCT-LEVEL COD SETTINGS
  // ==========================================
  describe("1. Product-Level COD Availability & Admin Controls", () => {
    it("1.1: Product has COD enabled by default", async () => {
      const prod = db.productsRepo.getById(testProdEnabled.id);
      expect(prod).toBeDefined();
      expect(prod.isCodAvailable).toBe(true);
    });

    it("1.2: Product with COD disabled returns isCodAvailable = false", async () => {
      const prod = db.productsRepo.getById(testProdDisabled.id);
      expect(prod).toBeDefined();
      expect(prod.isCodAvailable).toBe(false);
    });

    it("1.3: Admin can toggle COD availability from enabled to disabled and vice versa", async () => {
      // Toggle to disabled
      const toggledOff = await adminCaller.admin.products.toggleCod({
        id: testProdEnabled.id,
        isCodAvailable: false,
      });
      expect(toggledOff.isCodAvailable).toBe(false);

      // Verify in DB
      const inDb = db.productsRepo.getById(testProdEnabled.id);
      expect(inDb.isCodAvailable).toBe(false);

      // Toggle back to enabled
      const toggledOn = await adminCaller.admin.products.toggleCod({
        id: testProdEnabled.id,
        isCodAvailable: true,
      });
      expect(toggledOn.isCodAvailable).toBe(true);
    });

    it("1.4: Non-admin regular customer cannot toggle product COD settings", async () => {
      await expect(
        customerCaller.admin.products.toggleCod({
          id: testProdEnabled.id,
          isCodAvailable: false,
        })
      ).rejects.toThrow();
    });

    it("1.5: Existing product attributes remain intact after COD setting toggle", async () => {
      const prod = db.productsRepo.getById(testProdEnabled.id);
      expect(prod.nameEn).toBe("Wild Indigo Powder");
      expect(prod.nameTa).toBe("காட்டு அவுரி பொடி");
      expect(prod.price).toBe(200);
      expect(prod.stock).toBe(50);
      expect(prod.sku).toBe(testProdEnabled.sku);
    });
  });

  // ==========================================
  // 2. CONFIGURABLE MINIMUM COD ORDER VALUE
  // ==========================================
  describe("2. Configurable Minimum COD Order Value", () => {
    it("2.1: Initial store default minimum COD order value is ₹150", async () => {
      const res = await publicCaller.settings.getMinimumCod();
      expect(res.minimumCodOrderValue).toBe(150);
    });

    it("2.2: Admin can update minimum COD order value to a new threshold", async () => {
      const updateRes = await adminCaller.admin.settings.setMinimumCod({
        minimumCodOrderValue: 250,
      });
      expect(updateRes.success).toBe(true);
      expect(updateRes.minimumCodOrderValue).toBe(250);

      const check = await publicCaller.settings.getMinimumCod();
      expect(check.minimumCodOrderValue).toBe(250);

      // Reset back to 150 for remaining tests
      await adminCaller.admin.settings.setMinimumCod({ minimumCodOrderValue: 150 });
    });

    it("2.3: Rejects invalid negative minimum COD order value", async () => {
      await expect(
        adminCaller.admin.settings.setMinimumCod({ minimumCodOrderValue: -50 })
      ).rejects.toThrow(/non-negative/i);
    });

    it("2.4: Non-admin customer cannot update minimum COD order value", async () => {
      await expect(
        customerCaller.admin.settings.setMinimumCod({ minimumCodOrderValue: 500 })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // 3. CART & CHECKOUT COD ELIGIBILITY
  // ==========================================
  describe("3. Cart & Checkout COD Eligibility Logic", () => {
    it("3.1: Cart with all products COD-enabled and total >= ₹150 is eligible for COD", async () => {
      // 1 unit of testProdEnabled (₹200 >= ₹150)
      const res = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdEnabled.id, quantity: 1 }],
      });
      expect(res.isEligible).toBe(true);
      expect(res.minimumCodOrderValue).toBe(150);
      expect(res.eligibleSubtotal).toBe(200);
      expect(res.ineligibleProducts.length).toBe(0);
    });

    it("3.2: Cart below minimum COD threshold is ineligible with clear threshold message", async () => {
      // 1 unit of testProdCheap (₹50 < ₹150)
      const res = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdCheap.id, quantity: 1 }],
      });
      expect(res.isEligible).toBe(false);
      expect(res.eligibleSubtotal).toBe(50);
      expect(res.reason).toContain("150");
      expect(res.reason).toMatch(/Cash on Delivery is available for orders of ₹150 or more/i);
    });

    it("3.3: Cart exactly at minimum COD threshold (₹150) is eligible for COD", async () => {
      // 3 units of ₹50 = ₹150
      const res = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdCheap.id, quantity: 3 }],
      });
      expect(res.isEligible).toBe(true);
      expect(res.eligibleSubtotal).toBe(150);
    });

    it("3.4: Cart containing a COD-disabled product is ineligible with clear product message", async () => {
      // 1 unit of testProdDisabled (₹300 >= ₹150, but COD is disabled)
      const res = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdDisabled.id, quantity: 1 }],
      });
      expect(res.isEligible).toBe(false);
      expect(res.reason).toMatch(/do not support COD/i);
      expect(res.ineligibleProducts.length).toBe(1);
      expect(res.ineligibleProducts[0].nameEn).toBe("Rare Saffron Strands");
    });

    it("3.5: Mixed cart (COD-enabled + COD-disabled) is marked ineligible for COD", async () => {
      // 1 unit of enabled (₹200) + 1 unit of disabled (₹300) = ₹500
      const res = await publicCaller.orders.checkCodEligibility({
        items: [
          { productId: testProdEnabled.id, quantity: 1 },
          { productId: testProdDisabled.id, quantity: 1 },
        ],
      });
      expect(res.isEligible).toBe(false);
      expect(res.reason).toMatch(/do not support COD/i);
      expect(res.ineligibleProducts.some((p: any) => p.id === testProdDisabled.id)).toBe(true);
    });

    it("3.6: Increasing quantity from below threshold to above threshold enables COD", async () => {
      // 2 units of ₹50 = ₹100 (ineligible)
      const checkBelow = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdCheap.id, quantity: 2 }],
      });
      expect(checkBelow.isEligible).toBe(false);

      // Increase to 4 units = ₹200 (eligible)
      const checkAbove = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdCheap.id, quantity: 4 }],
      });
      expect(checkAbove.isEligible).toBe(true);
    });

    it("3.7: Dynamically updates eligibility if product COD setting is changed in database", async () => {
      // Turn off COD for testProdEnabled
      await adminCaller.admin.products.toggleCod({ id: testProdEnabled.id, isCodAvailable: false });

      // Checkcart should now be ineligible
      const resDisabled = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdEnabled.id, quantity: 1 }],
      });
      expect(resDisabled.isEligible).toBe(false);

      // Turn COD back on
      await adminCaller.admin.products.toggleCod({ id: testProdEnabled.id, isCodAvailable: true });

      const resEnabled = await publicCaller.orders.checkCodEligibility({
        items: [{ productId: testProdEnabled.id, quantity: 1 }],
      });
      expect(resEnabled.isEligible).toBe(true);
    });
  });

  // ==========================================
  // 4. SECURITY & TAMPER RESISTANCE
  // ==========================================
  describe("4. Security & Server-Side Tamper Resistance", () => {
    const validShipping = {
      street: "123 Temple Road, Perundurai",
      city: "Erode",
      state: "Tamil Nadu",
      pinCode: "638052",
    };

    it("4.1: Direct API order creation with COD on cart below threshold is rejected strictly by server", async () => {
      // 1 unit of ₹50 < ₹150 threshold
      await expect(
        customerCaller.orders.create({
          customerName: customerUser.name,
          customerEmail: customerUser.email,
          customerPhone: customerUser.phone,
          shippingAddress: validShipping,
          items: [{ productId: testProdCheap.id, packSize: "100 g", quantity: 1 }],
          paymentMethod: "COD",
        })
      ).rejects.toThrow(/Cash on Delivery is available for orders of ₹150 or more/i);
    });

    it("4.2: Direct API order creation with COD on cart with disabled product is rejected strictly by server", async () => {
      // Cart with testProdDisabled
      await expect(
        customerCaller.orders.create({
          customerName: customerUser.name,
          customerEmail: customerUser.email,
          customerPhone: customerUser.phone,
          shippingAddress: validShipping,
          items: [{ productId: testProdDisabled.id, packSize: "100 g", quantity: 1 }],
          paymentMethod: "COD",
        })
      ).rejects.toThrow(/do not support COD/i);
    });

    it("4.3: Shipping fees (₹60) are NOT counted toward the minimum COD order value", async () => {
      // Subtotal = ₹100, Shipping fee = ₹60, Total = ₹160.
      // Net merchandise subtotal is ₹100 which is < ₹150 threshold -> Must be rejected!
      await expect(
        customerCaller.orders.create({
          customerName: customerUser.name,
          customerEmail: customerUser.email,
          customerPhone: customerUser.phone,
          shippingAddress: validShipping,
          items: [{ productId: testProdCheap.id, packSize: "100 g", quantity: 2 }], // 2 * 50 = 100
          paymentMethod: "COD",
        })
      ).rejects.toThrow(/Cash on Delivery is available for orders of ₹150 or more/i);
    });

    it("4.4: Applicable coupon discounts reduce merchandise subtotal before COD threshold evaluation", async () => {
      // Create a test campaign coupon giving ₹60 discount
      const testCouponCode = `COD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      db.campaignsRepo.create({
        name: "COD Discount Test",
        code: testCouponCode,
        discountType: "FIXED",
        discountValue: 60,
        minOrderValue: 100,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        bannerText: "",
        bannerImage: "",
        eligibleCategories: "[]",
        eligibleProducts: "[]",
        usageLimit: 100,
      });

      // 1 item of ₹200. With coupon discount of ₹60, eligible subtotal becomes ₹140 (< ₹150)!
      // Should be rejected for COD!
      await expect(
        customerCaller.orders.create({
          customerName: customerUser.name,
          customerEmail: customerUser.email,
          customerPhone: customerUser.phone,
          shippingAddress: validShipping,
          items: [{ productId: testProdEnabled.id, packSize: "100 g", quantity: 1 }], // 200 - 60 = 140
          couponCode: testCouponCode,
          paymentMethod: "COD",
        })
      ).rejects.toThrow(/Cash on Delivery is available for orders of ₹150 or more/i);
    });
  });

  // ==========================================
  // 5. CHECKOUT & PAYMENT REGRESSION
  // ==========================================
  describe("5. Checkout & Payment Regression", () => {
    const validShipping = {
      street: "45 Weaver Street, Sampath Nagar",
      city: "Erode",
      state: "Tamil Nadu",
      pinCode: "638011",
    };

    it("5.1: Fully eligible COD order creates order with Confirmed status and line items", async () => {
      // 1 item of ₹200 (>= ₹150)
      const order = await customerCaller.orders.create({
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        shippingAddress: validShipping,
        items: [{ productId: testProdEnabled.id, packSize: "100 g", quantity: 1 }],
        paymentMethod: "COD",
      });

      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^TRN-/);
      expect(order.paymentMethod).toBe("COD");
      expect(order.orderStatus).toBe("Confirmed");
      expect(order.paymentStatus).toBe("PENDING");
      expect(order.subtotal).toBe(200);

      // Verify line items in DB
      const dbOrder = db.ordersRepo.getById(order.id);
      expect(dbOrder.items.length).toBe(1);
      expect(dbOrder.items[0].productNameEn).toBe("Wild Indigo Powder");
    });

    it("5.2: Online Razorpay checkout succeeds even for COD-disabled products", async () => {
      // testProdDisabled has isCodAvailable = false, but Razorpay online payment must be permitted
      const order = await customerCaller.orders.create({
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        shippingAddress: validShipping,
        items: [{ productId: testProdDisabled.id, packSize: "100 g", quantity: 1 }],
        paymentMethod: "RAZORPAY",
      });

      expect(order).toBeDefined();
      expect(order.paymentMethod).toBe("RAZORPAY");
      expect(order.orderStatus).toBe("Pending Payment");
      expect(order.subtotal).toBe(300);
    });
  });
});
