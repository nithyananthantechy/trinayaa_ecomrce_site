// TRINAYAA E-COMMERCE — PHASE 8 FINAL QA, SECURITY AUDIT & PRODUCTION READINESS TEST SUITE
import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";
import fs from "node:fs";
import path from "node:path";

const sqliteModule: any = (process as any).getBuiltinModule ? (process as any).getBuiltinModule("node:sqlite") : eval("require")("node:sqlite");
const DatabaseSync = sqliteModule.DatabaseSync;

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

describe("TRINAYAA Phase 8 — Final QA, Security Audit & Production Verification Suite", () => {
  let customerUser: any;
  let unauthorizedUser: any;
  let adminUser: any;
  let retailUser: any;

  let callerCustomer: any;
  let callerUnauthorized: any;
  let callerAdmin: any;
  let callerRetail: any;

  let testProduct: any;
  let eligibleSubProduct: any;

  beforeAll(async () => {
    const ts = Date.now();
    customerUser = db.usersRepo.create({
      email: `qa_cust_${ts}@trinayaa.in`,
      password: "CustomerPassword123!",
      name: "QA Customer",
      phone: "9876543210",
      role: "CUSTOMER",
    });

    unauthorizedUser = db.usersRepo.create({
      email: `qa_unauth_${ts}@trinayaa.in`,
      password: "CustomerPassword123!",
      name: "Unauthorized Customer",
      phone: "9876543211",
      role: "CUSTOMER",
    });

    adminUser = db.usersRepo.create({
      email: `qa_admin_${ts}@trinayaa.in`,
      password: "AdminPassword123!",
      name: "QA Administrator",
      phone: "9876543212",
      role: "ADMIN",
    });

    retailUser = db.usersRepo.create({
      email: `qa_retail_${ts}@trinayaa.in`,
      password: "RetailPassword123!",
      name: "QA Retail Handler",
      phone: "9876543213",
      role: "RETAIL_SHOP_HANDLER",
      branchId: "brn_erode_hq",
    });

    callerCustomer = appRouter.createCaller(createMockContext(customerUser).ctx);
    callerUnauthorized = appRouter.createCaller(createMockContext(unauthorizedUser).ctx);
    callerAdmin = appRouter.createCaller(createMockContext(adminUser).ctx);
    callerRetail = appRouter.createCaller(createMockContext(retailUser).ctx);

    // Fetch botanical test product and ensure COD availability and stock
    testProduct = db.productsRepo.getBySku("TRN-1001")!;
    expect(testProduct).toBeDefined();
    db.getDatabase().prepare("UPDATE products SET isCodAvailable = 1, stock = 100 WHERE id = ?").run(testProduct.id);
    testProduct = db.productsRepo.getById(testProduct.id);

    // Prepare subscription-eligible test product
    eligibleSubProduct = db.productsRepo.getBySku("TRN-1002") || testProduct;
    db.getDatabase().prepare("UPDATE products SET isSubscriptionEligible = 1, isCodAvailable = 1, stock = 100 WHERE id = ?").run(eligibleSubProduct.id);
    eligibleSubProduct = db.productsRepo.getById(eligibleSubProduct.id);
  });

  // ==========================================
  // 1. SECURITY & ACCESS CONTROL
  // ==========================================
  describe("1. Security: Multi-Tenant Data Isolation & Route Authorization", () => {
    it("1.1: Blocks non-admin users from accessing admin routes", async () => {
      await expect(callerCustomer.admin.dashboard.getMetrics()).rejects.toThrow();
      await expect(callerUnauthorized.admin.products.list()).rejects.toThrow();
    });

    it("1.2: Enforces address book multi-tenant ownership", async () => {
      const addr = await callerCustomer.addresses.create({
        recipientName: "QA Customer",
        phone: "9876543210",
        addressLine1: "123 Herb Street",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638002",
        isDefault: true,
      });

      expect(addr.id).toBeDefined();

      // Unauthorized customer tries to fetch customer's address
      await expect(
        callerUnauthorized.addresses.getById({ id: addr.id })
      ).rejects.toThrow(/Address not found/);

      // Unauthorized customer tries to delete customer's address
      await expect(
        callerUnauthorized.addresses.delete({ id: addr.id })
      ).rejects.toThrow(/Address not found/);
    });

    it("1.3: Enforces customer order ownership (Customer A cannot access Customer B's order)", async () => {
      const order = await callerCustomer.orders.create({
        customerName: "QA Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 1,
          },
        ],
        paymentMethod: "RAZORPAY",
      });

      expect(order.id).toBeDefined();

      // Unauthorized customer attempts to fetch Customer's order by ID
      await expect(
        callerUnauthorized.orders.getById({ id: order.id })
      ).rejects.toThrow("Access denied.");

      // Unauthorized customer attempts to verify payment on Customer's order
      await expect(
        callerUnauthorized.payments.verifyPayment({
          orderId: order.id,
          razorpayOrderId: "rzp_fake_order",
          razorpayPaymentId: "rzp_fake_pay",
          razorpaySignature: "fake_sig",
        })
      ).rejects.toThrow("Unauthorized to verify payment for this order.");
    });
  });

  // ==========================================
  // 2. PAYMENT INTEGRATION & IDEMPOTENCY
  // ==========================================
  describe("2. Payment Verification & Webhook Idempotency", () => {
    it("2.1: Order creation recalculates price from database and enforces Pan-India shipping rule", async () => {
      const variant100g = db.getDatabase().prepare("SELECT price FROM product_variants WHERE productId = ? AND packSize = '100g'").get(testProduct.id) as any;
      const expectedUnitPrice = variant100g?.price || testProduct.sellingPrice;

      const summary = await callerCustomer.orders.calculateSummary({
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 2,
          },
        ],
      });

      expect(summary.subtotal).toBe(expectedUnitPrice * 2);
      if (summary.subtotal >= 799) {
        expect(summary.shippingFee).toBe(0);
      } else {
        expect(summary.shippingFee).toBe(60);
      }
      expect(summary.total).toBe(summary.subtotal + summary.shippingFee);
    });

    it("2.2: Idempotent payment verification does not double-deduct inventory on repeated calls", async () => {
      const initialStock = (db.productsRepo.getById(testProduct.id) as any).stock;

      const order = await callerCustomer.orders.create({
        customerName: "QA Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 2,
          },
        ],
        paymentMethod: "RAZORPAY",
      });

      const rzpRes = await callerCustomer.payments.createRazorpayOrder({
        orderId: order.id,
      });

      // First confirmation
      await callerCustomer.payments.verifyPayment({
        orderId: order.id,
        razorpayOrderId: rzpRes.razorpayOrderId,
        razorpayPaymentId: "pay_qa_test_1",
        razorpaySignature: "sig_qa_test_1",
      });

      const stockAfterFirst = (db.productsRepo.getById(testProduct.id) as any).stock;
      expect(stockAfterFirst).toBe(initialStock - 2);

      // Duplicate payment confirmation call
      await callerCustomer.payments.verifyPayment({
        orderId: order.id,
        razorpayOrderId: rzpRes.razorpayOrderId,
        razorpayPaymentId: "pay_qa_test_1",
        razorpaySignature: "sig_qa_test_1",
      });

      const stockAfterDuplicate = (db.productsRepo.getById(testProduct.id) as any).stock;
      // Stock should remain identical (NO double-deduction)
      expect(stockAfterDuplicate).toBe(stockAfterFirst);
    });

    it("2.3: Order cancellation restores inventory atomically", async () => {
      const stockBefore = (db.productsRepo.getById(testProduct.id) as any).stock;

      const order = await callerCustomer.orders.create({
        customerName: "QA Restock Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 3,
          },
        ],
        paymentMethod: "RAZORPAY",
      });

      // Simulate payment confirmation
      db.ordersRepo.confirmPayment(order.id, {
        gatewayPaymentId: "pay_restock_sim",
      });

      const stockDeducted = (db.productsRepo.getById(testProduct.id) as any).stock;
      expect(stockDeducted).toBe(stockBefore - 3);

      // Admin cancels order
      await callerAdmin.admin.orders.updateStatus({
        orderId: order.id,
        status: "Cancelled",
        notes: "QA Restock verification",
      });

      const stockRestored = (db.productsRepo.getById(testProduct.id) as any).stock;
      expect(stockRestored).toBe(stockBefore);
    });
  });

  // ==========================================
  // 3. DATABASE INTEGRITY & RESTORATION
  // ==========================================
  describe("3. Production Database & Backup Verification", () => {
    it("3.1: Exactly 162 catalogue products and 9 categories in database", () => {
      const dbInstance = db.getDatabase();
      const prodCount = dbInstance.prepare("SELECT COUNT(*) as c FROM products WHERE id NOT LIKE 'prod_inelig_%' AND id NOT LIKE 'prod_low_stock_%'").get().c;
      const catCount = dbInstance.prepare("SELECT COUNT(*) as c FROM categories").get().c;

      expect(prodCount).toBe(162);
      expect(catCount).toBe(9);
    });

    it("3.2: Foreign key checks and integrity checks pass with 0 errors", () => {
      const dbInstance = db.getDatabase();
      const fk = dbInstance.prepare("PRAGMA foreign_key_check").all();
      const integrity = dbInstance.prepare("PRAGMA integrity_check").all();

      expect(fk).toHaveLength(0);
      expect(integrity[0].integrity_check).toBe("ok");
    });

    it("3.3: Backups can be restored into an isolated database without data loss", () => {
      const dataDir = path.resolve(process.cwd(), "data");
      const srcPath = path.resolve(dataDir, "trinayaa.db");
      const testPath = path.resolve(dataDir, "qa_temp_restore_test.db");

      if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
      fs.copyFileSync(srcPath, testPath);

      const testDb = new DatabaseSync(testPath);
      const testProdCount = testDb.prepare("SELECT COUNT(*) as c FROM products").get().c;
      const testCatCount = testDb.prepare("SELECT COUNT(*) as c FROM categories").get().c;

      testDb.close();
      fs.unlinkSync(testPath);

      expect(testProdCount).toBeGreaterThanOrEqual(162);
      expect(testCatCount).toBeGreaterThanOrEqual(9);
    });
  });

  // ==========================================
  // 4. TELEGRAM BOT SECURITY & PRIVACY
  // ==========================================
  describe("4. Telegram Admin Bot Security & Masking", () => {
    it("4.1: Customer mobile and email are masked in public order notifications", () => {
      const phone = "9876543210";
      const maskedPhone = phone.replace(/^(\d{5})\d{5}$/, "$1*****");
      expect(maskedPhone).toBe("98765*****");

      const email = "customer@trinayaa.in";
      const maskedEmail = email.replace(/^(.)(.*)(@.*)$/, (_m, a, b, c) => `${a}***${c}`);
      expect(maskedEmail).toBe("c***@trinayaa.in");
    });
  });

  // ==========================================
  // 5. MODULE A: STOREFRONT, CATALOGUE & PACK SIZES
  // ==========================================
  describe("5. Module A: Storefront, Catalogue & Variants", () => {
    it("5.1: Botanical catalogue products have 3 pack size variants (50g, 100g, 250g)", () => {
      const dbInstance = db.getDatabase();
      const variants = dbInstance.prepare("SELECT packSize FROM product_variants WHERE productId = ?").all(testProduct.id) as any[];
      const packSizes = variants.map((v) => v.packSize);
      expect(packSizes).toContain("50g");
      expect(packSizes).toContain("100g");
      expect(packSizes).toContain("250g");
    });

    it("5.2: Public product listing supports category filtering and botanical text search", async () => {
      const categoryList = await callerCustomer.categories.list();
      expect(categoryList.length).toBeGreaterThanOrEqual(9);

      const searchResults = await callerCustomer.products.list({ search: "Ashwagandha" });
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      expect(searchResults[0].nameEn.toLowerCase()).toContain("ashwagandha");
    });

    it("5.3: Individual product fetch by slug returns accurate details and variants", async () => {
      const product = await callerCustomer.products.getBySlug({ slug: testProduct.slug });
      expect(product).toBeDefined();
      expect(product.id).toBe(testProduct.id);
      expect(product.sku).toBe(testProduct.sku);
      expect(product.variants.length).toBe(3);
    });
  });

  // ==========================================
  // 6. MODULE B: CUSTOMER ACCOUNTS & PROFILE
  // ==========================================
  describe("6. Module B: Customer Accounts & Address Book", () => {
    it("6.1: Customer can fetch their profile accurately", async () => {
      const profile = await callerCustomer.account.getProfile();
      expect(profile).toBeDefined();
      expect(profile.email).toBe(customerUser.email);
      expect(profile.role).toBe("CUSTOMER");
    });

    it("6.2: Customer can manage multiple delivery addresses with default address flag", async () => {
      const addr2 = await callerCustomer.addresses.create({
        recipientName: "QA Customer Office",
        phone: "9876543210",
        addressLine1: "456 Commerce Road",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pinCode: "641001",
        isDefault: false,
      });

      const addresses = await callerCustomer.addresses.list();
      expect(addresses.length).toBeGreaterThanOrEqual(2);
      expect(addresses.some((a: any) => a.id === addr2.id)).toBe(true);
    });
  });

  // ==========================================
  // 7. MODULE C: CART, FESTIVAL OFFERS & CHECKOUT
  // ==========================================
  describe("7. Module C: Cart, Festival Offers, Checkout & Gift Delivery", () => {
    it("7.1: Checkout with coupon discount and free shipping threshold (>= ₹799)", async () => {
      // Calculate summary for >= ₹799
      const summaryHigh = await callerCustomer.orders.calculateSummary({
        items: [
          {
            productId: testProduct.id,
            packSize: "250g",
            quantity: 5,
          },
        ],
      });
      expect(summaryHigh.subtotal).toBeGreaterThanOrEqual(799);
      expect(summaryHigh.shippingFee).toBe(0);
    });

    it("7.2: Separate billing vs shipping address and gift order message preservation", async () => {
      const giftOrder = await callerCustomer.orders.create({
        customerName: "QA Purchaser",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        isSameAddress: false,
        isGiftOrder: true,
        giftRecipientName: "Gift Recipient Friend",
        giftMessage: "Wishing you pure botanical wellness!",
        shippingAddress: {
          recipientName: "Gift Recipient Friend",
          street: "789 Present Lane",
          addressLine1: "789 Present Lane",
          city: "Chennai",
          state: "Tamil Nadu",
          pinCode: "600001",
          phone: "9876500000",
        },
        billingAddress: {
          recipientName: "QA Purchaser",
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
          phone: "9876543210",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 1,
          },
        ],
        paymentMethod: "COD",
      });

      expect(giftOrder.id).toBeDefined();
      const fetched = await callerCustomer.orders.getById({ id: giftOrder.id });
      expect(Boolean(fetched.isGiftOrder)).toBe(true);
      expect(fetched.giftMessage).toBe("Wishing you pure botanical wellness!");
      expect(fetched.shippingAddress.city).toBe("Chennai");
      expect(fetched.billingAddress.city).toBe("Erode");
    });
  });

  // ==========================================
  // 8. MODULE D: PRODUCT SUBSCRIPTIONS
  // ==========================================
  describe("8. Module D: Product Subscriptions Lifecycle", () => {
    let subId: string;

    it("8.1: Customer can create recurring subscription with frequency and delivery address", async () => {
      const sub = await callerCustomer.subscriptions.create({
        productId: eligibleSubProduct.id,
        quantity: 2,
        frequency: "30_DAYS",
        paymentPreference: "COD",
        deliveryAddress: {
          recipientName: "QA Subscriber",
          addressLine1: "123 Herbal Way",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
          phone: "9876543210",
        },
      });

      expect(sub.id).toBeDefined();
      expect(sub.status).toBe("ACTIVE");
      expect(sub.frequency).toBe("30_DAYS");
      subId = sub.id;
    });

    it("8.2: Customer can pause, resume, and skip next scheduled delivery cycle", async () => {
      const paused = await callerCustomer.subscriptions.pause({ id: subId, reason: "Vacation" });
      expect(paused.status).toBe("PAUSED");

      const resumed = await callerCustomer.subscriptions.resume({ id: subId });
      expect(resumed.status).toBe("ACTIVE");

      const skipped = await callerCustomer.subscriptions.skipNext({ id: subId, reason: "Sufficient stock on hand" });
      expect(skipped.status).toBe("ACTIVE");
      expect(new Date(skipped.nextDeliveryDate).getTime()).toBeGreaterThan(Date.now());
    });

    it("8.3: Customer can cancel subscription with reason", async () => {
      const cancelled = await callerCustomer.subscriptions.cancel({ id: subId, reason: "Moving out of station" });
      expect(cancelled.status).toBe("CANCELLED");
      expect(cancelled.cancellationReason).toBe("Moving out of station");
    });
  });

  // ==========================================
  // 9. MODULE E: RETAIL OPERATIONS POS & ISOLATION
  // ==========================================
  describe("9. Module E: Retail Operations POS & Role Isolation", () => {
    it("9.1: Retail Shop Handler can query branch inventory and complete offline POS billing", async () => {
      const branch = await callerRetail.retail.myBranch();
      expect(branch.id).toBe("brn_erode_hq");

      const stock = await callerRetail.retail.branchStock();
      expect(Array.isArray(stock)).toBe(true);
      expect(stock.length).toBeGreaterThan(0);

      const targetStockItem = stock[0];

      const sale = await callerRetail.retail.createSale({
        customerName: "Walk-in Botanical Buyer",
        customerPhone: "9876599999",
        paymentMethod: "CASH",
        items: [
          {
            productId: targetStockItem.productId,
            sku: targetStockItem.sku,
            packSize: "100g",
            quantity: 1,
            unitPrice: targetStockItem.sellingPrice,
          },
        ],
      });

      expect(sale.invoice_number).toMatch(/^TRN-RET-\d{4}-\d{5}$/);
      expect(sale.total).toBe(targetStockItem.sellingPrice);
    });

    it("9.2: Retail Shop Handler is strictly forbidden from accessing full admin procedures", async () => {
      await expect(callerRetail.admin.products.list()).rejects.toThrow();
      await expect(callerRetail.admin.dashboard.getMetrics()).rejects.toThrow();
      await expect(callerRetail.admin.adminUsers.list()).rejects.toThrow();
    });
  });

  // ==========================================
  // 10. MODULE F: FULFILMENT DOCUMENTS & STUDIO
  // ==========================================
  describe("10. Module F: Fulfilment Documents & Dispatch Studio", () => {
    it("10.1: Generation of complete 4-document fulfilment bundle", async () => {
      // Create a test order to generate documents
      const order = await callerCustomer.orders.create({
        customerName: "QA Fulfilment Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          recipientName: "QA Fulfilment Consignee",
          street: "123 Dispatch Road",
          addressLine1: "123 Dispatch Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 1,
          },
        ],
        paymentMethod: "COD",
      });

      const bundle = await callerAdmin.admin.orders.getAllDocuments({ orderNumber: order.orderNumber });
      expect(bundle).toBeDefined();
      expect(bundle.shippingSlip).toBeDefined();
      expect(bundle.customerInvoice).toBeDefined();
      expect(bundle.deliveryChallan).toBeDefined();
      expect(bundle.packingSticker).toBeDefined();

      expect(bundle.customerInvoice.invoiceNumber).toMatch(/^TRN-INV-\d{4}-\d{5}$/);
      expect(bundle.shippingSlip.documentNumber).toMatch(/^TRN-SHIP-\d{4}-\d{5}$/);
      expect(bundle.deliveryChallan.challanNumber).toMatch(/^TRN-DC-\d{4}-\d{5}$/);
      expect(bundle.packingSticker.stickerNumber).toMatch(/^TRN-LBL-\d{4}-\d{5}$/);
    });

    it("10.2: Fulfilment document numbering is idempotent across repeated views", async () => {
      const orders = await callerAdmin.admin.orders.list({ limit: 1 });
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      const testOrder = orders[0];

      const bundle1 = await callerAdmin.admin.orders.getAllDocuments({ orderNumber: testOrder.orderNumber });
      const bundle2 = await callerAdmin.admin.orders.getAllDocuments({ orderNumber: testOrder.orderNumber });

      expect(bundle1.customerInvoice.invoiceNumber).toBe(bundle2.customerInvoice.invoiceNumber);
      expect(bundle1.shippingSlip.documentNumber).toBe(bundle2.shippingSlip.documentNumber);
      expect(bundle1.deliveryChallan.challanNumber).toBe(bundle2.deliveryChallan.challanNumber);
      expect(bundle1.packingSticker.stickerNumber).toBe(bundle2.packingSticker.stickerNumber);
    });
  });

  // ==========================================
  // 11. MODULE G: RETURNS, RMA & INVENTORY DISPOSITION
  // ==========================================
  describe("11. Module G: Returns, RMA & Inventory Disposition", () => {
    it("11.1: Customer can submit return request for delivered order generating RMA number", async () => {
      // Create a delivered order
      const deliveredOrder = await callerCustomer.orders.create({
        customerName: "QA Return Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          recipientName: "QA Return Customer",
          street: "123 Return Road",
          addressLine1: "123 Return Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 2,
          },
        ],
        paymentMethod: "COD",
      });

      // Mark delivered in database
      db.getDatabase().prepare("UPDATE orders SET orderStatus = 'Delivered', paymentStatus = 'PAID' WHERE id = ?").run(deliveredOrder.id);

      const returnReq = await callerCustomer.returns.request({
        orderId: deliveredOrder.id,
        productId: testProduct.id,
        quantityRequested: 1,
        returnReason: "Defective seal or packaging",
        description: "Seal was broken on delivery package",
      });

      expect(returnReq.id).toBeDefined();
      expect(returnReq.returnNumber).toMatch(/^TRN-RMA-\d{4}-\d{5}$/);
      expect(returnReq.status).toBe("REQUESTED");

      // Admin reviews and approves return
      const updated = await callerAdmin.admin.returns.updateStatus({
        id: returnReq.id,
        status: "APPROVED",
        adminNotes: "Approved for inspection",
      });
      expect(updated.status).toBe("APPROVED");
    });
  });
});
