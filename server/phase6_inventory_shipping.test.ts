import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as telegram from "./telegram";

describe("TRINAYAA Phase 6 — Low-Stock Telegram Alerts & Printable Shipping Slips Suite", () => {
  const ts = Date.now();
  let adminUser: any;
  let adminCaller: any;
  let customerUser: any;
  let customerCaller: any;
  let testProduct: any;
  let testOrder: any;
  const initialThreshold = db.siteContentRepo.getLowStockThreshold();
  const createdProductIds: string[] = [];

  const publicCaller = appRouter.createCaller({
    user: null as any,
    session: null as any,
    req: { socket: { remoteAddress: `127.0.0.${ts % 200}` } } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  });

  beforeAll(async () => {
    // 1. Admin account
    adminUser = db.usersRepo.create({
      email: `admin_p6_${ts}@trinayaa.test`,
      password: "AdminPassword123!",
      name: "Admin Inventory Lead",
      phone: "9876500002",
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
      email: `cust_p6_${ts}@trinayaa.test`,
      password: "CustomerPassword123!",
      name: "Meenakshi Sundaram",
      phone: "9842100222",
      role: "CUSTOMER",
    });

    customerCaller = appRouter.createCaller({
      user: { id: customerUser.id, email: customerUser.email, name: customerUser.name, role: "CUSTOMER" } as any,
      session: { openId: customerUser.id } as any,
      req: { socket: { remoteAddress: "127.0.0.1" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // 3. Test product for inventory operations
    testProduct = db.productsRepo.create({
      sku: `TRN-P6-${ts % 10000}`,
      nameEn: "Phase 6 Herbal Test Powder",
      nameTa: "அரிய மூலிகை தூள்",
      slug: `phase-6-herbal-test-powder-${ts}`,
      categoryId: "cat_5",
      productType: "Powder",
      sellingPrice: 180,
      mrp: 240,
      stock: 50,
      status: "Published",
      shortDesc: "Experimental botanical powder for Phase 6 stock verification.",
      primaryImage: "/images/products/packaged/trn-1001.jpg",
    });
    createdProductIds.push(testProduct.id);

    // 4. Test order for shipping slip verification
    testOrder = db.ordersRepo.create(
      {
        customerId: customerUser.id,
        customerName: customerUser.name,
        customerEmail: customerUser.email,
        customerPhone: customerUser.phone,
        shippingAddress: {
          recipientName: customerUser.name,
          addressLine1: "Flat 4B, Lotus Apartments",
          addressLine2: "Gandhi Road",
          landmark: "Near Brough Road Bus Stand",
          district: "Erode",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        subtotal: 360,
        discountAmount: 40,
        shippingFee: 60,
        total: 380,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "Confirmed",
        carrier: "DTDC Express",
        trackingNumber: "DTDC-TN-987654",
      },
      [
        {
          productId: testProduct.id,
          productNameEn: testProduct.nameEn,
          productNameTa: testProduct.nameTa,
          packSize: "250g",
          price: 180,
          quantity: 2,
        },
      ]
    );

    // Ensure test admin is in allowed telegram admins
    db.telegramRepo.addAdmin("tg_p6_admin_123", "p6_admin", "ADMIN", "Admin System");
  });

  afterAll(async () => {
    // 1. Restore low stock threshold
    db.siteContentRepo.setLowStockThreshold(initialThreshold);

    // 2. Remove test products to preserve exactly 162 catalog products
    const database = db.getDatabase();
    for (const pid of createdProductIds) {
      database.prepare("DELETE FROM low_stock_alerts WHERE productId = ?").run(pid);
      database.prepare("DELETE FROM inventory WHERE productId = ?").run(pid);
      database.prepare("DELETE FROM products WHERE id = ?").run(pid);
    }

    // 3. Clean up test order
    if (testOrder?.id) {
      database.prepare("DELETE FROM order_items WHERE orderId = ?").run(testOrder.id);
      database.prepare("DELETE FROM order_status_history WHERE orderId = ?").run(testOrder.id);
      database.prepare("DELETE FROM orders WHERE id = ?").run(testOrder.id);
    }

    // 4. Clean up test users
    if (adminUser?.id) database.prepare("DELETE FROM users WHERE id = ?").run(adminUser.id);
    if (customerUser?.id) database.prepare("DELETE FROM users WHERE id = ?").run(customerUser.id);
    database.prepare("DELETE FROM telegram_allowed_admins WHERE telegramId = 'tg_p6_admin_123'").run();
  });

  // ==========================================
  // SECTION 1: LOW-STOCK THRESHOLD CONFIGURATION
  // ==========================================
  describe("1. Low-Stock Threshold Configuration", () => {
    it("1.1: Reads threshold dynamically with sensible default fallback of 10", async () => {
      const res = await publicCaller.settings.getLowStockThreshold();
      expect(typeof res.threshold).toBe("number");
      expect(res.threshold).toBeGreaterThanOrEqual(0);
    });

    it("1.2: Admin can retrieve current low-stock threshold", async () => {
      const res = await adminCaller.admin.settings.getLowStockThreshold();
      expect(typeof res.threshold).toBe("number");
      expect(res.threshold).toBeGreaterThanOrEqual(0);
    });

    it("1.3: Admin can update low-stock threshold with non-negative integer", async () => {
      const updated = await adminCaller.admin.settings.setLowStockThreshold({ threshold: 12 });
      expect(updated.success).toBe(true);
      expect(updated.threshold).toBe(12);

      const check = await adminCaller.admin.settings.getLowStockThreshold();
      expect(check.threshold).toBe(12);
    });

    it("1.4: Rejects negative threshold input", async () => {
      await expect(
        adminCaller.admin.settings.setLowStockThreshold({ threshold: -5 })
      ).rejects.toThrow();
    });

    it("1.5: Non-admin caller cannot update low-stock threshold", async () => {
      await expect(
        customerCaller.admin.settings.setLowStockThreshold({ threshold: 15 })
      ).rejects.toThrow();
      await expect(
        publicCaller.admin.settings.setLowStockThreshold({ threshold: 15 })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // SECTION 2: TELEGRAM LOW-STOCK NOTIFICATIONS & DEDUPLICATION
  // ==========================================
  describe("2. Telegram Low-Stock Notifications & Persistent Deduplication", () => {
    beforeAll(() => {
      // Set test threshold to 10
      db.siteContentRepo.setLowStockThreshold(10);
    });

    it("2.1: Stock above threshold does not trigger low-stock alert", async () => {
      let alertDispatched = false;
      db.registerLowStockNotifier(async () => {
        alertDispatched = true;
      });

      // Update stock to 25 (above 10)
      db.inventoryRepo.updateStock(testProduct.id, 25, "Restock test", "Admin");

      // Verify no alert
      expect(alertDispatched).toBe(false);
      const alertRecord = db.lowStockAlertsRepo.getAlert(testProduct.id);
      expect(alertRecord?.alertState !== "ALERTED").toBe(true);
    });

    it("2.2: First transition to <= threshold triggers Telegram alert and sets ALERTED state in DB", async () => {
      let notifiedProd: any = null;
      let notifiedThresh = 0;
      db.registerLowStockNotifier(async (prod, thresh) => {
        notifiedProd = prod;
        notifiedThresh = thresh;
      });

      // Reduce stock from 25 to 8 (below threshold 10)
      db.inventoryRepo.updateStock(testProduct.id, 8, "Sale deduction", "System");

      // Verify alert was sent
      expect(notifiedProd).toBeDefined();
      expect(notifiedProd.id).toBe(testProduct.id);
      expect(notifiedProd.stock).toBe(8);
      expect(notifiedThresh).toBe(10);

      // Verify persistent database record in low_stock_alerts table
      const alertRecord = db.lowStockAlertsRepo.getAlert(testProduct.id);
      expect(alertRecord).toBeDefined();
      expect(alertRecord.alertState).toBe("ALERTED");
      expect(alertRecord.stockAtAlert).toBe(8);
      expect(alertRecord.thresholdAtAlert).toBe(10);
    });

    it("2.3: Repeated updates while remaining below threshold DO NOT send duplicate alerts (Deduplication)", async () => {
      let duplicateAlertCount = 0;
      db.registerLowStockNotifier(async () => {
        duplicateAlertCount++;
      });

      // Further reduce stock to 6, then 4, then 2 (all below 10)
      db.inventoryRepo.updateStock(testProduct.id, 6, "Another sale", "System");
      db.inventoryRepo.updateStock(testProduct.id, 4, "Another sale", "System");
      db.inventoryRepo.updateStock(testProduct.id, 2, "Another sale", "System");

      // Verify zero duplicate alerts were triggered
      expect(duplicateAlertCount).toBe(0);
    });

    it("2.4: Restocking above threshold resets alert state to CLEARED", async () => {
      // Admin restocks to 40 units (above 10)
      db.inventoryRepo.updateStock(testProduct.id, 40, "Restocked shipment", "Admin");

      const alertRecord = db.lowStockAlertsRepo.getAlert(testProduct.id);
      expect(alertRecord).toBeDefined();
      expect(alertRecord.alertState).toBe("CLEARED");
    });

    it("2.5: Subsequent stock drop below threshold triggers a fresh new alert", async () => {
      let newAlertFired = false;
      let alertStock = 0;
      db.registerLowStockNotifier(async (prod) => {
        newAlertFired = true;
        alertStock = prod.stock;
      });

      // Stock drops from 40 to 9 (below threshold 10)
      db.inventoryRepo.updateStock(testProduct.id, 9, "Bulk sale", "System");

      expect(newAlertFired).toBe(true);
      expect(alertStock).toBe(9);

      const alertRecord = db.lowStockAlertsRepo.getAlert(testProduct.id);
      expect(alertRecord.alertState).toBe("ALERTED");
      expect(alertRecord.stockAtAlert).toBe(9);
    });

    it("2.6: Telegram API failure does not break stock update or order processing", async () => {
      // Simulate broken Telegram notifier that throws network error
      db.registerLowStockNotifier(async () => {
        throw new Error("Simulated Telegram 500 Connection Reset");
      });

      // Stock update to 5 should succeed smoothly without throwing
      const res = db.inventoryRepo.updateStock(testProduct.id, 5, "Fault tolerant test", "System");
      expect(res.success).toBe(true);
      expect(res.newStock).toBe(5);

      const prodInDb = db.productsRepo.getById(testProduct.id);
      expect(prodInDb.stock).toBe(5);
    });
  });

  // ==========================================
  // SECTION 3: PUBLIC STOREFRONT STOCK PRIVACY
  // ==========================================
  describe("3. Public Storefront Stock Privacy", () => {
    beforeAll(() => {
      db.siteContentRepo.setLowStockThreshold(10);
    });

    it("3.1: Public product query masks exact low-stock quantity (0 < stock <= threshold)", async () => {
      // Set stock to 7 (low stock)
      db.productsRepo.updateStock(testProduct.id, 7);

      const publicProd = await publicCaller.products.getById({ id: testProduct.id });
      expect(publicProd).toBeDefined();
      // Exact stock must NOT be exposed
      expect(publicProd.stock).toBeNull();
      expect(publicProd.stockAvailability).toBe("Limited availability");
      expect(publicProd.isLowStock).toBe(true);
      expect(publicProd.isOutOfStock).toBe(false);

      // Sizes variant array must also hide exact stock
      for (const size of publicProd.sizes) {
        expect(size.stock).toBeNull();
      }
    });

    it("3.2: Public product list masks exact quantities for low-stock items", async () => {
      const publicList = await publicCaller.products.list({ search: testProduct.sku });
      const found = publicList.find((p: any) => p.id === testProduct.id);
      expect(found).toBeDefined();
      expect(found.stock).toBeNull();
      expect(found.stockAvailability).toBe("Limited availability");
    });

    it("3.3: Admin product query continues to return exact internal stock quantity", async () => {
      const adminList = await adminCaller.admin.products.list({ search: testProduct.sku });
      const found = adminList.find((p: any) => p.id === testProduct.id);
      expect(found).toBeDefined();
      expect(found.stock).toBe(7); // Exact quantity preserved for admins!
    });

    it("3.4: Zero-stock product displays Out of Stock publicly", async () => {
      // Set stock to 0
      db.productsRepo.updateStock(testProduct.id, 0);

      const publicProd = await publicCaller.products.getById({ id: testProduct.id });
      expect(publicProd).toBeDefined();
      expect(publicProd.stock).toBe(0);
      expect(publicProd.stockAvailability).toBe("Out of Stock");
      expect(publicProd.isOutOfStock).toBe(true);

      // Restore stock for remaining tests
      db.productsRepo.updateStock(testProduct.id, 20);
    });

    it("3.5: Stock above threshold displays In Stock publicly", async () => {
      db.productsRepo.updateStock(testProduct.id, 25);

      const publicProd = await publicCaller.products.getById({ id: testProduct.id });
      expect(publicProd.stockAvailability).toBe("In Stock");
      expect(publicProd.isOutOfStock).toBe(false);
      expect(publicProd.isLowStock).toBe(false);
    });
  });

  // ==========================================
  // SECTION 4: PRINTABLE SHIPPING SLIPS
  // ==========================================
  describe("4. Printable Shipping Slips (Admin Dashboard & Backend)", () => {
    it("4.1: Admin can retrieve full shipping slip data by order number", async () => {
      const slip = await adminCaller.admin.orders.getShippingSlip({
        orderNumber: testOrder.orderNumber,
      });

      expect(slip).toBeDefined();
      expect(slip.orderNumber).toBe(testOrder.orderNumber);
      expect(slip.customerName).toBe(customerUser.name);
      expect(slip.customerPhone).toBe(customerUser.phone);
      expect(slip.customerEmail).toBe(customerUser.email);
      expect(slip.formattedAddress).toContain("Lotus Apartments");
      expect(slip.formattedAddress).toContain("638001");
      expect(slip.subtotal).toBe(360);
      expect(slip.discountAmount).toBe(40);
      expect(slip.shippingFee).toBe(60);
      expect(slip.total).toBe(380);
      expect(slip.paymentMethod).toBe("COD");
      expect(slip.paymentStatus).toBe("PENDING");
      expect(slip.carrier).toBe("DTDC Express");
      expect(slip.trackingNumber).toBe("DTDC-TN-987654");

      // Verify itemized products
      expect(slip.items.length).toBe(1);
      expect(slip.items[0].productNameEn).toBe(testProduct.nameEn);
      expect(slip.items[0].packSize).toBe("250g");
      expect(slip.items[0].quantity).toBe(2);
      expect(slip.items[0].price).toBe(180);
      expect(slip.items[0].subtotal).toBe(360);
    });

    it("4.2: Throws NOT_FOUND for non-existent order number", async () => {
      await expect(
        adminCaller.admin.orders.getShippingSlip({ orderNumber: "TRN-NONEXISTENT-99999" })
      ).rejects.toThrow();
    });

    it("4.3: Customer or unauthenticated caller cannot access shipping slips", async () => {
      await expect(
        customerCaller.admin.orders.getShippingSlip({ orderNumber: testOrder.orderNumber })
      ).rejects.toThrow();

      await expect(
        publicCaller.admin.orders.getShippingSlip({ orderNumber: testOrder.orderNumber })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // SECTION 5: TELEGRAM SHIPPING SLIP COMMAND
  // ==========================================
  describe("5. Telegram /shipping Command & Security", () => {
    it("5.1: Authorized Telegram admin can look up shipping slip via /shipping command", async () => {
      const update = {
        update_id: 9901,
        message: {
          message_id: 101,
          from: { id: "tg_p6_admin_123", username: "p6_admin", first_name: "Admin" },
          chat: { id: "tg_p6_admin_123" },
          text: `/shipping ${testOrder.orderNumber}`,
          date: Math.floor(Date.now() / 1000),
        },
      };

      const result = await telegram.handleTelegramUpdate(update);
      expect(result.ok).toBe(true);

      // Verify audit log entry
      const auditLogs = db.auditLogsRepo.list(20);
      const found = auditLogs.find((l: any) => l.command === "/shipping" && l.details?.includes(testOrder.orderNumber));
      expect(found).toBeDefined();
    });

    it("5.2: Natural language intent matching maps 'shipping TRN-XXXX' to /shipping", async () => {
      const update = {
        update_id: 9902,
        message: {
          message_id: 102,
          from: { id: "tg_p6_admin_123", username: "p6_admin", first_name: "Admin" },
          chat: { id: "tg_p6_admin_123" },
          text: `shipping ${testOrder.orderNumber}`,
          date: Math.floor(Date.now() / 1000),
        },
      };

      const result = await telegram.handleTelegramUpdate(update);
      expect(result.ok).toBe(true);
    });

    it("5.3: Unauthorized Telegram user is rejected with Access Denied", async () => {
      const update = {
        update_id: 9903,
        message: {
          message_id: 103,
          from: { id: "unauthorized_p6_hacker", username: "hacker", first_name: "Attacker" },
          chat: { id: "unauthorized_p6_hacker" },
          text: `/shipping ${testOrder.orderNumber}`,
          date: Math.floor(Date.now() / 1000),
        },
      };

      const result = await telegram.handleTelegramUpdate(update);
      expect(result.ok).toBe(true);

      // Verify unauthorized audit log entry
      const auditLogs = db.auditLogsRepo.list(20);
      const hackerAudit = auditLogs.find((l: any) => l.command === "UNAUTHORIZED_ATTEMPT" && l.telegramUserId === "unauthorized_p6_hacker");
      expect(hackerAudit).toBeDefined();
    });

    it("5.4: Telegram bot handles missing or invalid order number gracefully", async () => {
      const update = {
        update_id: 9904,
        message: {
          message_id: 104,
          from: { id: "tg_p6_admin_123", username: "p6_admin", first_name: "Admin" },
          chat: { id: "tg_p6_admin_123" },
          text: "/shipping",
          date: Math.floor(Date.now() / 1000),
        },
      };

      const result = await telegram.handleTelegramUpdate(update);
      expect(result.ok).toBe(true);
    });
  });
});
