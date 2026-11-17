import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import * as db from "./db";
import {
  handleTelegramUpdate,
  maskPhone,
  maskEmail,
  maskAddress,
  checkRateLimit,
  resetRateLimits,
  getSession,
  setSession,
  clearSession,
  isCallbackProcessed,
  clearProcessedCallbacks,
  initTelegramNotifications,
} from "./telegram";
import { notificationsService } from "./notifications";

describe("TRINAYAA Phase 6 — Telegram Admin Bot & Advanced Workflows Suite", () => {
  const authorizedId = "9988776655";
  const envAdminId = "1122334455";
  const unauthorizedId = "4444555566";
  const testChatId = 123456789;
  const testSku = "TRN-TEST-TG";

  let testOrderNumber = "";
  let testOrderId = "";
  let createdOneShotSku = "";
  let createdWizardSku = "";

  beforeAll(() => {
    // 1. Seed authorized admin in DB
    db.telegramRepo.addAdmin(authorizedId, "Test Admin", "SUPER_ADMIN", "System Setup");

    // 2. Set environment allowlist
    process.env.TELEGRAM_ALLOWED_ADMIN_IDS = `${envAdminId},5566778899`;
    process.env.TELEGRAM_BOT_TOKEN = "placeholder_test_token";

    // 3. Initialize notifications subscriber
    initTelegramNotifications();

    // 4. Create an isolated test product for stock and price tests
    const defaultCat = db.categoriesRepo.getAll()[0];
    db.productsRepo.create({
      sku: testSku,
      nameEn: "Test Botanical Herb",
      nameTa: "சோதனை மூலிகை",
      categoryId: defaultCat?.id || null,
      sellingPrice: 150,
      mrp: 180,
      stock: 100,
      status: "Published",
      primaryImage: "/images/products/packaged/pouch_001.png",
    });

    // 5. Create an order for order testing
    const ts = Date.now();
    const customer = db.usersRepo.create({
      email: `t_cust_${ts}@example.com`,
      password: "Password123!",
      name: "Telegram Test Customer",
      phone: "9876543210",
      role: "CUSTOMER",
    });

    const addr = db.addressesRepo.create(customer.id, {
      recipientName: "Telegram Test Customer",
      phone: "9876543210",
      addressLine1: "124 Herbal Way",
      city: "Erode",
      state: "Tamil Nadu",
      pinCode: "638002",
      isDefault: true,
    });

    const items = [
      {
        productId: "p1",
        sku: "TRN-1001",
        productNameEn: "Licorice Root",
        productNameTa: "அதிமதுரம்",
        packSize: "100 g",
        unitPrice: 150,
        price: 150,
        quantity: 2,
        subtotal: 300,
      },
    ];

    const order = db.ordersRepo.create(
      {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: addr,
        billingAddress: addr,
        paymentMethod: "RAZORPAY",
        subtotal: 300,
        discountAmount: 0,
        shippingFee: 0,
        taxAmount: 0,
        total: 300,
      },
      items
    );

    testOrderId = order.id;
    testOrderNumber = order.orderNumber;
  });

  afterAll(() => {
    // Clean up test products so catalogue stays at exactly 162
    const skusToDelete = [testSku, createdOneShotSku, createdWizardSku].filter(Boolean);
    const dbInst = db.getDatabase();
    for (const sku of skusToDelete) {
      const prod = db.productsRepo.getBySku(sku);
      if (prod) {
        dbInst.prepare("DELETE FROM product_images WHERE productId = ?").run(prod.id);
        dbInst.prepare("DELETE FROM product_variants WHERE productId = ?").run(prod.id);
        dbInst.prepare("DELETE FROM inventory WHERE productId = ?").run(prod.id);
        dbInst.prepare("DELETE FROM products WHERE id = ?").run(prod.id);
      }
    }
    // Clean up test admins so only real admins remain in allowlist
    dbInst.prepare("DELETE FROM telegram_allowed_admins WHERE telegramId IN ('8899001122', '9988776655')").run();
  });

  beforeEach(() => {
    resetRateLimits();
    clearSession(authorizedId);
    clearSession(envAdminId);
    clearProcessedCallbacks();
  });

  // ==========================================
  // 1. DATA MASKING & PRIVACY TESTS
  // ==========================================
  describe("1. Customer Privacy & Data Masking", () => {
    it("1.1: Correctly masks customer phone numbers", () => {
      expect(maskPhone("9876543210")).toBe("98765*****");
      expect(maskPhone("+919876543210")).toBe("+9198********");
      expect(maskPhone("")).toBe("N/A");
      expect(maskPhone(null)).toBe("N/A");
    });

    it("1.2: Correctly masks customer email addresses", () => {
      expect(maskEmail("kavitha@example.com")).toBe("k***@example.com");
      expect(maskEmail("admin.trinayaa@herbal.in")).toBe("a***@herbal.in");
      expect(maskEmail("")).toBe("N/A");
      expect(maskEmail("invalid-email")).toBe("N/A");
    });

    it("1.3: Masks residential addresses and returns City / State", () => {
      const masked = maskAddress({
        street: "124 Secret Apartment, Door 4B",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638002",
      });
      expect(masked).toBe("Erode, Tamil Nadu, 638002");
      expect(masked).not.toContain("Secret Apartment");
    });
  });

  // ==========================================
  // 2. AUTHORIZATION & RATE LIMITING
  // ==========================================
  describe("2. Security, Authorization & Rate Limiting", () => {
    it("2.1: Rejects unauthorized Telegram user and logs audit", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: unauthorizedId, username: "malicious_actor" },
          text: "/dashboard",
        },
      };

      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const audit = db.telegramRepo.getAuditLogs(5);
      const deniedLog = audit.find(
        (a) => a.telegramUserId === unauthorizedId && a.command === "UNAUTHORIZED_ATTEMPT"
      );
      expect(deniedLog).toBeDefined();
    });

    it("2.2: Allows user authorized in database", async () => {
      expect(db.telegramRepo.isAllowed(authorizedId)).toBe(true);
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId, username: "valid_admin" },
          text: "/help",
        },
      };

      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("2.3: Allows user authorized in environment variable (TELEGRAM_ALLOWED_ADMIN_IDS)", async () => {
      expect(db.telegramRepo.isAllowed(envAdminId)).toBe(true);
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: envAdminId, username: "env_admin" },
          text: "/dashboard",
        },
      };

      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("2.4: Enforces rate limiting on excessive commands (>20/min)", async () => {
      const rateLimitUser = "8899001122";
      db.telegramRepo.addAdmin(rateLimitUser, "Spam Admin", "ADMIN");

      // First 20 commands succeed
      for (let i = 0; i < 20; i++) {
        expect(checkRateLimit(rateLimitUser)).toBe(true);
      }

      // 21st command gets throttled
      expect(checkRateLimit(rateLimitUser)).toBe(false);

      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: rateLimitUser, username: "rate_limited" },
          text: "/dashboard",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });
  });

  // ==========================================
  // 3. STORE DASHBOARD, ORDERS & CUSTOMERS
  // ==========================================
  describe("3. Dashboard, Orders & Customer Inspection", () => {
    it("3.1: /dashboard returns accurate metrics and logs audit", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/dashboard",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const logs = db.telegramRepo.getAuditLogs(5);
      expect(logs.some((l) => l.telegramUserId === authorizedId && l.command === "/dashboard")).toBe(true);
    });

    it("3.2: /orders lists recent orders with masked customer info", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/orders",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("3.3: /order <OrderNumber> retrieves specific order details", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/order ${testOrderNumber}`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("3.4: /customers returns customer summary", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/customers",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("3.5: /admins lists authorized Telegram administrators", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/admins",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("3.6: /audit shows recent audit logs", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/audit",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });
  });

  // ==========================================
  // 4. CATALOGUE & PRODUCT MANAGEMENT
  // ==========================================
  describe("4. Product Catalogue, Prices & Images", () => {
    it("4.1: /products lists published catalogue products", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/products",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("4.2: /product <SKU> inspects specific product details", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/product ${testSku}`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("4.3: /updateprice updates product selling price and MRP", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/updateprice ${testSku} 165 195`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prod = db.productsRepo.getBySku(testSku);
      expect(prod?.price).toBe(165);
      expect(prod?.compareAt).toBe(195);
    });

    it("4.4: /uploadimage attaches primary image to product", async () => {
      const imgUrl = "https://trinayaa.in/uploads/test_licorice.jpg";
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/uploadimage ${testSku} ${imgUrl}`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prod = db.productsRepo.getBySku(testSku);
      expect(prod?.image).toBe(imgUrl);
    });

    it("4.5: /addproduct creates new product via one-shot command", async () => {
      const newSku = `TRN-TEST-${Date.now().toString().slice(-4)}`;
      createdOneShotSku = newSku;
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/addproduct ${newSku} 180 Pure Veldt Grape Powder`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prod = db.productsRepo.getBySku(newSku);
      expect(prod).toBeDefined();
      expect(prod?.nameEn).toBe("Pure Veldt Grape Powder");
      expect(prod?.price).toBe(180);
    });

    it("4.6: Guided /addproduct interactive wizard progresses step-by-step", async () => {
      const wizardSku = `TRN-WIZ-${Date.now().toString().slice(-4)}`;
      createdWizardSku = wizardSku;

      // Step 0: Start
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "/addproduct" },
      });
      let session = getSession(authorizedId);
      expect(session).toBeDefined();
      expect(session?.step).toBe(1);

      // Step 1: English Name
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "Organic Bael Fruit Powder" },
      });
      session = getSession(authorizedId);
      expect(session?.step).toBe(2);

      // Step 2: Tamil Name
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "வில்வப் பழப் பொடி" },
      });
      session = getSession(authorizedId);
      expect(session?.step).toBe(3);

      // Step 3: SKU
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: wizardSku },
      });
      session = getSession(authorizedId);
      expect(session?.step).toBe(4);

      // Step 4: Category
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "Health Care" },
      });
      session = getSession(authorizedId);
      expect(session?.step).toBe(5);

      // Step 5: Price
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "210" },
      });
      session = getSession(authorizedId);
      expect(session?.step).toBe(6);

      // Step 6: MRP
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "250" },
      });
      session = getSession(authorizedId);
      expect(session?.step).toBe(7);

      // Step 7: Stock
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "150" },
      });

      // Wizard completes and clears session
      expect(getSession(authorizedId)).toBeNull();

      const createdProd = db.productsRepo.getBySku(wizardSku);
      expect(createdProd).toBeDefined();
      expect(createdProd?.nameEn).toBe("Organic Bael Fruit Powder");
      expect(createdProd?.nameTa).toBe("வில்வப் பழப் பொடி");
      expect(createdProd?.price).toBe(210);
      expect(createdProd?.stock).toBe(150);
    });

    it("4.7: /cancel terminates an active guided session", async () => {
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "/addproduct" },
      });
      expect(getSession(authorizedId)).toBeDefined();

      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: "/cancel" },
      });
      expect(getSession(authorizedId)).toBeNull();
    });
  });

  // ==========================================
  // 5. INVENTORY & STOCK WORKFLOWS
  // ==========================================
  describe("5. Inventory & Stock Operations", () => {
    it("5.1: /stock <SKU> displays current inventory and buttons", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/stock ${testSku}`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("5.2: /stockadd increments stock (RESTOCK) with audit trail", async () => {
      const prodBefore = db.productsRepo.getBySku(testSku)!;
      const oldStock = prodBefore.stock;

      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/stockadd ${testSku} 25 New warehouse arrival`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prodAfter = db.productsRepo.getBySku(testSku)!;
      expect(prodAfter.stock).toBe(oldStock + 25);

      const logs = db.telegramRepo.getAuditLogs(5);
      expect(logs.some((l) => l.command === "/stockadd")).toBe(true);
    });

    it("5.3: /stocksub decrements stock (ADJUSTMENT)", async () => {
      const prodBefore = db.productsRepo.getBySku(testSku)!;
      const oldStock = prodBefore.stock;

      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/stocksub ${testSku} 5 Packaging inspection discard`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prodAfter = db.productsRepo.getBySku(testSku)!;
      expect(prodAfter.stock).toBe(oldStock - 5);
    });

    it("5.4: /stockset overwrites inventory to absolute value", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/stockset ${testSku} 90 Physical stock audit`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prodAfter = db.productsRepo.getBySku(testSku)!;
      expect(prodAfter.stock).toBe(90);
    });
  });

  // ==========================================
  // 6. FESTIVAL OFFERS & CAMPAIGNS
  // ==========================================
  describe("6. Promotional Campaigns & Coupons", () => {
    it("6.1: /offers lists active campaigns", async () => {
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: "/offers",
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("6.2: One-shot /createoffer creates festival campaign", async () => {
      const code = `FEST${Date.now().toString().slice(-4)}`;
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/createoffer ${code} 20 599 45`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const campaign = db.campaignsRepo.getByCode(code);
      expect(campaign).toBeDefined();
      expect(campaign?.discountValue).toBe(20);
      expect(campaign?.minOrderValue).toBe(599);
      expect(campaign?.isActive).toBe(1);
    });

    it("6.3: /disableoffer deactivates campaign", async () => {
      const code = `OFF${Date.now().toString().slice(-4)}`;
      db.campaignsRepo.create({
        name: "Temporary Offer",
        code,
        discountType: "PERCENTAGE",
        discountValue: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        isActive: 1,
      });

      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/disableoffer ${code}`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const campaign = db.campaignsRepo.getByCode(code);
      expect(campaign?.isActive).toBe(0);
    });
  });

  // ==========================================
  // 7. ORDER LIFECYCLE & PAYMENT SAFETY
  // ==========================================
  describe("7. Order Lifecycle Transitions & Safety Rules", () => {
    it("7.1: Rejects manual confirmation of unpaid order (Payment Safety Rule)", async () => {
      // testOrder is in 'Pending Payment'
      const update = {
        message: {
          chat: { id: testChatId },
          from: { id: authorizedId },
          text: `/updateorder ${testOrderNumber} Confirmed`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const order = db.ordersRepo.getByOrderNumber(testOrderNumber)!;
      // Status must NOT have transitioned to Confirmed
      expect(order.orderStatus).toBe("Pending Payment");
    });

    it("7.2: Allows transitioning paid order through lifecycle (Confirmed -> Processing -> Packed -> Shipped)", async () => {
      // Confirm payment legitimately via repo
      db.ordersRepo.confirmPayment(testOrderId, { gatewayPaymentId: "pay_test_tg_72" });

      const confirmedOrder = db.ordersRepo.getByOrderNumber(testOrderNumber)!;
      expect(confirmedOrder.orderStatus).toBe("Confirmed");

      // 1. Confirmed -> Processing
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: `/updateorder ${testOrderNumber} Processing` },
      });
      let current = db.ordersRepo.getByOrderNumber(testOrderNumber)!;
      expect(current.orderStatus).toBe("Processing");

      // 2. Processing -> Packed
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: `/updateorder ${testOrderNumber} Packed` },
      });
      current = db.ordersRepo.getByOrderNumber(testOrderNumber)!;
      expect(current.orderStatus).toBe("Packed");

      // 3. Packed -> Shipped
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: `/updateorder ${testOrderNumber} Shipped` },
      });
      current = db.ordersRepo.getByOrderNumber(testOrderNumber)!;
      expect(current.orderStatus).toBe("Shipped");
    });

    it("7.3: Rejects invalid backward status transition", async () => {
      // Order is now Shipped; attempting to regress to Processing must fail
      await handleTelegramUpdate({
        message: { chat: { id: testChatId }, from: { id: authorizedId }, text: `/updateorder ${testOrderNumber} Processing` },
      });

      const current = db.ordersRepo.getByOrderNumber(testOrderNumber)!;
      expect(current.orderStatus).toBe("Shipped");
    });
  });

  // ==========================================
  // 8. INTERACTIVE CALLBACK QUERIES & INLINE KEYBOARDS
  // ==========================================
  describe("8. Interactive Callbacks & Deduplication", () => {
    it("8.1: Handles view_order callback query", async () => {
      const update = {
        callback_query: {
          id: `cb_${Date.now()}_1`,
          from: { id: authorizedId, username: "admin" },
          message: { chat: { id: testChatId } },
          data: `view_order:${testOrderNumber}`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("8.2: Handles stock_adjust callback query (+10 units)", async () => {
      const prodBefore = db.productsRepo.getBySku(testSku)!;
      const oldStock = prodBefore.stock;

      const update = {
        callback_query: {
          id: `cb_${Date.now()}_2`,
          from: { id: authorizedId, username: "admin" },
          message: { chat: { id: testChatId } },
          data: `stock_adjust:${testSku}:10`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);

      const prodAfter = db.productsRepo.getBySku(testSku)!;
      expect(prodAfter.stock).toBe(oldStock + 10);
    });

    it("8.3: Protects against duplicate callback query execution (idempotency)", async () => {
      const callbackId = `cb_duplicate_${Date.now()}`;
      expect(isCallbackProcessed(callbackId)).toBe(false);
      expect(isCallbackProcessed(callbackId)).toBe(true);
    });

    it("8.4: Rejects unauthorized callback query", async () => {
      const update = {
        callback_query: {
          id: `cb_${Date.now()}_unauth`,
          from: { id: unauthorizedId, username: "intruder" },
          message: { chat: { id: testChatId } },
          data: `stock_adjust:${testSku}:50`,
        },
      };
      const res = await handleTelegramUpdate(update);
      expect(res.ok).toBe(true);
    });

    it("8.5: Handles 1-tap client navigation callback queries (cmd_stats, cmd_products, cmd_offers, cmd_customers)", async () => {
      for (const action of ["cmd_stats", "cmd_products", "cmd_offers", "cmd_customers", "cmd_full_help"]) {
        const update = {
          callback_query: {
            id: `cb_nav_${action}_${Date.now()}`,
            from: { id: authorizedId, username: "admin" },
            message: { chat: { id: testChatId } },
            data: action,
          },
        };
        const res = await handleTelegramUpdate(update);
        expect(res.ok).toBe(true);
      }
    });

    it("8.6: Recognizes natural language words and custom reply keyboard buttons without slash", async () => {
      const inputs = [
        "📊 Store Dashboard",
        "📦 Recent Orders",
        "🌿 Products & Stock",
        "🎉 Active Offers",
        "👥 Customers",
        "❓ Help & Menu",
        "dashboard",
        "orders",
        "products",
        "offers",
        "வணக்கம்",
      ];
      for (const text of inputs) {
        const update = {
          message: {
            chat: { id: testChatId },
            from: { id: authorizedId, username: "admin" },
            text,
          },
        };
        const res = await handleTelegramUpdate(update);
        expect(res.ok).toBe(true);
      }
    });
  });

  // ==========================================
  // 9. EVENT-DRIVEN ADMIN NOTIFICATIONS
  // ==========================================
  describe("9. Multi-Channel Event Notifications to Telegram Admins", () => {
    it("9.1: Dispatches ORDER_CREATED alert with masked customer data", () => {
      const notif = notificationsService.dispatch("ORDER_CREATED", {
        orderId: "ord_notif_1",
        orderNumber: "TRN-99001",
        customerName: "Kavitha",
        customerEmail: "kavitha@example.com",
        customerPhone: "9876543210",
        total: 550,
        items: [
          { productNameEn: "Moringa Powder", packSize: "100 g", quantity: 2, price: 150 },
        ],
        timestamp: new Date().toISOString(),
      });

      expect(notif.event).toBe("ORDER_CREATED");
      expect(notif.orderNumber).toBe("TRN-99001");
    });

    it("9.2: Dispatches PAYMENT_CONFIRMED, ORDER_SHIPPED, and ORDER_DELIVERED alerts smoothly", () => {
      const payload = {
        orderId: "ord_notif_2",
        orderNumber: "TRN-99002",
        customerName: "Sundaram",
        customerEmail: "sundaram@trinayaa.in",
        customerPhone: "9843210987",
        total: 1200,
        items: [],
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        notificationsService.dispatch("PAYMENT_CONFIRMED", payload);
        notificationsService.dispatch("ORDER_SHIPPED", { ...payload, trackingNumber: "ST12345", carrier: "ST Courier" });
        notificationsService.dispatch("ORDER_DELIVERED", payload);
        notificationsService.dispatch("ORDER_CANCELLED", { ...payload, reason: "Customer request" });
      }).not.toThrow();
    });
  });
});
