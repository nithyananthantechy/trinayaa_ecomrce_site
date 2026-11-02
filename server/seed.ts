import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export interface SeedResult {
  success: boolean;
  totalProducts: number;
  totalCategories: number;
  skuRange: { min: string; max: string };
  verifiedImagesCount: number;
  missingImagesCount: number;
  invalidCatalogueRecords: number;
  foreignKeyErrors: any[];
  databaseBackupPath: string;
}

export function runSeed(dbPath?: string): SeedResult {
  const finalDbPath = dbPath || path.resolve(process.cwd(), "data", "trinayaa.db");
  const dataDir = path.dirname(finalDbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Create timestamped backup of the database
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.resolve(dataDir, `trinayaa_backup_${ts}.db`);
  if (fs.existsSync(finalDbPath)) {
    fs.copyFileSync(finalDbPath, backupPath);
  }

  const db = new DatabaseSync(finalDbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  // 2. Ensure all 18 tables and performance indexes exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      telegramId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      recipientName TEXT NOT NULL,
      phone TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pinCode TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      isVisible INTEGER NOT NULL DEFAULT 1,
      displayOrder INTEGER NOT NULL DEFAULT 0,
      parentId TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      nameEn TEXT NOT NULL,
      nameTa TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      shortDesc TEXT,
      fullDesc TEXT,
      categoryId TEXT,
      productType TEXT NOT NULL DEFAULT 'Whole ingredient',
      primaryImage TEXT,
      gallery TEXT DEFAULT '[]',
      sellingPrice REAL NOT NULL,
      mrp REAL NOT NULL,
      discountPrice REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 100,
      stockAvailability TEXT NOT NULL DEFAULT 'In Stock',
      status TEXT NOT NULL DEFAULT 'Published',
      featured INTEGER NOT NULL DEFAULT 0,
      seoTitle TEXT,
      seoDescription TEXT,
      seoKeywords TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      packSize TEXT NOT NULL,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 100,
      sku TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      url TEXT NOT NULL,
      altText TEXT,
      isPrimary INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      variantId TEXT,
      sku TEXT NOT NULL,
      stockQuantity INTEGER NOT NULL DEFAULT 100,
      lowStockThreshold INTEGER NOT NULL DEFAULT 10,
      reorderQuantity INTEGER NOT NULL DEFAULT 50,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      userId TEXT,
      guestToken TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cartId TEXT NOT NULL,
      productId TEXT NOT NULL,
      packSize TEXT NOT NULL,
      unitPrice REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (cartId) REFERENCES carts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT UNIQUE NOT NULL,
      customerId TEXT,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      shippingAddress TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discountAmount REAL NOT NULL DEFAULT 0,
      shippingFee REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      paymentMethod TEXT NOT NULL DEFAULT 'RAZORPAY',
      paymentStatus TEXT NOT NULL DEFAULT 'PENDING',
      razorpayOrderId TEXT,
      razorpayPaymentId TEXT,
      orderStatus TEXT NOT NULL DEFAULT 'Pending Payment',
      internalNotes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT,
      productNameEn TEXT NOT NULL,
      productNameTa TEXT NOT NULL,
      packSize TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      image TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      updatedBy TEXT NOT NULL DEFAULT 'System',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      paymentGateway TEXT NOT NULL DEFAULT 'RAZORPAY',
      gatewayOrderId TEXT NOT NULL,
      gatewayPaymentId TEXT,
      gatewaySignature TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'PENDING',
      rawResponse TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      discountType TEXT NOT NULL DEFAULT 'PERCENTAGE',
      discountValue REAL NOT NULL,
      minOrderValue REAL NOT NULL DEFAULT 0,
      maxDiscount REAL NOT NULL DEFAULT 1000,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      bannerText TEXT,
      bannerImage TEXT,
      eligibleCategories TEXT DEFAULT '[]',
      eligibleProducts TEXT DEFAULT '[]',
      usageLimit INTEGER NOT NULL DEFAULT 1000,
      usageCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      campaignId TEXT,
      discountType TEXT NOT NULL DEFAULT 'PERCENTAGE',
      discountValue REAL NOT NULL,
      minOrderValue REAL NOT NULL DEFAULT 0,
      maxDiscount REAL NOT NULL DEFAULT 1000,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      usageLimit INTEGER NOT NULL DEFAULT 1000,
      usageCount INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (campaignId) REFERENCES campaigns(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_allowed_admins (
      id TEXT PRIMARY KEY,
      telegramId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
      addedBy TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_audit_logs (
      id TEXT PRIMARY KEY,
      telegramUserId TEXT NOT NULL,
      command TEXT NOT NULL,
      details TEXT,
      createdAt TEXT NOT NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoryId);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(productId);
    CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(productId);
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(productId);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
    CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders(orderNumber);
    CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON order_items(orderId);
    CREATE INDEX IF NOT EXISTS idx_order_history_orderId ON order_status_history(orderId);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cartId ON cart_items(cartId);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
  `);

  // 3. Seed Categories (All 9 approved categories)
  const categoriesList = [
    { id: "cat_1", name: "Health Care", slug: "health-care", description: "Traditional herbs and formulations for overall vitality and wellness.", displayOrder: 0 },
    { id: "cat_2", name: "Hair Care", slug: "hair-care", description: "Time-tested herbal botanicals for hair nourishment, growth, and strength.", displayOrder: 1 },
    { id: "cat_3", name: "Skin Care", slug: "skin-care", description: "Natural botanicals for radiant, nourished skin without chemicals.", displayOrder: 2 },
    { id: "cat_4", name: "Natural Seeds", slug: "natural-seeds", description: "Aromatic, pure unadulterated botanical seeds.", displayOrder: 3 },
    { id: "cat_5", name: "Raw Powders", slug: "raw-powders", description: "Stone-ground pure herbal powders from sun-dried botanicals.", displayOrder: 4 },
    { id: "cat_6", name: "Herbs", slug: "herbs", description: "Whole botanicals and roots harvested directly from nature.", displayOrder: 5 },
    { id: "cat_7", name: "Welness Drinks", slug: "welness-drinks", description: "Rejuvenating herbal teas and restorative botanical infusions.", displayOrder: 6 },
    { id: "cat_8", name: "Spices & Culinary", slug: "spices-culinary", description: "Aromatic kitchen essentials, pure spices, and culinary herbs.", displayOrder: 7 },
    { id: "cat_9", name: "Aromatherapy & Incense", slug: "aromatherapy-incense", description: "Natural resins, aromatic woods, and therapeutic botanical scents.", displayOrder: 8 },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description, isVisible, displayOrder)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description,
      displayOrder = excluded.displayOrder
  `);

  for (const cat of categoriesList) {
    insertCategory.run(cat.id, cat.name, cat.slug, cat.description, cat.displayOrder);
  }

  // Map category names to IDs
  const categoryMap: Record<string, string> = {
    "Health Care": "cat_1",
    "Hair Care": "cat_2",
    "Skin Care": "cat_3",
    "Natural Seeds": "cat_4",
    "Raw Powders": "cat_5",
    "Herbs": "cat_6",
    "Welness Drinks": "cat_7",
    "Spices & Culinary": "cat_8",
    "Aromatherapy & Incense": "cat_9",
    "Aromatherapy&Incense": "cat_9",
    "Herbal Powders List": "cat_5",
  };

  // 4. Load Catalogue Products from parsed_products.json
  const parsedFile = path.resolve(process.cwd(), "data", "parsed_products.json");
  if (!fs.existsSync(parsedFile)) {
    throw new Error(`Catalogue file not found: ${parsedFile}`);
  }
  const parsedData = JSON.parse(fs.readFileSync(parsedFile, "utf8"));
  const products: any[] = parsedData.products || [];

  // Remove transient test products outside the standard TRN-1001..TRN-1162 catalogue
  db.exec(`
    DELETE FROM inventory WHERE sku NOT LIKE 'TRN-1%';
    DELETE FROM product_variants WHERE sku NOT LIKE 'TRN-1%';
    DELETE FROM product_images WHERE productId IN (SELECT id FROM products WHERE sku NOT LIKE 'TRN-1%');
    DELETE FROM products WHERE sku NOT LIKE 'TRN-1%';
  `);

  const now = new Date().toISOString();
  let invalidCatalogueRecords = 0;

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, sku, nameEn, nameTa, slug, shortDesc, fullDesc, categoryId,
      productType, primaryImage, gallery, sellingPrice, mrp, discountPrice,
      stock, stockAvailability, status, featured, seoTitle, seoDescription, seoKeywords,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?
    )
    ON CONFLICT(sku) DO UPDATE SET
      nameEn = excluded.nameEn,
      nameTa = excluded.nameTa,
      slug = excluded.slug,
      shortDesc = excluded.shortDesc,
      fullDesc = excluded.fullDesc,
      categoryId = excluded.categoryId,
      productType = excluded.productType,
      primaryImage = excluded.primaryImage,
      gallery = excluded.gallery,
      sellingPrice = excluded.sellingPrice,
      mrp = excluded.mrp,
      discountPrice = excluded.discountPrice,
      stock = excluded.stock,
      status = excluded.status,
      updatedAt = excluded.updatedAt
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (id, productId, packSize, price, mrp, stock, sku)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      price = excluded.price,
      mrp = excluded.mrp,
      stock = excluded.stock
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (id, productId, url, altText, isPrimary, sortOrder, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      url = excluded.url,
      altText = excluded.altText,
      isPrimary = excluded.isPrimary
  `);

  const insertInventory = db.prepare(`
    INSERT INTO inventory (id, productId, variantId, sku, stockQuantity, lowStockThreshold, reorderQuantity, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      stockQuantity = excluded.stockQuantity,
      updatedAt = excluded.updatedAt
  `);

  for (const item of products) {
    if (!item.sku || !item.nameEn || !item.nameTa || item.sellingPrice == null || item.mrp == null) {
      invalidCatalogueRecords++;
      console.error(`Invalid catalogue record skipped: ${item.sku || "unknown"}`);
      continue;
    }

    const catId = categoryMap[item.category] || "cat_1";
    const existing = db.prepare("SELECT id FROM products WHERE sku = ?").get(item.sku) as any;
    const productId = existing ? existing.id : `prod_${item.sku.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const primaryImg = item.primaryImage || "/images/products/packaged/pouch_001.png";
    const galleryJson = JSON.stringify(item.gallery || [primaryImg]);

    insertProduct.run(
      productId,
      item.sku,
      item.nameEn,
      item.nameTa,
      item.slug,
      item.shortDesc || `${item.nameEn} (${item.nameTa}) by TRINAYAA.`,
      item.fullDesc || `TRINAYAA unadulterated ${item.nameEn} (${item.nameTa}).`,
      catId,
      item.productType || "Whole ingredient",
      primaryImg,
      galleryJson,
      Number(item.sellingPrice),
      Number(item.mrp),
      Number(item.discountPrice || item.sellingPrice),
      Number(item.stock || 100),
      "In Stock",
      item.status || "Published",
      item.featured ? 1 : 0,
      `${item.nameEn} - Pure Botanical | TRINAYAA`,
      `Buy authentic ${item.nameEn} (${item.nameTa}) directly from TRINAYAA.`,
      `${item.nameEn}, ${item.nameTa}, TRINAYAA botanicals`,
      now,
      now
    );

    // Seed variant for authentic pack size (e.g. 100g)
    const existingVar = db.prepare("SELECT id FROM product_variants WHERE productId = ? AND packSize = ?").get(productId, item.quantity || "100g") as any;
    const variantId = existingVar ? existingVar.id : `var_${productId}_100g`;
    insertVariant.run(
      variantId,
      productId,
      item.quantity || "100g",
      Number(item.sellingPrice),
      Number(item.mrp),
      Number(item.stock || 100),
      item.sku
    );

    // Seed product_images
    const existingImg = db.prepare("SELECT id FROM product_images WHERE productId = ? AND isPrimary = 1").get(productId) as any;
    const imageId = existingImg ? existingImg.id : `img_${productId}_primary`;
    insertImage.run(
      imageId,
      productId,
      primaryImg,
      `${item.nameEn} (${item.nameTa}) TRINAYAA botanical packaging`,
      1,
      0,
      now
    );

    // Seed inventory
    const existingInv = db.prepare("SELECT id FROM inventory WHERE productId = ?").get(productId) as any;
    const inventoryId = existingInv ? existingInv.id : `inv_${productId}`;
    insertInventory.run(
      inventoryId,
      productId,
      variantId,
      item.sku,
      Number(item.stock || 100),
      10,
      50,
      now
    );
  }

  // 5. Seed Campaigns and Coupons
  const existingCamp = db.prepare("SELECT id FROM campaigns WHERE code = ?").get("FESTIVE15") as any;
  const campaignId = existingCamp ? existingCamp.id : "camp_festive_15";

  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (
      id, name, code, discountType, discountValue, minOrderValue, maxDiscount,
      startDate, endDate, isActive, bannerText, usageLimit, usageCount, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      discountValue = excluded.discountValue,
      minOrderValue = excluded.minOrderValue,
      maxDiscount = excluded.maxDiscount,
      isActive = excluded.isActive
  `);

  insertCampaign.run(
    campaignId,
    "Festive Harvest 2026",
    "FESTIVE15",
    "PERCENTAGE",
    15,
    499,
    500,
    "2026-01-01T00:00:00.000Z",
    "2026-12-31T23:59:59.000Z",
    1,
    "🌿 Festive Offer: 15% OFF on orders above ₹499! Use code FESTIVE15",
    1000,
    0,
    now
  );

  const insertCoupon = db.prepare(`
    INSERT INTO coupons (
      id, code, campaignId, discountType, discountValue, minOrderValue,
      maxDiscount, startDate, endDate, usageLimit, usageCount, isActive, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      campaignId = excluded.campaignId,
      discountValue = excluded.discountValue,
      minOrderValue = excluded.minOrderValue,
      maxDiscount = excluded.maxDiscount,
      isActive = excluded.isActive
  `);

  const existingCoupon = db.prepare("SELECT id FROM coupons WHERE code = ?").get("FESTIVE15") as any;
  const couponId = existingCoupon ? existingCoupon.id : "cpn_festive_15";

  insertCoupon.run(
    couponId,
    "FESTIVE15",
    campaignId,
    "PERCENTAGE",
    15,
    499,
    500,
    "2026-01-01T00:00:00.000Z",
    "2026-12-31T23:59:59.000Z",
    1000,
    0,
    1,
    now
  );

  // 6. Verification Queries
  const productCount = (db.prepare("SELECT COUNT(*) as count FROM products").get() as any).count;
  const categoryCount = (db.prepare("SELECT COUNT(*) as count FROM categories").get() as any).count;
  const minSku = (db.prepare("SELECT MIN(sku) as minSku FROM products").get() as any).minSku;
  const maxSku = (db.prepare("SELECT MAX(sku) as maxSku FROM products").get() as any).maxSku;
  const fkErrors = db.prepare("PRAGMA foreign_key_check").all();

  // Validate image file existence on disk
  const allImages = db.prepare("SELECT url FROM product_images").all() as any[];
  let verifiedImagesCount = 0;
  let missingImagesCount = 0;
  for (const img of allImages) {
    const filePath = path.resolve(process.cwd(), "client", "public", img.url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      verifiedImagesCount++;
    } else {
      missingImagesCount++;
    }
  }

  return {
    success: productCount === 162 && categoryCount === 9 && missingImagesCount === 0 && fkErrors.length === 0,
    totalProducts: productCount,
    totalCategories: categoryCount,
    skuRange: { min: minSku, max: maxSku },
    verifiedImagesCount,
    missingImagesCount,
    invalidCatalogueRecords,
    foreignKeyErrors: fkErrors,
    databaseBackupPath: backupPath,
  };
}

// If executed directly via CLI
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  console.log("=== EXECUTING TRINAYAA REPEATABLE SEED ROUTINE ===");
  const result = runSeed();
  console.log("Seed Result:", JSON.stringify(result, null, 2));
  if (!result.success) {
    console.error("Seed verification failed!");
    process.exit(1);
  } else {
    console.log("Seed verification PASSED!");
  }
}

