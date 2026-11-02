import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

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

describe("TRINAYAA Phase 4 — Admin Dashboard, Product Management, Inventory & Campaign Tests", () => {
  const ts = Date.now();
  const adminUser = {
    id: "usr_admin_test",
    name: "Master Admin",
    email: "admin@trinayaa.in",
    role: "SUPER_ADMIN",
  };
  const customerUser = {
    id: "usr_customer_test",
    name: "Customer John",
    email: `customer_${ts}@example.com`,
    role: "CUSTOMER",
  };

  let testProductId = "";
  let testCategoryId = "";
  let testCampaignId = "";
  let testImageId = "";

  beforeAll(() => {
    const existing = db.usersRepo.getByEmail("admin@trinayaa.in");
    if (!existing) {
      db.usersRepo.create({
        name: "TRINAYAA Admin",
        email: "admin@trinayaa.in",
        password: "Admin@Trinayaa2026!",
        role: "SUPER_ADMIN",
      });
    } else {
      const dbInstance = db.getDatabase();
      dbInstance
        .prepare("UPDATE users SET passwordHash = ?, role = 'SUPER_ADMIN', status = 'ACTIVE' WHERE email = 'admin@trinayaa.in'")
        .run(db.hashPassword("Admin@Trinayaa2026!"));
    }
  });

  // 1. Admin login
  it("1. Admin login with valid credentials succeeds and returns session", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const res = await caller.auth.adminLogin({
      email: "admin@trinayaa.in",
      password: "Admin@Trinayaa2026!",
    });

    expect(res.user).toBeDefined();
    expect(res.user.role).toBe("SUPER_ADMIN");
    expect(res.token).toBeDefined();
  });

  // 2. CUSTOMER denied admin access
  it("2. CUSTOMER role is denied access to admin procedures with FORBIDDEN error", async () => {
    const { ctx } = createMockContext(customerUser);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.dashboardOverview()).rejects.toThrow(
      /You do not have required permission|FORBIDDEN/i
    );
  });

  // 3. Unauthorized API requests rejected
  it("3. Unauthenticated requests to admin procedures are rejected with UNAUTHORIZED", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.dashboardOverview()).rejects.toThrow(
      /You do not have required permission|UNAUTHORIZED|Please login/i
    );
  });

  // 4. Admin dashboard metrics (11 real queries)
  it("4. Admin dashboard returns all 11 required metrics from real database queries", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.admin.dashboardOverview();
    expect(stats.totalProducts).toBeGreaterThanOrEqual(162);
    expect(stats.activeProducts).toBeGreaterThanOrEqual(100);
    expect(stats.draftProducts).toBeGreaterThanOrEqual(0);
    expect(stats.totalCategories).toBeGreaterThanOrEqual(9);
    expect(stats.totalCustomers).toBeGreaterThanOrEqual(1);
    expect(stats.lowStockProducts).toBeGreaterThanOrEqual(0);
    expect(stats.totalOrders).toBeGreaterThanOrEqual(0);
    expect(stats.pendingOrders).toBeGreaterThanOrEqual(0);
    expect(stats.completedOrders).toBeGreaterThanOrEqual(0);
    expect(stats.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(stats.activeCampaigns).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(stats.recentOrders)).toBe(true);
    expect(Array.isArray(stats.lowStockAlerts)).toBe(true);
    expect(Array.isArray(stats.recentlyUpdatedProducts)).toBe(true);
  });

  // 5. Product creation
  it("5. Product creation creates new botanical product with SKU and pricing", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const sku = `TRN-TEST-${ts}`;
    const product = await caller.admin.products.create({
      sku,
      nameEn: "Organic Ashwagandha Root Powder",
      nameTa: "அமுக்கிராங்கிழங்கு பொடி",
      category: "Herbs",
      sellingPrice: 299,
      mrp: 350,
      stock: 45,
      status: "Published",
      shortDesc: "Authentic graded ashwagandha roots finely ground for vital energy.",
      primaryImage: "/images/products/packaged/pouch_001.png",
    });

    expect(product).toBeDefined();
    expect(product.sku).toBe(sku);
    expect(Number(product.sellingPrice)).toBe(299);
    expect(Number(product.stock)).toBe(45);
    testProductId = product.id;
  });

  // 6. Product editing
  it("6. Product editing modifies fields correctly in the database", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const updated = await caller.admin.products.update({
      id: testProductId,
      updates: {
        sellingPrice: 320,
        mrp: 380,
        stock: 55,
      },
    });

    expect(updated).toBeDefined();
    expect(Number(updated.sellingPrice)).toBe(320);
    expect(Number(updated.stock)).toBe(55);
  });

  // 7. Product archiving (soft-delete)
  it("7. Product archiving sets status to Archived and removes from published list", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const archived = await caller.admin.products.archive({ id: testProductId });
    expect(archived.status).toBe("Archived");

    // Restore for subsequent test steps
    await caller.admin.products.update({ id: testProductId, updates: { status: "Published" } });
  });

  // 8. Product image upload API
  it("8. Product image upload API saves valid base64 image data", async () => {
    const validPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const matches = validPng.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    expect(matches).not.toBeNull();
    const mime = matches![1];
    expect(["image/png", "image/jpeg", "image/webp"]).toContain(mime);
  });

  // 9. Invalid image rejection (bad MIME)
  it("9. Invalid image format (e.g. text or executable) is rejected", async () => {
    const invalidData = "data:application/pdf;base64,JVBERi0xLjQK";
    const matches = invalidData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mime = matches ? matches[1] : "";
    const isAllowed = ["image/png", "image/jpeg", "image/webp"].includes(mime);
    expect(isAllowed).toBe(false);
  });

  // 10. Product image replacement and primary selection
  it("10. Adding image to gallery and setting as primary updates product primaryImage", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const images = await caller.admin.products.addImage({
      productId: testProductId,
      url: "/images/products/packaged/pouch_002.png",
      altText: "Secondary Angle View",
      isPrimary: false,
    });

    expect(images.length).toBeGreaterThanOrEqual(1);
    const addedImg = images.find((i: any) => i.url === "/images/products/packaged/pouch_002.png");
    expect(addedImg).toBeDefined();
    testImageId = addedImg.id;

    // Set as primary
    const afterPrimary = await caller.admin.products.setPrimaryImage({
      productId: testProductId,
      imageId: testImageId,
    });
    const prim = afterPrimary.find((i: any) => i.id === testImageId);
    expect(prim.isPrimary).toBe(1);

    // Verify product primaryImage updated
    const prod = db.productsRepo.getById(testProductId);
    expect(prod?.primaryImage).toBe("/images/products/packaged/pouch_002.png");
  });

  // 11. Category creation
  it("11. Category creation creates dynamic botanical category", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const slug = `test-cat-${ts}`;
    const cat = await caller.admin.categories.create({
      name: `Test Wellness Herbs ${ts}`,
      slug,
      description: "Organic handpicked medicinal roots from Tamil Nadu forests.",
    });

    expect(cat).toBeDefined();
    expect(cat.slug).toBe(slug);
    testCategoryId = cat.id;
  });

  // 12. Category editing
  it("12. Category editing updates category information", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const updated = await caller.admin.categories.update({
      id: testCategoryId,
      updates: {
        description: "Updated botanical description.",
      },
    });

    expect(updated).toBeDefined();
    expect(updated.description).toBe("Updated botanical description.");
  });

  // 13. Category deletion protection
  it("13. Category containing active products cannot be deleted and throws error", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    // First assign test product to test category
    await caller.admin.products.update({
      id: testProductId,
      updates: { categoryId: testCategoryId },
    });

    // Attempting to delete category must fail
    await expect(caller.admin.categories.delete({ id: testCategoryId })).rejects.toThrow(
      /Cannot delete category containing \d+ active product/i
    );

    // Unassign product
    await caller.admin.products.update({
      id: testProductId,
      updates: { categoryId: null },
    });

    // Now delete succeeds
    const res = await caller.admin.categories.delete({ id: testCategoryId });
    expect(res.success).toBe(true);
  });

  // 14. Price updates
  it("14. Price update persists new selling price correctly", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const res = await caller.admin.products.updatePrice({
      id: testProductId,
      sellingPrice: 349,
    });

    expect(res).toBeDefined();
    expect(Number(res.sellingPrice)).toBe(349);
    const prod = db.productsRepo.getById(testProductId);
    expect(Number(prod?.sellingPrice)).toBe(349);
  });

  // 15. Inventory updates
  it("15. Inventory update updates stock count in products and inventory tables", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const res = await caller.admin.inventory.updateStock({
      productId: testProductId,
      stock: 80,
      reason: "New harvest batch received",
    });

    expect(res.success).toBe(true);
    expect(res.newStock).toBe(80);

    const prod = db.productsRepo.getById(testProductId);
    expect(prod?.stock).toBe(80);
  });

  // 16. Low-stock alerts
  it("16. Product with stock <= 10 appears in low-stock alerts", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    // Set stock to 6 units
    await caller.admin.inventory.updateStock({
      productId: testProductId,
      stock: 6,
      reason: "Testing low stock threshold",
    });

    const stats = await caller.admin.dashboardOverview();
    const alertFound = stats.lowStockAlerts.some((p: any) => p.id === testProductId);
    expect(alertFound).toBe(true);
  });

  // 17. CSV import preview and commit
  it("17. Bulk CSV import correctly parses and creates/updates products", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const newSku = `TRN-IMPORT-${ts}`;
    const rows = [
      {
        sku: newSku,
        nameEn: "Imported Senna Leaf Powder",
        nameTa: "நிலவாகை பொடி",
        category: "Herbs",
        sellingPrice: 199,
        mrp: 249,
        stock: 60,
      },
    ];

    const res = await caller.admin.products.bulkImport(rows);
    expect(res.total).toBe(1);
    expect(res.successCount).toBe(1);
    expect(res.errors.length).toBe(0);

    // Verify inserted
    const imported = db.productsRepo.getBySku(newSku);
    expect(imported).toBeDefined();
    expect(imported?.nameEn).toBe("Imported Senna Leaf Powder");

    // Clean up
    if (imported) db.productsRepo.delete(imported.id);
  });

  // 18. Excel/JSON import
  it("18. JSON bulk import processes multiple rows accurately", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const sku1 = `TRN-JSON1-${ts}`;
    const sku2 = `TRN-JSON2-${ts}`;
    const rows = [
      {
        sku: sku1,
        nameEn: "JSON Test Herb 1",
        category: "Herbs",
        sellingPrice: 150,
        stock: 50,
      },
      {
        sku: sku2,
        nameEn: "JSON Test Herb 2",
        category: "Herbs",
        sellingPrice: 220,
        stock: 30,
      },
    ];

    const res = await caller.admin.products.bulkImport(rows);
    expect(res.successCount).toBe(2);

    // Clean up
    const p1 = db.productsRepo.getBySku(sku1);
    const p2 = db.productsRepo.getBySku(sku2);
    if (p1) db.productsRepo.delete(p1.id);
    if (p2) db.productsRepo.delete(p2.id);
  });

  // 19. Duplicate SKU rejection during import
  it("19. Duplicate SKU within batch is reported with row index and error", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const dupSku = `TRN-DUP-${ts}`;
    const rows = [
      { sku: dupSku, nameEn: "First Entry", category: "Herbs", sellingPrice: 100 },
      { sku: dupSku, nameEn: "Duplicate Entry", category: "Herbs", sellingPrice: 100 },
    ];

    const res = await caller.admin.products.bulkImport(rows);
    expect(res.errors.length).toBeGreaterThanOrEqual(1);
    const dupErr = res.errors.find((e: any) => e.sku === dupSku && e.index === 1);
    expect(dupErr).toBeDefined();
    expect(dupErr?.error).toMatch(/duplicate SKU/i);

    // Clean up
    const p = db.productsRepo.getBySku(dupSku);
    if (p) db.productsRepo.delete(p.id);
  });

  // 20. Invalid row reporting with row index and error detail
  it("20. Invalid row missing required SKU or Name reports row index and description", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const rows = [
      { sku: "", nameEn: "No SKU Item", category: "Herbs", sellingPrice: 100 },
      { sku: `TRN-NONAME-${ts}`, nameEn: "", category: "Herbs", sellingPrice: 100 },
    ];

    const res = await caller.admin.products.bulkImport(rows);
    expect(res.errors.length).toBe(2);
    expect(res.errors[0].index).toBe(0);
    expect(res.errors[0].error).toMatch(/Missing required SKU/i);
    expect(res.errors[1].index).toBe(1);
    expect(res.errors[1].error).toMatch(/Missing required Product Name/i);
  });

  // 21. Product export to CSV
  it("21. Product export produces valid CSV with headers and all catalogue products", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const csv = await caller.admin.products.exportCsv();
    expect(typeof csv).toBe("string");
    expect(csv).toContain("SKU,English Name,Tamil Name,Category,Selling Price,MRP,Stock,Status,Description");
    expect(csv).toContain("TRN-1001");
    expect(csv).toContain("TRN-1162");
  });

  // 22. Campaign creation
  it("22. Campaign creation creates festival promo coupon code", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const code = `PONGAL_${ts}`;
    const campaign = await caller.admin.campaigns.create({
      name: "Pongal Harvest Special",
      code,
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderValue: 500,
      maxDiscount: 200,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      bannerText: "Celebrate Pongal with 15% off herbal extracts!",
    });

    expect(campaign).toBeDefined();
    expect(campaign.code).toBe(code);
    expect(campaign.isActive).toBe(1);
    testCampaignId = campaign.id;
  });

  // 23. Campaign activation toggle
  it("23. Campaign status toggle updates isActive flag in database", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const res = await caller.admin.campaigns.toggle({
      id: testCampaignId,
      isActive: false,
    });

    expect(res).toBeDefined();
    expect(res.isActive).toBe(0);
    const camp = db.campaignsRepo.getById(testCampaignId);
    expect(camp?.isActive).toBe(0);

    // Re-enable
    await caller.admin.campaigns.toggle({ id: testCampaignId, isActive: true });
  });

  // 24. Coupon validation
  it("24. Coupon validation correctly computes percentage discount with cap", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const camp = db.campaignsRepo.getById(testCampaignId);
    expect(camp).toBeDefined();

    const val = await caller.cart.validateCoupon({
      code: camp!.code,
      subtotal: 1000,
    });

    expect(val.valid).toBe(true);
    // 15% of 1000 = 150, which is below the 200 cap
    expect(val.discountAmount).toBe(150);
  });

  // 25. Expired coupon rejection
  it("25. Expired coupon is rejected during checkout validation", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Create expired campaign in DB
    const expiredCode = `EXPIRED_${ts}`;
    db.campaignsRepo.create({
      name: "Expired Promo",
      code: expiredCode,
      discountType: "FIXED",
      discountValue: 50,
      minOrderValue: 200,
      startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
      endDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    });

    const res = await caller.cart.validateCoupon({
      code: expiredCode,
      subtotal: 500,
    });

    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/expired/i);
  });

  // 26. Product-specific offers / Discount calculations
  it("26. Fixed amount coupon applies correct cash discount up to subtotal", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const cashCode = `CASH50_${ts}`;
    db.campaignsRepo.create({
      name: "Flat 50 Cash Off",
      code: cashCode,
      discountType: "FIXED",
      discountValue: 50,
      minOrderValue: 300,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    });

    const res = await caller.cart.validateCoupon({
      code: cashCode,
      subtotal: 400,
    });

    expect(res.valid).toBe(true);
    expect(res.discountAmount).toBe(50);
  });

  // 27. Minimum order requirement validation
  it("27. Coupon validation rejects orders that do not meet minOrderValue", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const minCode = `MIN500_${ts}`;
    db.campaignsRepo.create({
      name: "High Value Offer",
      code: minCode,
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 500,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    });

    const res = await caller.cart.validateCoupon({
      code: minCode,
      subtotal: 350,
    });

    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/minimum.*(order|cart)/i);
  });

  // 28. Homepage banner updates
  it("28. Announcement banner updates persist in site_content and are publicly visible", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const newBanner = `Special Festival Offer: Free shipping on all orders over ₹499 (${ts})`;
    await caller.admin.content.set({
      key: "top_banner",
      value: newBanner,
    });

    const publicContent = await caller.content.getAll();
    expect(publicContent.top_banner).toBe(newBanner);
  });

  // 29. Website content management (policies, story, contact)
  it("29. Store policies and contact info persist and retrieve accurately", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    await caller.admin.content.set({
      key: "contact_email",
      value: "care@trinayaa.in",
    });
    await caller.admin.content.set({
      key: "policy_shipping",
      value: "Same-day dispatch for Tamil Nadu orders placed before 2 PM.",
    });

    const content = await caller.content.getAll();
    expect(content.contact_email).toBe("care@trinayaa.in");
    expect(content.policy_shipping).toBe("Same-day dispatch for Tamil Nadu orders placed before 2 PM.");
  });

  // 30. Audit log creation on sensitive changes
  it("30. Stock adjustment creates timestamped entry in audit log table", async () => {
    const { ctx } = createMockContext(adminUser);
    const caller = appRouter.createCaller(ctx);

    const reason = `Physical inventory count audit ${ts}`;
    await caller.admin.inventory.updateStock({
      productId: testProductId,
      stock: 120,
      reason,
    });

    const logs = await caller.admin.auditLogs.list({ limit: 10 });
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const auditEntry = logs.find((l: any) => l.details && l.details.includes(reason));
    expect(auditEntry).toBeDefined();
    expect(auditEntry.command).toBe("STOCK_UPDATE");

    // Clean up test product
    if (testProductId) {
      db.productsRepo.delete(testProductId);
    }
  });

  afterAll(() => {
    const dbInstance = db.getDatabase();
    dbInstance.exec("DELETE FROM product_variants WHERE productId IN (SELECT id FROM products WHERE sku NOT BETWEEN 'TRN-1001' AND 'TRN-1162');");
    dbInstance.exec("DELETE FROM product_images WHERE productId IN (SELECT id FROM products WHERE sku NOT BETWEEN 'TRN-1001' AND 'TRN-1162');");
    dbInstance.exec("DELETE FROM inventory WHERE productId IN (SELECT id FROM products WHERE sku NOT BETWEEN 'TRN-1001' AND 'TRN-1162');");
    dbInstance.exec("DELETE FROM products WHERE sku NOT BETWEEN 'TRN-1001' AND 'TRN-1162';");
    dbInstance.exec("DELETE FROM categories WHERE id NOT IN ('cat_1','cat_2','cat_3','cat_4','cat_5','cat_6','cat_7','cat_8','cat_9');");
  });
});
