// Safe loader for Node.js built-in SQLite that prevents Vite bundling conflicts
const sqliteModule: any = (process as any).getBuiltinModule ? (process as any).getBuiltinModule("node:sqlite") : eval("require")("node:sqlite");
const DatabaseSync = sqliteModule.DatabaseSync;
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { notificationsService, type OrderNotificationEvent } from "./notifications.ts";
import { generateWhatsAppLink, isValidSocialUrl } from "./sanitize";

// Path to SQLite database
const DB_PATH = process.env.DATABASE_URL?.replace(/^sqlite:/, "") || process.env.DATABASE_PATH || path.resolve(process.cwd(), "data", "trinayaa.db");

// Ensure data folder exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

type DatabaseSync = any;

let _dbInstance: any = null;

export function getDatabase(): any {
  if (!_dbInstance) {
    _dbInstance = new DatabaseSync(DB_PATH);
    try {
      _dbInstance.exec("PRAGMA journal_mode = WAL;");
      _dbInstance.exec("PRAGMA busy_timeout = 10000;");
      _dbInstance.exec("PRAGMA foreign_keys = ON;");
    } catch {}
    initTables(_dbInstance);
  }
  return _dbInstance;
}

// Create tables if they do not already exist
function initTables(db: any) {
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

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
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

    CREATE TABLE IF NOT EXISTS business_enquiries (
      id TEXT PRIMARY KEY,
      enquiryNumber TEXT UNIQUE NOT NULL,
      contactName TEXT NOT NULL,
      companyName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      buyerType TEXT NOT NULL,
      deliveryCity TEXT NOT NULL,
      deliveryState TEXT NOT NULL,
      requirements TEXT,
      gstNumber TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      assignedTo TEXT,
      internalNotes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS business_enquiry_items (
      id TEXT PRIMARY KEY,
      enquiryId TEXT NOT NULL,
      productId TEXT,
      sku TEXT NOT NULL,
      productName TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      targetPrice REAL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (enquiryId) REFERENCES business_enquiries(id) ON DELETE CASCADE
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
    CREATE INDEX IF NOT EXISTS idx_enquiries_number ON business_enquiries(enquiryNumber);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON business_enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_enquiry_items_enquiryId ON business_enquiry_items(enquiryId);
  `);

  // Safe schema migrations for existing database tables
  const safeAlter = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      // Column or index already exists
    }
  };

  safeAlter("ALTER TABLE customer_addresses ADD COLUMN addressLine1 TEXT;");
  safeAlter("ALTER TABLE customer_addresses ADD COLUMN addressLine2 TEXT;");
  safeAlter("ALTER TABLE customer_addresses ADD COLUMN landmark TEXT;");
  safeAlter("ALTER TABLE customer_addresses ADD COLUMN district TEXT;");
  safeAlter("ALTER TABLE customer_addresses ADD COLUMN addressType TEXT DEFAULT 'Home';");
  safeAlter("ALTER TABLE customer_addresses ADD COLUMN deliveryInstructions TEXT;");

  safeAlter("ALTER TABLE orders ADD COLUMN couponCode TEXT;");
  safeAlter("ALTER TABLE orders ADD COLUMN trackingNumber TEXT;");
  safeAlter("ALTER TABLE orders ADD COLUMN carrier TEXT;");

  safeAlter("ALTER TABLE payments ADD COLUMN eventId TEXT;");
  safeAlter("ALTER TABLE payments ADD COLUMN errorDescription TEXT;");

  // Ensure default admin user exists if table is empty
  const adminCheck = db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN')").get() as { count: number };
  if (!adminCheck || adminCheck.count === 0) {
    const adminId = "usr_admin_" + Date.now();
    const hash = hashPassword("Admin@Trinayaa2026!");
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'ADMIN', 'ACTIVE', ?, ?)
    `).run(adminId, "admin@trinayaa.in", hash, "TRINAYAA Admin", "+919876543210", now, now);
  }

  // Ensure default campaign exists
  const campaignCheck = db.prepare("SELECT COUNT(*) as count FROM campaigns").get() as { count: number };
  if (!campaignCheck || campaignCheck.count === 0) {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO campaigns (id, name, code, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, isActive, bannerText, usageLimit, usageCount, createdAt)
      VALUES (?, ?, ?, 'PERCENTAGE', 10, 500, 300, ?, ?, 1, 'Get 10% OFF on all pure botanicals above ₹500 with code PURE10', 5000, 0, ?)
    `).run("camp_welcome10", "Pure Botanical Welcome", "PURE10", now, future, now);
  }

  // Ensure site content defaults
  const bannerCheck = db.prepare("SELECT value FROM site_content WHERE key = 'top_banner'").get() as { value: string } | undefined;
  if (!bannerCheck) {
    const now = new Date().toISOString();
    db.prepare("INSERT OR REPLACE INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)")
      .run("top_banner", "Pan India Delivery · Handcrafted Botanical Wellness · Pure Herbs, Natural Seeds & Raw Powders", now);
  }
}

// ==========================================
// PASSWORD SECURITY UTILITIES (PBKDF2)
// ==========================================
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

// Compatibility helper for Manus legacy upsertUser
export async function getDb() {
  return getDatabase();
}

export async function upsertUser(user: { id?: string; email?: string; name?: string; role?: string; openId?: string }) {
  const db = getDatabase();
  const id = user.id || "usr_" + crypto.randomUUID();
  const email = user.email || `${user.openId || id}@trinayaa.local`;
  const name = user.name || "Customer";
  const role = user.role || "CUSTOMER";
  const now = new Date().toISOString();

  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (existing) {
    db.prepare("UPDATE users SET name = ?, role = ?, updatedAt = ? WHERE id = ?")
      .run(name, role, now, existing.id);
    return existing;
  } else {
    const dummyHash = hashPassword(crypto.randomBytes(24).toString("hex"));
    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, '', ?, 'ACTIVE', ?, ?)
    `).run(id, email, dummyHash, name, role, now, now);
    return { id, email, name, role };
  }
}

export async function getUserByOpenId(openId: string) {
  const db = getDatabase();
  return db.prepare("SELECT * FROM users WHERE email = ? OR id = ?").get(openId, openId);
}

// ==========================================
// 1. PRODUCTS REPOSITORY
// ==========================================
export const productsRepo = {
  getAll(options: { category?: string; search?: string; sort?: string; limit?: number; offset?: number; status?: string } = {}) {
    const db = getDatabase();
    let query = "SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE 1=1";
    const params: any[] = [];

    if (options.status) {
      query += " AND p.status = ?";
      params.push(options.status);
    } else {
      query += " AND p.status = 'Published'";
    }

    if (options.category && options.category !== "All") {
      const cat = options.category.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cat.includes("seed")) {
        query += " AND (p.productType = 'Seed' OR c.slug = 'natural-seeds' OR c.name LIKE '%Seed%')";
      } else if (cat.includes("powder")) {
        query += " AND (p.productType = 'Powder' OR c.slug = 'raw-powders' OR c.name LIKE '%Powder%')";
      } else if (cat.includes("herb")) {
        query += " AND (p.productType IN ('Herb', 'Whole ingredient') OR c.slug = 'herbs' OR c.name LIKE '%Herb%')";
      } else {
        query += " AND (c.name = ? OR c.slug = ? OR p.categoryId = ? OR c.name LIKE ?)";
        params.push(options.category, options.category, options.category, `%${options.category}%`);
      }
    }

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      query += " AND (p.nameEn LIKE ? OR p.nameTa LIKE ? OR p.sku LIKE ? OR c.name LIKE ? OR p.shortDesc LIKE ?)";
      params.push(term, term, term, term, term);
    }

    if (options.sort === "price-low" || options.sort === "price_asc" || options.sort === "price-asc") {
      query += " ORDER BY p.sellingPrice ASC";
    } else if (options.sort === "price-high" || options.sort === "price_desc" || options.sort === "price-desc") {
      query += " ORDER BY p.sellingPrice DESC";
    } else if (options.sort === "name" || options.sort === "name_asc" || options.sort === "name-asc") {
      query += " ORDER BY p.nameEn ASC";
    } else if (options.sort === "name_desc" || options.sort === "name-desc") {
      query += " ORDER BY p.nameEn DESC";
    } else {
      query += " ORDER BY p.featured DESC, p.createdAt DESC";
    }

    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
      if (options.offset) {
        query += " OFFSET ?";
        params.push(options.offset);
      }
    }

    const items = db.prepare(query).all(...params) as any[];
    return items.map(formatProduct);
  },

  getById(id: string) {
    const db = getDatabase();
    const item = db.prepare("SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.id = ?").get(id) as any;
    return item ? formatProduct(item) : null;
  },

  getBySlug(slug: string) {
    const db = getDatabase();
    const item = db.prepare("SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.slug = ?").get(slug) as any;
    return item ? formatProduct(item) : null;
  },

  getBySku(sku: string) {
    const db = getDatabase();
    const item = db.prepare("SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.sku = ?").get(sku) as any;
    return item ? formatProduct(item) : null;
  },

  getRelated(categoryId?: string, excludeId?: string, limit = 4) {
    const db = getDatabase();
    let query = "SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.categoryId = c.id WHERE p.status = 'Published'";
    const params: any[] = [];
    if (categoryId) {
      query += " AND p.categoryId = ?";
      params.push(categoryId);
    }
    if (excludeId) {
      query += " AND p.id != ?";
      params.push(excludeId);
    }
    query += " ORDER BY p.featured DESC, RANDOM() LIMIT ?";
    params.push(limit);
    const items = db.prepare(query).all(...params) as any[];
    return items.map(formatProduct);
  },

  create(data: any) {
    const db = getDatabase();
    const id = data.id || "prod_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const slug = data.slug || (data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + data.sku.toLowerCase());

    db.prepare(`
      INSERT OR REPLACE INTO products (
        id, sku, nameEn, nameTa, slug, shortDesc, fullDesc, categoryId, productType,
        primaryImage, gallery, sellingPrice, mrp, discountPrice, stock, stockAvailability,
        status, featured, isCodAvailable, seoTitle, seoDescription, seoKeywords, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.sku,
      data.nameEn,
      data.nameTa || "",
      slug,
      data.shortDesc || "",
      data.fullDesc || "",
      data.categoryId || null,
      data.productType || "Whole ingredient",
      data.primaryImage || "/images/products/packaged/pouch_001.png",
      JSON.stringify(data.gallery || []),
      Number(data.sellingPrice || 0),
      Number(data.mrp || data.sellingPrice || 0),
      Number(data.discountPrice || data.sellingPrice || 0),
      Number(data.stock ?? 100),
      data.stockAvailability || "In Stock",
      data.status || "Published",
      data.featured ? 1 : 0,
      data.isCodAvailable !== undefined ? (data.isCodAvailable ? 1 : 0) : 1,
      data.seoTitle || "",
      data.seoDescription || "",
      data.seoKeywords || "",
      now,
      now
    );

    // If variants were provided, insert them
    if (data.variants && Array.isArray(data.variants)) {
      for (const v of data.variants) {
        db.prepare(`
          INSERT INTO product_variants (id, productId, packSize, price, mrp, stock, sku)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          "var_" + crypto.randomUUID(),
          id,
          v.packSize,
          v.price,
          v.mrp || v.price,
          v.stock ?? 100,
          v.sku || `${data.sku}-${v.packSize}`
        );
      }
    }

    return this.getById(id);
  },

  update(id: string, updates: any) {
    const db = getDatabase();
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];
    const now = new Date().toISOString();

    const allowed = [
      "sku", "nameEn", "nameTa", "slug", "shortDesc", "fullDesc", "categoryId",
      "productType", "primaryImage", "sellingPrice", "mrp", "discountPrice",
      "stock", "stockAvailability", "status", "featured", "isCodAvailable", "isRewardEligible", "seoTitle", "seoDescription", "seoKeywords"
    ];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === "featured" || key === "isCodAvailable" || key === "isRewardEligible") {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (updates.gallery !== undefined) {
      fields.push("gallery = ?");
      values.push(JSON.stringify(updates.gallery));
    }

    fields.push("updatedAt = ?");
    values.push(now);

    values.push(id);
    db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    // If variants were replaced
    if (updates.variants && Array.isArray(updates.variants)) {
      db.prepare("DELETE FROM product_variants WHERE productId = ?").run(id);
      for (const v of updates.variants) {
        db.prepare(`
          INSERT INTO product_variants (id, productId, packSize, price, mrp, stock, sku)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          "var_" + crypto.randomUUID(),
          id,
          v.packSize,
          v.price,
          v.mrp || v.price,
          v.stock ?? 100,
          v.sku || `${existing.sku}-${v.packSize}`
        );
      }
    }

    return this.getById(id);
  },

  archive(id: string) {
    const db = getDatabase();
    db.prepare("UPDATE products SET status = 'Archived', updatedAt = ? WHERE id = ?").run(new Date().toISOString(), id);
    return this.getById(id);
  },

  delete(id: string) {
    const db = getDatabase();
    const refCount = (db.prepare("SELECT COUNT(*) as c FROM order_items WHERE productId = ?").get(id) as any)?.c || 0;
    if (refCount > 0) {
      db.prepare("UPDATE products SET status = 'Archived', updatedAt = ? WHERE id = ?").run(new Date().toISOString(), id);
      return { success: true, archived: true };
    } else {
      db.prepare("DELETE FROM product_variants WHERE productId = ?").run(id);
      db.prepare("DELETE FROM product_images WHERE productId = ?").run(id);
      db.prepare("DELETE FROM inventory WHERE productId = ?").run(id);
      const res = db.prepare("DELETE FROM products WHERE id = ?").run(id);
      return { success: res.changes > 0, archived: false };
    }
  },

  exportCsv() {
    const db = getDatabase();
    const items = db.prepare(`
      SELECT p.sku, p.nameEn, p.nameTa, c.name as category, p.sellingPrice, p.mrp, p.stock, p.status, p.shortDesc
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.status != 'Archived'
      ORDER BY p.sku ASC
    `).all() as any[];
    const headers = ["SKU", "English Name", "Tamil Name", "Category", "Selling Price", "MRP", "Stock", "Status", "Description"];
    const rows = items.map(i => [
      `"${i.sku}"`,
      `"${(i.nameEn || "").replace(/"/g, '""')}"`,
      `"${(i.nameTa || "").replace(/"/g, '""')}"`,
      `"${(i.category || "").replace(/"/g, '""')}"`,
      i.sellingPrice,
      i.mrp,
      i.stock,
      `"${i.status}"`,
      `"${(i.shortDesc || "").replace(/"/g, '""')}"`
    ].join(","));
    return [headers.join(","), ...rows].join("\n");
  },

  updateStock(id: string, stock: number) {
    const db = getDatabase();
    const availability = stock > 0 ? "In Stock" : "Out of Stock";
    db.prepare("UPDATE products SET stock = ?, stockAvailability = ?, updatedAt = ? WHERE id = ?")
      .run(stock, availability, new Date().toISOString(), id);
    handleStockChangeAlert(id, stock).catch(() => {});
    return this.getById(id);
  },

  toggleCod(id: string, isCodAvailable?: boolean) {
    const db = getDatabase();
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
    if (!existing) return null;

    const newVal = isCodAvailable !== undefined
      ? (isCodAvailable ? 1 : 0)
      : (existing.isCodAvailable === 1 ? 0 : 1);

    db.prepare("UPDATE products SET isCodAvailable = ?, updatedAt = ? WHERE id = ?")
      .run(newVal, new Date().toISOString(), id);

    return this.getById(id);
  },

  updatePrice(id: string, sellingPrice: number, mrp?: number) {
    const db = getDatabase();
    const mrpVal = mrp !== undefined ? mrp : sellingPrice;
    db.prepare("UPDATE products SET sellingPrice = ?, discountPrice = ?, mrp = ?, updatedAt = ? WHERE id = ?")
      .run(sellingPrice, sellingPrice, mrpVal, new Date().toISOString(), id);
    return this.getById(id);
  }
};

// Deterministic Botanical & Category Placeholder Resolution
const VERIFIED_BOTANICAL_SKUS = new Set([
  // Batch 1 (Approved)
  "TRN-1001", "TRN-1002", "TRN-1003", "TRN-1004", "TRN-1005",
  "TRN-1006", "TRN-1007", "TRN-1008", "TRN-1009", "TRN-1010",
  // Batch 2 (Verified botanical photography)
  "TRN-1011", "TRN-1012", "TRN-1013", "TRN-1014", "TRN-1015",
  "TRN-1016", "TRN-1017", "TRN-1018", "TRN-1021", "TRN-1022",
  "TRN-1023", "TRN-1024", "TRN-1025", "TRN-1026", "TRN-1027",
  "TRN-1028"
]);

export function resolveProductImage(sku?: string, category?: string, productType?: string, currentImage?: string): string {
  if (currentImage && (currentImage.startsWith("http://") || currentImage.startsWith("https://") || currentImage.includes("/uploads/"))) {
    return currentImage;
  }
  const cleanSku = (sku || "").toUpperCase().trim();
  if (cleanSku && VERIFIED_BOTANICAL_SKUS.has(cleanSku)) {
    return `/images/products/generated/${cleanSku}.webp`;
  }
  if (currentImage && currentImage.includes("/images/products/generated/")) {
    return currentImage;
  }
  const normCat = (category || "").toLowerCase().trim();
  const normType = (productType || "").toLowerCase().trim();

  if (normType.includes("seed") || normCat.includes("seed")) {
    return "/images/products/placeholders/placeholder_seeds.webp";
  }
  if (normType.includes("powder") || normCat.includes("powder")) {
    return "/images/products/placeholders/placeholder_raw_powders.webp";
  }
  if (normCat.includes("hair")) {
    return "/images/products/placeholders/placeholder_hair_care.webp";
  }
  if (normCat.includes("skin")) {
    return "/images/products/placeholders/placeholder_skin_care.webp";
  }
  if (normCat.includes("drink") || normCat.includes("tea") || normCat.includes("welness")) {
    return "/images/products/placeholders/placeholder_wellness_drinks.webp";
  }
  if (normCat.includes("spice") || normCat.includes("culinary")) {
    return "/images/products/placeholders/placeholder_spices_culinary.webp";
  }
  if (normCat.includes("aroma") || normCat.includes("incense") || normCat.includes("resin")) {
    return "/images/products/placeholders/placeholder_aromatherapy_incense.webp";
  }
  if (normCat.includes("health")) {
    return "/images/products/placeholders/placeholder_health_care.webp";
  }
  if (normType.includes("herb") || normCat.includes("herb")) {
    return "/images/products/placeholders/placeholder_herbs.webp";
  }
  return "/images/products/placeholders/placeholder_botanical_generic.webp";
}

function formatProduct(p: any) {
  let gallery: string[] = [];
  try {
    gallery = JSON.parse(p.gallery || "[]");
  } catch {
    gallery = [];
  }

  // Get variants if any
  const db = getDatabase();
  const variants = db.prepare("SELECT * FROM product_variants WHERE productId = ?").all(p.id) as any[];

  // Form sizes array for frontend compatibility
  const sizes = variants.length > 0
    ? variants.map((v) => ({ label: v.packSize, price: v.price, mrp: v.mrp, stock: v.stock }))
    : [
        { label: "100 g", price: p.sellingPrice, mrp: p.mrp, stock: p.stock },
        { label: "250 g", price: Math.round(p.sellingPrice * 2.3), mrp: Math.round(p.mrp * 2.3), stock: p.stock },
        { label: "500 g", price: Math.round(p.sellingPrice * 4.2), mrp: Math.round(p.mrp * 4.2), stock: p.stock },
      ];

  const discountPercent = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;

  const botanicalCategory =
    p.productType === "Seed"
      ? "Seeds"
      : p.productType === "Powder"
      ? "Raw Powders"
      : "Herbs";

  const resolvedImg = resolveProductImage(p.sku, p.categoryName || botanicalCategory, p.productType, p.primaryImage);

  return {
    ...p,
    id: p.id,
    name: p.nameEn,
    nameTa: p.nameTa,
    category: p.categoryName || botanicalCategory,
    botanicalCategory,
    categoryName: p.categoryName || botanicalCategory,
    productType: p.productType || "Herb",
    price: p.sellingPrice,
    compareAt: p.mrp > p.sellingPrice ? p.mrp : undefined,
    discountPercent,
    image: resolvedImg,
    primaryImage: p.primaryImage,
    rawPrimaryImage: p.primaryImage,
    description: p.shortDesc || p.fullDesc || "",
    featured: Boolean(p.featured),
    isCodAvailable: p.isCodAvailable !== undefined ? (p.isCodAvailable === 1 || p.isCodAvailable === true || p.isCodAvailable === "1") : true,
    isRewardEligible: p.isRewardEligible !== undefined ? (p.isRewardEligible === 1 || p.isRewardEligible === true || p.isRewardEligible === "1") : true,
    sizes,
    gallery: gallery.length > 0 ? gallery : [resolvedImg],
  };
}

// ==========================================
// 2. CATEGORIES REPOSITORY
// ==========================================
export const categoriesRepo = {
  getAll() {
    const db = getDatabase();
    return db.prepare("SELECT * FROM categories WHERE isVisible = 1 ORDER BY displayOrder ASC, name ASC").all() as any[];
  },

  getAllAdmin() {
    const db = getDatabase();
    return db.prepare("SELECT * FROM categories ORDER BY displayOrder ASC, name ASC").all() as any[];
  },

  getBySlug(slug: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as any;
  },

  create(data: { name: string; slug?: string; description?: string; image?: string; displayOrder?: number }) {
    const db = getDatabase();
    const id = "cat_" + Date.now();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    db.prepare(`
      INSERT INTO categories (id, name, slug, description, image, isVisible, displayOrder)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(id, data.name, slug, data.description || "", data.image || "", data.displayOrder || 0);
    return db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  },

  update(id: string, updates: any) {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(updates)) {
      if (k !== "id") {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }
    values.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  },

  delete(id: string) {
    const db = getDatabase();
    const activeCount = (db.prepare("SELECT COUNT(*) as count FROM products WHERE categoryId = ? AND status != 'Archived'").get(id) as any)?.count || 0;
    if (activeCount > 0) {
      throw new Error(`Cannot delete category containing ${activeCount} active product(s). Please reassign or archive products first.`);
    }
    const res = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return res.changes > 0;
  }
};

// ==========================================
// 3. USERS & AUTH REPOSITORY
// ==========================================
export const usersRepo = {
  getByPhone(phone: string) {
    const db = getDatabase();
    const clean = phone.replace(/[\s\-\(\)\+]/g, "");
    const last10 = clean.slice(-10);
    return db.prepare(`
      SELECT * FROM users
      WHERE phone = ? OR phone = ? OR phone = ? OR phone LIKE ?
      LIMIT 1
    `).get(phone, clean, `+91${clean}`, `%${last10}`) as any;
  },

  createFromOtp(data: { phone: string; name?: string; email?: string }) {
    const db = getDatabase();
    const clean = data.phone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    const id = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const name = data.name?.trim() || `Customer ${clean.slice(-4)}`;
    const email = data.email?.trim().toLowerCase() || `phone_${clean}@trinayaa.in`;
    const now = new Date().toISOString();
    const randomSecret = crypto.randomBytes(32).toString("hex");
    const passwordHash = hashPassword(randomSecret);

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 'ACTIVE', ?, ?)
    `).run(id, email, passwordHash, name, clean, now, now);

    return this.getById(id);
  },

  updatePassword(userId: string, newPassword: string) {
    const db = getDatabase();
    const hash = hashPassword(newPassword);
    const now = new Date().toISOString();
    db.prepare("UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?").run(hash, now, userId);
    return this.getById(userId);
  },

  getByEmail(email: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as any;
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT id, email, name, phone, role, status, adminNotes, telegramId, createdAt, updatedAt FROM users WHERE id = ?").get(id) as any;
  },

  create(data: { email: string; password: string; name: string; phone?: string; role?: string }) {
    const db = getDatabase();
    const id = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const hash = hashPassword(data.password);
    const now = new Date().toISOString();
    const email = data.email.toLowerCase().trim();

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(id, email, hash, data.name, data.phone || "", data.role || "CUSTOMER", now, now);

    return this.getById(id);
  },

  update(id: string, updates: { name?: string; phone?: string; telegramId?: string; status?: string; role?: string; password?: string }) {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
    if (updates.phone !== undefined) { fields.push("phone = ?"); values.push(updates.phone); }
    if (updates.telegramId !== undefined) { fields.push("telegramId = ?"); values.push(updates.telegramId); }
    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.role !== undefined) { fields.push("role = ?"); values.push(updates.role); }
    if (updates.password) { fields.push("passwordHash = ?"); values.push(hashPassword(updates.password)); }

    fields.push("updatedAt = ?");
    values.push(new Date().toISOString());

    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  listCustomers(limit = 100, offset = 0) {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.id, u.email, u.name, u.phone, u.role, u.status, u.adminNotes, u.createdAt,
             (SELECT COUNT(*) FROM orders o WHERE o.customerId = u.id) as totalOrders,
             (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.customerId = u.id AND o.paymentStatus = 'PAID') as totalSpent
      FROM users u
      WHERE u.role = 'CUSTOMER'
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];
  },

  listCustomersAdvanced(params: {
    search?: string;
    status?: string;
    purchaseActivity?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
  }) {
    const db = getDatabase();
    const limit = Math.min(params.limit || 20, 100);
    const offset = params.offset || 0;
    const conditions: string[] = ["u.role = 'CUSTOMER'"];
    const values: any[] = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.id LIKE ?)");
      values.push(q, q, q, q);
    }

    if (params.status && params.status !== "ALL") {
      conditions.push("u.status = ?");
      values.push(params.status);
    }

    if (params.purchaseActivity === "WITH_ORDERS") {
      conditions.push("(SELECT COUNT(*) FROM orders o WHERE o.customerId = u.id) > 0");
    } else if (params.purchaseActivity === "NO_ORDERS") {
      conditions.push("(SELECT COUNT(*) FROM orders o WHERE o.customerId = u.id) = 0");
    }

    if (params.startDate) {
      conditions.push("u.createdAt >= ?");
      values.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push("u.createdAt <= ?");
      values.push(params.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...values) as any;
    const total = totalRow ? totalRow.total : 0;

    // Sorting
    const sortFieldMap: Record<string, string> = {
      createdAt: "u.createdAt",
      name: "u.name",
      totalOrders: "totalOrders",
      totalSpent: "totalSpent",
    };
    const sortCol = sortFieldMap[params.sortBy || "createdAt"] || "u.createdAt";
    const sortDir = (params.sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    const querySql = `
      SELECT u.id, u.email, u.name, u.phone, u.role, u.status, u.adminNotes, u.createdAt, u.updatedAt,
             (SELECT COUNT(*) FROM orders o WHERE o.customerId = u.id) as totalOrders,
             (SELECT COUNT(*) FROM orders o WHERE o.customerId = u.id AND o.orderStatus IN ('Delivered', 'Confirmed', 'Shipped')) as completedOrders,
             (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.customerId = u.id AND o.paymentStatus = 'PAID' AND o.orderStatus NOT IN ('Cancelled', 'Refunded')) as totalSpent
      FROM users u
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;

    const customers = db.prepare(querySql).all(...values, limit, offset) as any[];
    return { customers, total };
  },

  getCustomerMetrics() {
    const db = getDatabase();
    const totalCustomers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER'").get() as any).c;
    const activeCustomers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER' AND status = 'ACTIVE'").get() as any).c;
    const inactiveCustomers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER' AND status IN ('INACTIVE', 'SUSPENDED', 'DEACTIVATED')").get() as any).c;
    
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newCustomers30d = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER' AND createdAt >= ?").get(d30) as any).c;
    
    const customersWithOrders = (db.prepare("SELECT COUNT(DISTINCT customerId) as c FROM orders WHERE customerId IS NOT NULL AND customerId != ''").get() as any).c;
    const customersWithoutOrders = Math.max(0, totalCustomers - customersWithOrders);
    
    const totalCustomerOrders = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE customerId IS NOT NULL AND customerId != ''").get() as any).c;
    const totalCompletedOrders = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE orderStatus = 'Delivered'").get() as any).c;
    
    const revRow = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as rev
      FROM orders
      WHERE paymentStatus = 'PAID' AND orderStatus NOT IN ('Cancelled', 'Refunded')
    `).get() as any;
    const totalVerifiedRevenue = revRow ? revRow.rev : 0;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      newCustomers30d,
      customersWithOrders,
      customersWithoutOrders,
      totalCustomerOrders,
      totalCompletedOrders,
      totalVerifiedRevenue,
    };
  },

  getCustomer360(customerId: string) {
    const db = getDatabase();
    const customer = db.prepare(`
      SELECT id, email, name, phone, role, status, adminNotes, telegramId, createdAt, updatedAt
      FROM users
      WHERE id = ?
    `).get(customerId) as any;

    if (!customer) return null;

    // Saved delivery addresses
    const addresses = db.prepare(`
      SELECT * FROM customer_addresses
      WHERE userId = ?
      ORDER BY isDefault DESC, createdAt DESC
    `).all(customerId) as any[];

    // Orders with items
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE customerId = ?
      ORDER BY createdAt DESC
    `).all(customerId) as any[];

    const orderItemStmt = db.prepare(`
      SELECT * FROM order_items WHERE orderId = ?
    `);

    for (const ord of orders) {
      ord.items = orderItemStmt.all(ord.id);
    }

    // Purchase summary
    let netRevenue = 0;
    let paidOrdersCount = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let pendingOrders = 0;
    let refundedOrders = 0;

    for (const ord of orders) {
      if (ord.orderStatus === "Delivered" || ord.orderStatus === "Confirmed" || ord.orderStatus === "Shipped") {
        completedOrders++;
      }
      if (ord.orderStatus === "Cancelled") {
        cancelledOrders++;
      }
      if (ord.orderStatus === "Pending Payment") {
        pendingOrders++;
      }
      if (ord.orderStatus === "Refunded") {
        refundedOrders++;
      }
      if (ord.paymentStatus === "PAID" && ord.orderStatus !== "Cancelled" && ord.orderStatus !== "Refunded") {
        netRevenue += Number(ord.total || 0);
        paidOrdersCount++;
      }
    }

    const aov = paidOrdersCount > 0 ? Math.round(netRevenue / paidOrdersCount) : 0;
    const firstOrderDate = orders.length > 0 ? orders[orders.length - 1].createdAt : null;
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

    const purchaseSummary = {
      totalOrders: orders.length,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      refundedOrders,
      paidOrdersCount,
      netRevenue,
      aov,
      firstOrderDate,
      lastOrderDate,
    };

    // Feedback
    const feedback = db.prepare(`
      SELECT * FROM customer_feedback
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customerId) as any[];

    // Product reviews
    const reviews = db.prepare(`
      SELECT r.*, p.nameEn as productNameEn
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `).all(customerId) as any[];

    // Support tickets
    const supportTickets = db.prepare(`
      SELECT * FROM support_tickets
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customerId) as any[];

    // Wishlist
    const wishlist = db.prepare(`
      SELECT w.*, p.sku, p.nameEn, p.nameTa, p.sellingPrice as price, p.primaryImage
      FROM wishlist_items w
      JOIN products p ON (w.product_id = p.id OR w.product_id = p.sku)
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(customerId) as any[];

    // Audit logs
    const auditLogs = db.prepare(`
      SELECT * FROM customer_audit_logs
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customerId) as any[];

    return {
      customer,
      addresses,
      purchaseSummary,
      orders,
      feedback,
      reviews,
      supportTickets,
      wishlist,
      auditLogs,
    };
  },

  updateCustomerStatus(customerId: string, status: string, reason: string, performedBy: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users SET status = ?, updatedAt = ? WHERE id = ?
    `).run(status, now, customerId);

    const logId = "cal_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const action = status === "ACTIVE" ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED";
    db.prepare(`
      INSERT INTO customer_audit_logs (id, customer_id, action, performed_by, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, customerId, action, performedBy, reason || `Status updated to ${status}`, now);

    return this.getById(customerId);
  },

  updateCustomerNotes(customerId: string, adminNotes: string, performedBy: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users SET adminNotes = ?, updatedAt = ? WHERE id = ?
    `).run(adminNotes, now, customerId);

    const logId = "cal_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO customer_audit_logs (id, customer_id, action, performed_by, details, created_at)
      VALUES (?, ?, 'ADMIN_NOTES_UPDATED', ?, 'Admin notes updated', ?)
    `).run(logId, customerId, performedBy, now);

    return this.getById(customerId);
  },

  exportCustomersCsv(params: {
    search?: string;
    status?: string;
    purchaseActivity?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { customers } = this.listCustomersAdvanced({ ...params, limit: 10000, offset: 0 });

    const sanitizeCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Defense against CSV / Spreadsheet formula injection
      if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Registration Date",
      "Total Orders",
      "Completed Orders",
      "Verified Total Spent (INR)",
      "Admin Notes",
    ];

    const rows = [headers.map(sanitizeCell).join(",")];

    for (const c of customers) {
      rows.push([
        sanitizeCell(c.id),
        sanitizeCell(c.name),
        sanitizeCell(c.email),
        sanitizeCell(c.phone || ""),
        sanitizeCell(c.status),
        sanitizeCell(c.createdAt),
        sanitizeCell(c.totalOrders || 0),
        sanitizeCell(c.completedOrders || 0),
        sanitizeCell(c.totalSpent || 0),
        sanitizeCell(c.adminNotes || ""),
      ].join(","));
    }

    return rows.join("\n");
  }
};

// ==========================================
// 4. CART REPOSITORY
// ==========================================
export const cartRepo = {
  getOrCreate(userId?: string, guestToken?: string) {
    const db = getDatabase();
    let cart: any = null;

    if (userId) {
      cart = db.prepare("SELECT * FROM carts WHERE userId = ?").get(userId);
    } else if (guestToken) {
      cart = db.prepare("SELECT * FROM carts WHERE guestToken = ?").get(guestToken);
    }

    if (!cart) {
      const id = "cart_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const now = new Date().toISOString();
      db.prepare("INSERT INTO carts (id, userId, guestToken, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)")
        .run(id, userId || null, guestToken || null, now, now);
      cart = { id, userId, guestToken, createdAt: now, updatedAt: now };
    }

    const items = db.prepare(`
      SELECT ci.*, p.nameEn, p.nameTa, p.primaryImage, p.slug
      FROM cart_items ci
      JOIN products p ON ci.productId = p.id
      WHERE ci.cartId = ?
    `).all(cart.id) as any[];

    return { ...cart, items };
  },

  addItem(cartId: string, productId: string, packSize: string, clientUnitPrice?: number, quantity = 1) {
    const db = getDatabase();

    // 1. Validate Product and Availability
    const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
    if (!prod) {
      throw new Error("Product not found");
    }
    if (prod.status !== "Published") {
      throw new Error("Product is currently unavailable");
    }
    if (prod.stock <= 0) {
      throw new Error("Product is currently out of stock");
    }

    // 2. Fetch True Unit Price and Max Stock from Database
    const variant = db.prepare("SELECT * FROM product_variants WHERE productId = ? AND packSize = ?")
      .get(productId, packSize) as any;
    const trueUnitPrice = variant ? Number(variant.price) : Number(prod.sellingPrice);
    const maxStock = variant ? Number(variant.stock) : Number(prod.stock);

    const existing = db.prepare("SELECT * FROM cart_items WHERE cartId = ? AND productId = ? AND packSize = ?")
      .get(cartId, productId, packSize) as any;

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > maxStock) {
        throw new Error(`Requested quantity exceeds available stock (${maxStock})`);
      }
      db.prepare("UPDATE cart_items SET quantity = ?, unitPrice = ? WHERE id = ?")
        .run(newQty, trueUnitPrice, existing.id);
    } else {
      if (quantity > maxStock) {
        throw new Error(`Requested quantity exceeds available stock (${maxStock})`);
      }
      const id = "ci_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      db.prepare(`
        INSERT INTO cart_items (id, cartId, productId, packSize, unitPrice, quantity, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, cartId, productId, packSize, trueUnitPrice, quantity, new Date().toISOString());
    }

    db.prepare("UPDATE carts SET updatedAt = ? WHERE id = ?").run(new Date().toISOString(), cartId);
    return this.getCartItems(cartId);
  },

  updateItem(cartId: string, productId: string, packSize: string, quantity: number) {
    const db = getDatabase();
    if (quantity <= 0) {
      db.prepare("DELETE FROM cart_items WHERE cartId = ? AND productId = ? AND packSize = ?")
        .run(cartId, productId, packSize);
    } else {
      const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
      const variant = prod ? db.prepare("SELECT * FROM product_variants WHERE productId = ? AND packSize = ?").get(productId, packSize) as any : null;
      const maxStock = variant ? Number(variant.stock) : (prod ? Number(prod.stock) : 100);

      if (quantity > maxStock) {
        throw new Error(`Requested quantity exceeds available stock (${maxStock})`);
      }
      db.prepare("UPDATE cart_items SET quantity = ? WHERE cartId = ? AND productId = ? AND packSize = ?")
        .run(quantity, cartId, productId, packSize);
    }
    db.prepare("UPDATE carts SET updatedAt = ? WHERE id = ?").run(new Date().toISOString(), cartId);
    return this.getCartItems(cartId);
  },

  removeItem(cartId: string, productId: string, packSize: string) {
    const db = getDatabase();
    db.prepare("DELETE FROM cart_items WHERE cartId = ? AND productId = ? AND packSize = ?")
      .run(cartId, productId, packSize);
    return this.getCartItems(cartId);
  },

  clear(cartId: string) {
    const db = getDatabase();
    db.prepare("DELETE FROM cart_items WHERE cartId = ?").run(cartId);
    return [];
  },

  getCartItems(cartId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT ci.*, p.nameEn, p.nameTa, p.primaryImage, p.slug
      FROM cart_items ci
      JOIN products p ON ci.productId = p.id
      WHERE ci.cartId = ?
    `).all(cartId) as any[];
  },

  mergeGuestCart(guestToken: string, userId: string) {
    const db = getDatabase();
    const guestCart = db.prepare("SELECT * FROM carts WHERE guestToken = ?").get(guestToken) as any;
    if (!guestCart) return;

    db.exec("BEGIN TRANSACTION;");
    try {
      let userCart = db.prepare("SELECT * FROM carts WHERE userId = ?").get(userId) as any;
      if (!userCart) {
        // Re-assign guest cart to user
        db.prepare("UPDATE carts SET userId = ?, guestToken = NULL, updatedAt = ? WHERE id = ?")
          .run(userId, new Date().toISOString(), guestCart.id);
        db.exec("COMMIT;");
        return;
      }

      // Merge items into userCart
      const guestItems = db.prepare("SELECT * FROM cart_items WHERE cartId = ?").all(guestCart.id) as any[];
      for (const item of guestItems) {
        // Validate product and stock
        const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(item.productId) as any;
        if (!prod || prod.status !== "Published") continue;

        const variant = db.prepare("SELECT * FROM product_variants WHERE productId = ? AND packSize = ?")
          .get(item.productId, item.packSize) as any;
        const truePrice = variant ? Number(variant.price) : Number(prod.sellingPrice);
        const maxStock = variant ? Number(variant.stock) : Number(prod.stock);

        const existing = db.prepare("SELECT * FROM cart_items WHERE cartId = ? AND productId = ? AND packSize = ?")
          .get(userCart.id, item.productId, item.packSize) as any;

        if (existing) {
          const combinedQty = Math.min(existing.quantity + item.quantity, maxStock);
          db.prepare("UPDATE cart_items SET quantity = ?, unitPrice = ? WHERE id = ?")
            .run(combinedQty, truePrice, existing.id);
        } else {
          const qty = Math.min(item.quantity, maxStock);
          const newId = "ci_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
          db.prepare(`
            INSERT INTO cart_items (id, cartId, productId, packSize, unitPrice, quantity, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(newId, userCart.id, item.productId, item.packSize, truePrice, qty, new Date().toISOString());
        }
      }

      // Invalidate / delete guest cart
      db.prepare("DELETE FROM cart_items WHERE cartId = ?").run(guestCart.id);
      db.prepare("DELETE FROM carts WHERE id = ?").run(guestCart.id);

      db.prepare("UPDATE carts SET updatedAt = ? WHERE id = ?").run(new Date().toISOString(), userCart.id);
      db.exec("COMMIT;");
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }
};

// ==========================================
// 4B. CUSTOMER ADDRESSES REPOSITORY
// ==========================================
export const addressesRepo = {
  getByUserId(userId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM customer_addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC").all(userId) as any[];
  },

  getById(id: string, userId?: string) {
    const db = getDatabase();
    if (userId) {
      return db.prepare("SELECT * FROM customer_addresses WHERE id = ? AND userId = ?").get(id, userId) as any;
    }
    return db.prepare("SELECT * FROM customer_addresses WHERE id = ?").get(id) as any;
  },

  create(userId: string, data: any) {
    const db = getDatabase();
    const id = "addr_" + crypto.randomUUID();
    const now = new Date().toISOString();
    let isDefault = data.isDefault ? 1 : 0;

    const countCheck = db.prepare("SELECT COUNT(*) as cnt FROM customer_addresses WHERE userId = ?").get(userId) as { cnt: number };
    if (!countCheck || countCheck.cnt === 0) {
      isDefault = 1;
    }

    if (isDefault) {
      db.prepare("UPDATE customer_addresses SET isDefault = 0 WHERE userId = ?").run(userId);
    }

    const street = data.street || [data.addressLine1, data.addressLine2, data.landmark].filter(Boolean).join(", ") || "Address Line";

    db.prepare(`
      INSERT INTO customer_addresses (
        id, userId, recipientName, phone, street, city, state, pinCode, isDefault,
        addressLine1, addressLine2, landmark, district, addressType, deliveryInstructions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      data.recipientName,
      data.phone,
      street,
      data.city,
      data.state || "Tamil Nadu",
      data.pinCode,
      isDefault,
      data.addressLine1 || street,
      data.addressLine2 || null,
      data.landmark || null,
      data.district || null,
      data.addressType || "Home",
      data.deliveryInstructions || null,
      now,
      now
    );

    return this.getById(id);
  },

  update(id: string, userId: string, data: any) {
    const db = getDatabase();
    const existing = this.getById(id, userId);
    if (!existing) return null;

    if (data.isDefault) {
      db.prepare("UPDATE customer_addresses SET isDefault = 0 WHERE userId = ?").run(userId);
    }

    const now = new Date().toISOString();
    const street = data.street || (data.addressLine1 ? [data.addressLine1, data.addressLine2, data.landmark].filter(Boolean).join(", ") : existing.street);

    db.prepare(`
      UPDATE customer_addresses
      SET recipientName = COALESCE(?, recipientName),
          phone = COALESCE(?, phone),
          street = COALESCE(?, street),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          pinCode = COALESCE(?, pinCode),
          isDefault = COALESCE(?, isDefault),
          addressLine1 = COALESCE(?, addressLine1),
          addressLine2 = COALESCE(?, addressLine2),
          landmark = COALESCE(?, landmark),
          district = COALESCE(?, district),
          addressType = COALESCE(?, addressType),
          deliveryInstructions = COALESCE(?, deliveryInstructions),
          updatedAt = ?
      WHERE id = ? AND userId = ?
    `).run(
      data.recipientName || null,
      data.phone || null,
      street,
      data.city || null,
      data.state || null,
      data.pinCode || null,
      data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : null,
      data.addressLine1 || null,
      data.addressLine2 || null,
      data.landmark || null,
      data.district || null,
      data.addressType || null,
      data.deliveryInstructions || null,
      now,
      id,
      userId
    );

    return this.getById(id);
  },

  delete(id: string, userId: string) {
    const db = getDatabase();
    const existing = this.getById(id, userId);
    if (!existing) return false;

    db.prepare("DELETE FROM customer_addresses WHERE id = ? AND userId = ?").run(id, userId);

    if (existing.isDefault) {
      const remaining = db.prepare("SELECT id FROM customer_addresses WHERE userId = ? ORDER BY createdAt DESC LIMIT 1").get(userId) as any;
      if (remaining) {
        db.prepare("UPDATE customer_addresses SET isDefault = 1 WHERE id = ?").run(remaining.id);
      }
    }
    return true;
  },

  setDefault(id: string, userId: string) {
    const db = getDatabase();
    const existing = this.getById(id, userId);
    if (!existing) return null;

    db.prepare("UPDATE customer_addresses SET isDefault = 0 WHERE userId = ?").run(userId);
    db.prepare("UPDATE customer_addresses SET isDefault = 1, updatedAt = ? WHERE id = ? AND userId = ?").run(
      new Date().toISOString(),
      id,
      userId
    );

    return this.getById(id);
  }
};

// ==========================================
// 4C. PAYMENTS REPOSITORY
// ==========================================
export const paymentsRepo = {
  create(data: {
    orderId: string;
    gatewayOrderId: string;
    amount: number;
    currency?: string;
    paymentGateway?: string;
    status?: string;
    rawResponse?: string;
  }) {
    const db = getDatabase();
    const id = "pay_" + crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO payments (
        id, orderId, paymentGateway, gatewayOrderId, amount, currency, status, rawResponse, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.orderId,
      data.paymentGateway || "RAZORPAY",
      data.gatewayOrderId,
      data.amount,
      data.currency || "INR",
      data.status || "PENDING",
      data.rawResponse || null,
      now
    );

    return this.getById(id);
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as any;
  },

  getByOrderId(orderId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM payments WHERE orderId = ? ORDER BY createdAt DESC").all(orderId) as any[];
  },

  getByGatewayOrderId(gatewayOrderId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM payments WHERE gatewayOrderId = ?").get(gatewayOrderId) as any;
  },

  getByEventId(eventId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM payments WHERE eventId = ?").get(eventId) as any;
  },

  updateStatus(
    id: string,
    status: string,
    details?: {
      gatewayPaymentId?: string;
      gatewaySignature?: string;
      rawResponse?: string;
      errorDescription?: string;
      eventId?: string;
    }
  ) {
    const db = getDatabase();
    db.prepare(`
      UPDATE payments
      SET status = ?,
          gatewayPaymentId = COALESCE(?, gatewayPaymentId),
          gatewaySignature = COALESCE(?, gatewaySignature),
          rawResponse = COALESCE(?, rawResponse),
          errorDescription = COALESCE(?, errorDescription),
          eventId = COALESCE(?, eventId)
      WHERE id = ?
    `).run(
      status,
      details?.gatewayPaymentId || null,
      details?.gatewaySignature || null,
      details?.rawResponse || null,
      details?.errorDescription || null,
      details?.eventId || null,
      id
    );
    return this.getById(id);
  }
};

// ==========================================
// 5. ORDERS & TRACKING REPOSITORY
// ==========================================
export const ordersRepo = {
  create(orderData: any, items: any[]) {
    const db = getDatabase();
    const id = "ord_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const orderNumber = orderData.orderNumber || "TRN-" + Math.floor(10000 + Math.random() * 90000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders (
        id, orderNumber, customerId, customerName, customerEmail, customerPhone,
        shippingAddress, subtotal, discountAmount, shippingFee, total,
        paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId,
        orderStatus, internalNotes, couponCode, trackingNumber, carrier, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orderNumber,
      orderData.customerId || null,
      orderData.customerName,
      orderData.customerEmail,
      orderData.customerPhone,
      typeof orderData.shippingAddress === "string" ? orderData.shippingAddress : JSON.stringify(orderData.shippingAddress),
      orderData.subtotal,
      orderData.discountAmount || 0,
      orderData.shippingFee || 0,
      orderData.total,
      orderData.paymentMethod || "RAZORPAY",
      orderData.paymentStatus || "PENDING",
      orderData.razorpayOrderId || null,
      orderData.razorpayPaymentId || null,
      orderData.orderStatus || "Pending Payment",
      orderData.internalNotes || "",
      orderData.couponCode || null,
      orderData.trackingNumber || null,
      orderData.carrier || null,
      now,
      now
    );

    // Insert order items
    for (const item of items) {
      const itemId = "oi_" + crypto.randomUUID();
      db.prepare(`
        INSERT INTO order_items (
          id, orderId, productId, productNameEn, productNameTa, packSize, price, quantity, subtotal, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        id,
        item.productId || null,
        item.productNameEn || item.name || "Botanical Item",
        item.productNameTa || "",
        item.packSize || "100g",
        item.price || item.unitPrice,
        item.quantity,
        (item.price || item.unitPrice) * item.quantity,
        item.image || null
      );
    }

    // Insert initial status history
    db.prepare(`
      INSERT INTO order_status_history (id, orderId, status, note, updatedBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      "osh_" + crypto.randomUUID(),
      id,
      orderData.orderStatus || "Pending Payment",
      "Order created with TRINAYAA checkout",
      "System",
      now
    );

    const created = this.getById(id);

    try {
      notificationsService.dispatch("ORDER_CREATED", {
        orderId: created.id,
        orderNumber: created.orderNumber,
        customerName: created.customerName,
        customerEmail: created.customerEmail,
        customerPhone: created.customerPhone,
        total: created.total,
        items: created.items,
        shippingAddress: created.shippingAddress,
        timestamp: now,
      });
    } catch {}

    return created;
  },

  getById(id: string) {
    const db = getDatabase();
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
    if (!order) return null;
    return this.enrichOrder(order);
  },

  getByOrderNumber(orderNumber: string) {
    const db = getDatabase();
    const cleanNumber = orderNumber.trim().toUpperCase();
    const order = db.prepare("SELECT * FROM orders WHERE UPPER(orderNumber) = ?").get(cleanNumber) as any;
    if (!order) return null;
    return this.enrichOrder(order);
  },

  getByRazorpayOrderId(rzpOrderId: string) {
    const db = getDatabase();
    const order = db.prepare("SELECT * FROM orders WHERE razorpayOrderId = ?").get(rzpOrderId) as any;
    if (!order) return null;
    return this.enrichOrder(order);
  },

  confirmPayment(
    orderId: string,
    paymentDetails: {
      gatewayPaymentId?: string;
      gatewaySignature?: string;
      rawResponse?: any;
    }
  ) {
    const db = getDatabase();
    const order = this.getById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    // Idempotent: If order is ALREADY Confirmed and paymentStatus is PAID, do not deduct inventory again!
    if (order.paymentStatus === "PAID" && (order.orderStatus === "Confirmed" || order.orderStatus === "Processing")) {
      return order;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE orders
      SET paymentStatus = 'PAID',
          orderStatus = 'Confirmed',
          razorpayPaymentId = COALESCE(?, razorpayPaymentId),
          updatedAt = ?
      WHERE id = ?
    `).run(paymentDetails.gatewayPaymentId || null, now, orderId);

    // Update payment records
    db.prepare(`
      UPDATE payments
      SET status = 'CAPTURED',
          gatewayPaymentId = COALESCE(?, gatewayPaymentId),
          gatewaySignature = COALESCE(?, gatewaySignature),
          rawResponse = COALESCE(?, rawResponse)
      WHERE orderId = ?
    `).run(
      paymentDetails.gatewayPaymentId || null,
      paymentDetails.gatewaySignature || null,
      paymentDetails.rawResponse ? (typeof paymentDetails.rawResponse === "string" ? paymentDetails.rawResponse : JSON.stringify(paymentDetails.rawResponse)) : null,
      orderId
    );

    // Log status history
    db.prepare(`
      INSERT INTO order_status_history (id, orderId, status, note, updatedBy, createdAt)
      VALUES (?, ?, 'Confirmed', 'Payment verified via Razorpay. Order confirmed.', 'Razorpay Gateway', ?)
    `).run("osh_" + crypto.randomUUID(), orderId, now);

    // Atomically deduct inventory for each order item
    for (const item of order.items) {
      if (item.productId) {
        try {
          inventoryRepo.adjustStock(
            item.productId,
            null,
            -item.quantity,
            "SALE",
            order.orderNumber,
            `Order confirmed (${order.orderNumber})`,
            "Payment Gateway"
          );
        } catch (err) {
          console.error(`[Inventory Error] Failed to deduct stock for product ${item.productId}:`, err);
        }
      }
    }

    // Increment coupon usage count if used
    if (order.couponCode) {
      try {
        db.prepare("UPDATE campaigns SET usageCount = usageCount + 1 WHERE code = ?").run(order.couponCode);
        db.prepare("UPDATE coupons SET usageCount = usageCount + 1 WHERE code = ?").run(order.couponCode);
      } catch {}
    }

    const updated = this.getById(orderId);

    try {
      notificationsService.dispatch("PAYMENT_CONFIRMED", {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        customerPhone: updated.customerPhone,
        total: updated.total,
        items: updated.items,
        shippingAddress: updated.shippingAddress,
        timestamp: now,
      });
    } catch {}

    return updated;
  },

  recordPaymentFailure(orderId: string, errorDetails: { reason?: string; rawResponse?: any }) {
    const db = getDatabase();
    const order = this.getById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const now = new Date().toISOString();
    const reason = errorDetails?.reason || "Payment transaction failed or cancelled by user";

    db.prepare(`
      UPDATE orders
      SET paymentStatus = 'FAILED',
          updatedAt = ?
      WHERE id = ?
    `).run(now, orderId);

    db.prepare(`
      UPDATE payments
      SET status = 'FAILED',
          errorDescription = ?,
          rawResponse = COALESCE(?, rawResponse)
      WHERE orderId = ?
    `).run(reason, errorDetails.rawResponse ? (typeof errorDetails.rawResponse === "string" ? errorDetails.rawResponse : JSON.stringify(errorDetails.rawResponse)) : null, orderId);

    db.prepare(`
      INSERT INTO order_status_history (id, orderId, status, note, updatedBy, createdAt)
      VALUES (?, ?, 'Payment Failed', ?, 'Razorpay Gateway', ?)
    `).run("osh_" + crypto.randomUUID(), orderId, `Payment failed: ${reason}`, now);

    try {
      notificationsService.dispatch("PAYMENT_FAILED", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        total: order.total,
        items: order.items,
        reason,
        timestamp: now,
      });
    } catch {}

    return this.getById(orderId);
  },

  updateStatus(
    orderId: string,
    status: string,
    note?: string,
    updatedBy = "Admin",
    trackingDetails?: { trackingNumber?: string; carrier?: string }
  ) {
    const db = getDatabase();
    const order = this.getById(orderId);
    if (!order) throw new Error("Order not found");

    const validStatuses = [
      "Pending Payment",
      "Confirmed",
      "Processing",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Refunded"
    ];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}. Allowed: ${validStatuses.join(", ")}`);
    }

    // Terminal checks
    if (order.orderStatus === "Delivered" && status === "Pending Payment") {
      throw new Error("Delivered orders cannot be moved back to Pending Payment.");
    }
    if ((order.orderStatus === "Cancelled" || order.orderStatus === "Refunded") && status !== order.orderStatus) {
      throw new Error(`Order is already ${order.orderStatus} and cannot transition to ${status}.`);
    }

    const now = new Date().toISOString();

    // Restore inventory if cancelling or refunding a previously paid / confirmed order
    if ((status === "Cancelled" || status === "Refunded") && (order.paymentStatus === "PAID" || order.orderStatus === "Confirmed" || order.orderStatus === "Processing")) {
      for (const item of order.items) {
        if (item.productId) {
          try {
            inventoryRepo.adjustStock(
              item.productId,
              null,
              item.quantity,
              "RESTOCK",
              order.orderNumber,
              `Order ${status.toLowerCase()} by ${updatedBy}`,
              updatedBy
            );
          } catch (err) {
            console.error(`[Inventory Error] Failed to restore stock for ${item.productId}:`, err);
          }
        }
      }
    }

    const paymentStatus = status === "Refunded" ? "REFUNDED" : order.paymentStatus;
    const trackingNumber = trackingDetails?.trackingNumber !== undefined ? trackingDetails.trackingNumber : (order.trackingNumber || null);
    const carrier = trackingDetails?.carrier !== undefined ? trackingDetails.carrier : (order.carrier || null);

    db.prepare(`
      UPDATE orders
      SET orderStatus = ?,
          paymentStatus = ?,
          trackingNumber = ?,
          carrier = ?,
          updatedAt = ?
      WHERE id = ?
    `).run(status, paymentStatus, trackingNumber, carrier, now, orderId);

    db.prepare(`
      INSERT INTO order_status_history (id, orderId, status, note, updatedBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      "osh_" + crypto.randomUUID(),
      orderId,
      status,
      note || `Status updated to ${status}`,
      updatedBy,
      now
    );

    const updated = this.getById(orderId);

    try {
      let notifEvent: OrderNotificationEvent | null = null;
      if (status === "Shipped") notifEvent = "ORDER_SHIPPED";
      else if (status === "Out for Delivery") notifEvent = "OUT_FOR_DELIVERY";
      else if (status === "Delivered") notifEvent = "ORDER_DELIVERED";
      else if (status === "Cancelled") notifEvent = "ORDER_CANCELLED";
      else if (status === "Refunded") notifEvent = "ORDER_REFUNDED";

      if (notifEvent) {
        notificationsService.dispatch(notifEvent, {
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          customerPhone: updated.customerPhone,
          total: updated.total,
          items: updated.items,
          trackingNumber: updated.trackingNumber,
          carrier: updated.carrier,
          shippingAddress: updated.shippingAddress,
          reason: note,
          timestamp: now,
        });
      }
    } catch {}

    return updated;
  },

  updatePayment(orderId: string, paymentStatus: string, razorpayPaymentId?: string) {
    if (paymentStatus === "PAID") {
      return this.confirmPayment(orderId, { gatewayPaymentId: razorpayPaymentId });
    }
    if (paymentStatus === "FAILED") {
      return this.recordPaymentFailure(orderId, { reason: "Payment marked failed" });
    }
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders
      SET paymentStatus = ?, razorpayPaymentId = COALESCE(?, razorpayPaymentId), updatedAt = ?
      WHERE id = ?
    `).run(paymentStatus, razorpayPaymentId || null, now, orderId);
    return this.getById(orderId);
  },

  trackOrder(orderNumber: string, verificationPhoneOrEmail?: string) {
    const db = getDatabase();
    const cleanNumber = orderNumber.trim().toUpperCase();
    let query = "SELECT * FROM orders WHERE UPPER(orderNumber) = ?";
    const params: any[] = [cleanNumber];

    if (verificationPhoneOrEmail && verificationPhoneOrEmail.trim()) {
      const ver = verificationPhoneOrEmail.trim().toLowerCase();
      const digitsOnly = ver.replace(/\D/g, "");
      if (digitsOnly.length >= 6) {
        query += " AND (LOWER(customerEmail) = ? OR REPLACE(REPLACE(REPLACE(customerPhone, ' ', ''), '-', ''), '+', '') LIKE ?)";
        params.push(ver, `%${digitsOnly.slice(-10)}%`);
      } else {
        query += " AND LOWER(customerEmail) = ?";
        params.push(ver);
      }
    }

    const order = db.prepare(query).get(...params) as any;
    if (!order) return null;

    const history = db.prepare("SELECT status, note, updatedBy, createdAt FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC").all(order.id) as any[];
    const items = db.prepare("SELECT productNameEn, productNameTa, packSize, quantity, price, image FROM order_items WHERE orderId = ?").all(order.id) as any[];

    let addressSummary: any = {};
    try {
      const parsed = JSON.parse(order.shippingAddress);
      addressSummary = {
        city: parsed.city,
        state: parsed.state,
        pinCode: parsed.pinCode,
      };
    } catch {
      addressSummary = { city: "India" };
    }

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      discountAmount: order.discountAmount,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items,
      history,
    };
  },

  listAll(options: { status?: string; search?: string; limit?: number; offset?: number } = {}) {
    const db = getDatabase();
    let query = "SELECT * FROM orders WHERE 1=1";
    const params: any[] = [];

    if (options.status && options.status !== "All") {
      query += " AND orderStatus = ?";
      params.push(options.status);
    }

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      query += " AND (orderNumber LIKE ? OR customerName LIKE ? OR customerEmail LIKE ? OR customerPhone LIKE ?)";
      params.push(term, term, term, term);
    }

    query += " ORDER BY createdAt DESC";

    if (options.limit) {
      query += " LIMIT ?";
      params.push(options.limit);
      if (options.offset) {
        query += " OFFSET ?";
        params.push(options.offset);
      }
    }

    const orders = db.prepare(query).all(...params) as any[];
    return orders.map((o) => this.enrichOrder(o));
  },

  getCustomerOrders(customerId: string) {
    const db = getDatabase();
    const orders = db.prepare("SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC").all(customerId) as any[];
    return orders.map((o) => this.enrichOrder(o));
  },

  enrichOrder(order: any) {
    const db = getDatabase();
    const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(order.id) as any[];
    const history = db.prepare("SELECT * FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC").all(order.id) as any[];
    let shippingAddress = {};
    try {
      shippingAddress = JSON.parse(order.shippingAddress);
    } catch {
      shippingAddress = { street: order.shippingAddress };
    }
    return { ...order, items, history, shippingAddress };
  },

  exportCsv(): string {
    const orders = this.listAll({ limit: 10000 });
    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "City",
      "State",
      "PIN Code",
      "Items Count",
      "Subtotal",
      "Discount",
      "Shipping Fee",
      "Total",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Carrier",
      "Tracking Number"
    ];

    const escapeCsv = (str: any) => {
      const s = String(str || "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = orders.map((o: any) => {
      const addr = o.shippingAddress || {};
      const itemCount = (o.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
      return [
        escapeCsv(o.orderNumber),
        escapeCsv(o.createdAt),
        escapeCsv(o.customerName),
        escapeCsv(o.customerEmail),
        escapeCsv(o.customerPhone),
        escapeCsv(addr.city || ""),
        escapeCsv(addr.state || ""),
        escapeCsv(addr.pinCode || ""),
        itemCount,
        o.subtotal,
        o.discountAmount,
        o.shippingFee,
        o.total,
        escapeCsv(o.paymentMethod),
        escapeCsv(o.paymentStatus),
        escapeCsv(o.orderStatus),
        escapeCsv(o.carrier || ""),
        escapeCsv(o.trackingNumber || "")
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  },

  getShippingSlip(orderIdentifier: string) {
    const db = getDatabase();
    const order = (db.prepare("SELECT * FROM orders WHERE id = ? OR orderNumber = ?").get(orderIdentifier, orderIdentifier) || null) as any;
    if (!order) return null;
    const enriched = this.enrichOrder(order);

    let parsedAddress = enriched.shippingAddress;
    if (typeof parsedAddress === "string") {
      try {
        parsedAddress = JSON.parse(parsedAddress);
      } catch {
        parsedAddress = { street: parsedAddress, city: "", state: "Tamil Nadu", pinCode: "" };
      }
    }

    const addressLines = [
      parsedAddress?.recipientName ? `Attn: ${parsedAddress.recipientName}` : null,
      parsedAddress?.addressLine1 || parsedAddress?.street,
      parsedAddress?.addressLine2,
      parsedAddress?.landmark ? `Landmark: ${parsedAddress.landmark}` : null,
      parsedAddress?.district,
      parsedAddress?.city,
      parsedAddress?.state ? `${parsedAddress.state} - ${parsedAddress?.pinCode || ""}` : parsedAddress?.pinCode,
    ].filter(Boolean);

    return {
      orderId: enriched.id,
      orderNumber: enriched.orderNumber,
      createdAt: enriched.createdAt,
      orderDate: new Date(enriched.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      customerName: enriched.customerName,
      customerPhone: enriched.customerPhone,
      customerEmail: enriched.customerEmail,
      shippingAddress: parsedAddress,
      formattedAddress: addressLines.join(", "),
      items: (enriched.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        productNameEn: it.productNameEn || it.name,
        productNameTa: it.productNameTa || "",
        sku: it.sku || `TRN-${it.productId?.replace(/\D/g, "") || "ITEM"}`,
        packSize: it.packSize || "100g",
        price: it.price || it.unitPrice,
        quantity: it.quantity,
        subtotal: (it.price || it.unitPrice) * it.quantity,
      })),
      subtotal: enriched.subtotal,
      shippingFee: enriched.shippingFee || 0,
      discountAmount: enriched.discountAmount || 0,
      total: enriched.total,
      paymentMethod: enriched.paymentMethod,
      paymentStatus: enriched.paymentStatus,
      orderStatus: enriched.orderStatus,
      trackingNumber: enriched.trackingNumber || null,
      carrier: enriched.carrier || null,
    };
  }
};

// ==========================================
// 6. CAMPAIGNS & OFFERS REPOSITORY
// ==========================================
export const campaignsRepo = {
  getAll() {
    const db = getDatabase();
    return db.prepare("SELECT * FROM campaigns ORDER BY createdAt DESC").all() as any[];
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as any;
  },

  getActive() {
    const db = getDatabase();
    const now = new Date().toISOString();
    return db.prepare("SELECT * FROM campaigns WHERE isActive = 1 AND startDate <= ? AND endDate >= ? ORDER BY discountValue DESC").all(now, now) as any[];
  },

  getByCode(code: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM campaigns WHERE UPPER(code) = ?").get(code.trim().toUpperCase()) as any;
  },

  validateCoupon(code: string, subtotal: number) {
    const campaign = this.getByCode(code);
    if (!campaign) {
      return { valid: false, message: "Coupon code not found." };
    }
    const now = new Date().toISOString();
    if (campaign.endDate && now > campaign.endDate) {
      return { valid: false, message: "This promotional campaign has expired." };
    }
    if (campaign.startDate && now < campaign.startDate) {
      return { valid: false, message: "This promotional campaign is not active yet." };
    }
    if (campaign.isActive === 0 || campaign.isActive === false) {
      return { valid: false, message: "This offer is no longer active." };
    }
    if (campaign.usageLimit && campaign.usageCount >= campaign.usageLimit) {
      return { valid: false, message: "This coupon usage limit has been reached." };
    }
    if (campaign.minOrderValue && subtotal < campaign.minOrderValue) {
      return { valid: false, message: `Minimum cart value of ₹${campaign.minOrderValue} required for this coupon.` };
    }

    let discount = 0;
    if (campaign.discountType === "PERCENTAGE") {
      discount = Math.round((subtotal * campaign.discountValue) / 100);
      if (campaign.maxDiscount && discount > campaign.maxDiscount) {
        discount = campaign.maxDiscount;
      }
    } else {
      discount = Math.min(campaign.discountValue, subtotal);
    }

    return {
      valid: true,
      code: campaign.code,
      name: campaign.name,
      discountAmount: discount,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
    };
  },

  create(data: any) {
    const db = getDatabase();
    const id = "camp_" + Date.now();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO campaigns (
        id, name, code, discountType, discountValue, minOrderValue, maxDiscount,
        startDate, endDate, isActive, bannerText, bannerImage,
        eligibleCategories, eligibleProducts, usageLimit, usageCount, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      data.name,
      data.code.trim().toUpperCase(),
      data.discountType || "PERCENTAGE",
      data.discountValue,
      data.minOrderValue || 0,
      data.maxDiscount || 1000,
      data.startDate,
      data.endDate,
      data.isActive === false || data.isActive === 0 ? 0 : 1,
      data.bannerText || "",
      data.bannerImage || "",
      JSON.stringify(data.eligibleCategories || []),
      JSON.stringify(data.eligibleProducts || []),
      data.usageLimit || 1000,
      now
    );

    return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id);
  },

  update(id: string, updates: any) {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    const allowed = [
      "name", "code", "discountType", "discountValue", "minOrderValue",
      "maxDiscount", "startDate", "endDate", "isActive", "bannerText", "bannerImage", "usageLimit"
    ];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === "code") {
          values.push(updates[key].trim().toUpperCase());
        } else if (key === "isActive") {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (updates.eligibleCategories !== undefined) {
      fields.push("eligibleCategories = ?");
      values.push(JSON.stringify(updates.eligibleCategories));
    }
    if (updates.eligibleProducts !== undefined) {
      fields.push("eligibleProducts = ?");
      values.push(JSON.stringify(updates.eligibleProducts));
    }

    values.push(id);
    db.prepare(`UPDATE campaigns SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id);
  },

  toggle(id: string, isActive: boolean) {
    const db = getDatabase();
    db.prepare("UPDATE campaigns SET isActive = ? WHERE id = ?").run(isActive ? 1 : 0, id);
    return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id);
  },

  delete(id: string) {
    const db = getDatabase();
    const res = db.prepare("DELETE FROM campaigns WHERE id = ?").run(id);
    return res.changes > 0;
  }
};

// ==========================================
// 7. SITE CONTENT REPOSITORY
// ==========================================
export const siteContentRepo = {
  get(key: string): string | null {
    const db = getDatabase();
    const row = db.prepare("SELECT value FROM site_content WHERE key = ?").get(key) as { value: string } | undefined;
    return row ? row.value : null;
  },

  getAll(): Record<string, string> {
    const db = getDatabase();
    const rows = db.prepare("SELECT key, value FROM site_content").all() as Array<{ key: string; value: string }>;
    const result: Record<string, string> = {};
    for (const r of rows) result[r.key] = r.value;
    return result;
  },

  set(key: string, value: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("INSERT OR REPLACE INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)")
      .run(key, value, now);
    return { key, value, updatedAt: now };
  },

  getMinimumCodOrderValue(): number {
    const val = this.get("minimum_cod_order_value");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) < 0) {
      return 150;
    }
    return Number(val);
  },

  setMinimumCodOrderValue(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Minimum COD order value must be a non-negative number.");
    }
    this.set("minimum_cod_order_value", String(value));
    return value;
  },

  getLowStockThreshold(): number {
    const val = this.get("low_stock_threshold");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) < 0) {
      return 10;
    }
    return Math.floor(Number(val));
  },

  setLowStockThreshold(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Low-stock threshold must be a non-negative integer.");
    }
    const intVal = Math.floor(value);
    this.set("low_stock_threshold", String(intVal));
    return intVal;
  },

  getFeedbackRewardPoints(): number {
    const val = this.get("feedback_reward_points");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) < 0) {
      return 50;
    }
    return Math.floor(Number(val));
  },

  setFeedbackRewardPoints(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Feedback reward points must be a non-negative integer.");
    }
    const intVal = Math.floor(value);
    this.set("feedback_reward_points", String(intVal));
    return intVal;
  },

  getFreeProductRewardThreshold(): number {
    const val = this.get("free_product_reward_threshold");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) <= 0) {
      return 200;
    }
    return Math.floor(Number(val));
  },

  setFreeProductRewardThreshold(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value <= 0) {
      throw new Error("Free product reward threshold must be a positive integer greater than zero.");
    }
    const intVal = Math.floor(value);
    this.set("free_product_reward_threshold", String(intVal));
    return intVal;
  },

  getRewardsEnabled(): boolean {
    const val = this.get("rewards_enabled");
    if (val === null || val === undefined) return true;
    return val !== "false" && val !== "0";
  },

  setRewardsEnabled(value: boolean): boolean {
    this.set("rewards_enabled", value ? "true" : "false");
    return value;
  }
};

export function checkOrderCodEligibility(
  items: Array<{ productId: string; quantity?: number; packSize?: string }>,
  subtotal: number,
  discountAmount = 0
): {
  isEligible: boolean;
  minimumCodOrderValue: number;
  eligibleSubtotal: number;
  reason?: string;
  ineligibleProducts: Array<{ id: string; nameEn: string; sku: string }>;
} {
  const minCod = siteContentRepo.getMinimumCodOrderValue();
  const eligibleSubtotal = Math.max(0, subtotal - discountAmount);
  const ineligibleProducts: Array<{ id: string; nameEn: string; sku: string }> = [];

  for (const it of items) {
    const prod = productsRepo.getById(it.productId);
    if (prod && prod.isCodAvailable === false) {
      ineligibleProducts.push({ id: prod.id, nameEn: prod.nameEn, sku: prod.sku });
    }
  }

  if (ineligibleProducts.length > 0) {
    return {
      isEligible: false,
      minimumCodOrderValue: minCod,
      eligibleSubtotal,
      reason: "Cash on Delivery is unavailable because one or more items in your cart do not support COD.",
      ineligibleProducts,
    };
  }

  if (eligibleSubtotal < minCod) {
    return {
      isEligible: false,
      minimumCodOrderValue: minCod,
      eligibleSubtotal,
      reason: `Cash on Delivery is available for orders of ₹${minCod} or more.`,
      ineligibleProducts: [],
    };
  }

  return {
    isEligible: true,
    minimumCodOrderValue: minCod,
    eligibleSubtotal,
    ineligibleProducts: [],
  };
}

// ==========================================
// 8. TELEGRAM ADMIN & AUDIT REPOSITORY
// ==========================================
export const telegramRepo = {
  isAllowed(telegramId: string): boolean {
    const db = getDatabase();
    const cleanId = String(telegramId).trim();
    // Also check env allowlist
    const envAdmins = [
      ...(process.env.TELEGRAM_ALLOWED_ADMIN_IDS || "").split(","),
      ...(process.env.TELEGRAM_ADMIN_IDS || "").split(","),
    ].map((s) => s.trim()).filter(Boolean);
    if (envAdmins.includes(cleanId)) return true;

    const row = db.prepare("SELECT * FROM telegram_allowed_admins WHERE telegramId = ?").get(cleanId);
    return Boolean(row);
  },

  getAllAllowedIds(): string[] {
    const db = getDatabase();
    const envAdmins = [
      ...(process.env.TELEGRAM_ALLOWED_ADMIN_IDS || "").split(","),
      ...(process.env.TELEGRAM_ADMIN_IDS || "").split(","),
    ].map((s) => s.trim()).filter(Boolean);
    const dbAdmins = db.prepare("SELECT telegramId FROM telegram_allowed_admins").all() as { telegramId: string }[];
    const set = new Set([...envAdmins, ...dbAdmins.map((d) => String(d.telegramId).trim())]);
    return Array.from(set).filter(Boolean);
  },

  logAudit(telegramUserId: string, command: string, details?: string) {
    const db = getDatabase();
    const id = "tga_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO telegram_audit_logs (id, telegramUserId, command, details, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, String(telegramUserId), command, details || "", new Date().toISOString());
  },

  getAllAdmins() {
    const db = getDatabase();
    return db.prepare("SELECT * FROM telegram_allowed_admins ORDER BY createdAt DESC").all() as any[];
  },

  addAdmin(telegramId: string, name: string, role = "SUPER_ADMIN", addedBy = "Admin") {
    const db = getDatabase();
    const id = "tga_usr_" + Date.now();
    db.prepare(`
      INSERT OR REPLACE INTO telegram_allowed_admins (id, telegramId, name, role, addedBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, String(telegramId).trim(), name, role, addedBy, new Date().toISOString());
    return db.prepare("SELECT * FROM telegram_allowed_admins WHERE id = ?").get(id);
  },

  removeAdmin(telegramId: string) {
    const db = getDatabase();
    const res = db.prepare("DELETE FROM telegram_allowed_admins WHERE telegramId = ?").run(String(telegramId).trim());
    return res.changes > 0;
  },

  getAuditLogs(limit = 50) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM telegram_audit_logs ORDER BY createdAt DESC LIMIT ?").all(limit) as any[];
  }
};

// ==========================================
// 8B. PRODUCT IMAGES REPOSITORY
// ==========================================
export const imagesRepo = {
  getByProductId(productId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM product_images WHERE productId = ? ORDER BY isPrimary DESC, sortOrder ASC, createdAt DESC").all(productId) as any[];
  },

  setPrimary(productId: string, imageId: string) {
    const db = getDatabase();
    db.prepare("UPDATE product_images SET isPrimary = 0 WHERE productId = ?").run(productId);
    db.prepare("UPDATE product_images SET isPrimary = 1 WHERE id = ?").run(imageId);
    const img = db.prepare("SELECT url FROM product_images WHERE id = ?").get(imageId) as any;
    if (img) {
      db.prepare("UPDATE products SET primaryImage = ?, updatedAt = ? WHERE id = ?").run(img.url, new Date().toISOString(), productId);
    }
    return this.getByProductId(productId);
  },

  add(productId: string, url: string, altText = "", isPrimary = false) {
    const db = getDatabase();
    const id = "img_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    if (isPrimary) {
      db.prepare("UPDATE product_images SET isPrimary = 0 WHERE productId = ?").run(productId);
      db.prepare("UPDATE products SET primaryImage = ?, updatedAt = ? WHERE id = ?").run(url, now, productId);
    }
    db.prepare(`
      INSERT INTO product_images (id, productId, url, altText, isPrimary, sortOrder, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, productId, url, altText, isPrimary ? 1 : 0, now);

    const allImgs = db.prepare("SELECT url FROM product_images WHERE productId = ?").all(productId) as any[];
    db.prepare("UPDATE products SET gallery = ?, updatedAt = ? WHERE id = ?").run(JSON.stringify(allImgs.map((i) => i.url)), now, productId);

    return this.getByProductId(productId);
  },

  delete(productId: string, imageId: string) {
    const db = getDatabase();
    const img = db.prepare("SELECT * FROM product_images WHERE id = ?").get(imageId) as any;
    db.prepare("DELETE FROM product_images WHERE id = ?").run(imageId);

    if (img && img.isPrimary) {
      const nextImg = db.prepare("SELECT * FROM product_images WHERE productId = ? LIMIT 1").get(productId) as any;
      if (nextImg) {
        db.prepare("UPDATE product_images SET isPrimary = 1 WHERE id = ?").run(nextImg.id);
        db.prepare("UPDATE products SET primaryImage = ? WHERE id = ?").run(nextImg.url, productId);
      }
    }

    const allImgs = db.prepare("SELECT url FROM product_images WHERE productId = ?").all(productId) as any[];
    db.prepare("UPDATE products SET gallery = ? WHERE id = ?").run(JSON.stringify(allImgs.map((i) => i.url)), productId);

    return this.getByProductId(productId);
  },

  updateAlt(imageId: string, altText: string) {
    const db = getDatabase();
    db.prepare("UPDATE product_images SET altText = ? WHERE id = ?").run(altText, imageId);
    return db.prepare("SELECT * FROM product_images WHERE id = ?").get(imageId);
  }
};

// ==========================================
// 8C. INVENTORY REPOSITORY
// ==========================================
export const inventoryRepo = {
  list(options: { search?: string; status?: string; limit?: number; offset?: number } = {}) {
    const db = getDatabase();
    let query = `
      SELECT p.id as productId, p.sku, p.nameEn, p.nameTa, p.sellingPrice, p.mrp,
             p.stock, p.stockAvailability, c.name as categoryName,
             COALESCE(i.lowStockThreshold, 10) as lowStockThreshold,
             COALESCE(i.reorderQuantity, 50) as reorderQuantity
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      LEFT JOIN inventory i ON p.id = i.productId
      WHERE p.status != 'Archived'
    `;
    const params: any[] = [];
    if (options.search) {
      query += " AND (p.nameEn LIKE ? OR p.sku LIKE ? OR p.nameTa LIKE ?)";
      const term = `%${options.search}%`;
      params.push(term, term, term);
    }
    if (options.status === "low_stock") {
      query += " AND p.stock <= 10";
    } else if (options.status === "out_of_stock") {
      query += " AND p.stock <= 0";
    }
    query += " ORDER BY p.stock ASC LIMIT ? OFFSET ?";
    params.push(options.limit || 100, options.offset || 0);
    return db.prepare(query).all(...params) as any[];
  },

  updateStock(productId: string, newStock: number, reason?: string, updatedBy = "Admin") {
    const db = getDatabase();
    const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
    if (!prod) throw new Error("Product not found");
    const oldStock = prod.stock;
    const availability = newStock > 0 ? "In Stock" : "Out of Stock";
    const now = new Date().toISOString();

    db.prepare("UPDATE products SET stock = ?, stockAvailability = ?, updatedAt = ? WHERE id = ?")
      .run(newStock, availability, now, productId);
    db.prepare(`
      INSERT INTO inventory (id, productId, sku, stockQuantity, lowStockThreshold, reorderQuantity, updatedAt)
      VALUES (?, ?, ?, ?, 10, 50, ?)
      ON CONFLICT(id) DO UPDATE SET stockQuantity = excluded.stockQuantity, updatedAt = excluded.updatedAt
    `).run(`inv_${productId}`, productId, prod.sku, newStock, now);

    auditLogsRepo.log(updatedBy, "STOCK_UPDATE", `Updated ${prod.sku} stock from ${oldStock} to ${newStock}. Reason: ${reason || "Manual adjustment"}`);
    handleStockChangeAlert(productId, newStock).catch(() => {});
    return { success: true, oldStock, newStock, availability };
  },

  adjustStock(
    productId: string,
    variantId: string | null,
    delta: number,
    changeType: string,
    referenceId?: string,
    reason?: string,
    actor = "System"
  ) {
    const db = getDatabase();
    const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
    if (!prod) throw new Error(`Product not found: ${productId}`);

    const oldStock = prod.stock;
    const newStock = Math.max(0, oldStock + delta);
    const availability = newStock > 0 ? (newStock <= 10 ? "Low Stock" : "In Stock") : "Out of Stock";
    const now = new Date().toISOString();

    db.prepare("UPDATE products SET stock = ?, stockAvailability = ?, updatedAt = ? WHERE id = ?")
      .run(newStock, availability, now, productId);

    db.prepare(`
      INSERT INTO inventory (id, productId, sku, stockQuantity, lowStockThreshold, reorderQuantity, updatedAt)
      VALUES (?, ?, ?, ?, 10, 50, ?)
      ON CONFLICT(id) DO UPDATE SET stockQuantity = excluded.stockQuantity, updatedAt = excluded.updatedAt
    `).run(`inv_${productId}`, productId, prod.sku, newStock, now);

    auditLogsRepo.log(
      actor,
      `STOCK_${changeType || "ADJUST"}`,
      `Adjusted ${prod.sku} stock by ${delta} (${oldStock} -> ${newStock}). Ref: ${referenceId || "N/A"}. Reason: ${reason || "Inventory adjustment"}`
    );
    handleStockChangeAlert(productId, newStock).catch(() => {});
    return { productId, oldStock, newStock, delta, availability };
  }
};

// ==========================================
// 8D. AUDIT LOGS REPOSITORY
// ==========================================
export const auditLogsRepo = {
  log(user: string, action: string, details: string) {
    const db = getDatabase();
    const id = "audit_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO telegram_audit_logs (id, telegramUserId, command, details, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user, action, details, new Date().toISOString());
  },

  list(limit = 100) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM telegram_audit_logs ORDER BY createdAt DESC LIMIT ?").all(limit) as any[];
  }
};

// ==========================================
// 9. ADMIN DASHBOARD STATS REPOSITORY
// ==========================================
export const adminStatsRepo = {
  getOverview() {
    const db = getDatabase();
    const totalProducts = (db.prepare("SELECT COUNT(*) as count FROM products").get() as any)?.count || 0;
    const activeProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'Published'").get() as any)?.count || 0;
    const draftProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'Draft'").get() as any)?.count || 0;
    const lowStockProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= 10").get() as any)?.count || 0;

    const totalCategories = (db.prepare("SELECT COUNT(*) as count FROM categories").get() as any)?.count || 0;
    const totalCustomers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'").get() as any)?.count || 0;

    const totalOrders = (db.prepare("SELECT COUNT(*) as count FROM orders").get() as any)?.count || 0;
    const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE orderStatus IN ('Pending Payment', 'Confirmed', 'Processing')").get() as any)?.count || 0;
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE orderStatus = 'Delivered'").get() as any)?.count || 0;

    const revenueResult = db.prepare("SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE paymentStatus = 'PAID'").get() as any;
    const totalRevenue = revenueResult?.totalRevenue || 0;

    const activeCampaigns = (db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE isActive = 1").get() as any)?.count || 0;
    const recentOrders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 5").all() as any[];

    const lowStockAlerts = db.prepare(`
      SELECT p.id, p.sku, p.nameEn, p.nameTa, p.stock, p.primaryImage, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.stock <= 10 AND p.status != 'Archived'
      ORDER BY p.stock ASC
      LIMIT 10
    `).all() as any[];

    const recentlyUpdatedProducts = db.prepare(`
      SELECT p.id, p.sku, p.nameEn, p.nameTa, p.sellingPrice, p.stock, p.status, p.updatedAt
      FROM products p
      ORDER BY p.updatedAt DESC
      LIMIT 5
    `).all() as any[];

    const activePromotionSummary = db.prepare(`
      SELECT id, name, code, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, isActive
      FROM campaigns
      WHERE isActive = 1
      ORDER BY createdAt DESC
      LIMIT 5
    `).all() as any[];

    return {
      totalProducts,
      activeProducts,
      draftProducts,
      totalCategories,
      totalCustomers,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      activeCampaigns,
      recentOrders: recentOrders.map((o) => ordersRepo.enrichOrder(o)),
      lowStockAlerts,
      recentlyUpdatedProducts,
      activePromotionSummary,
    };
  }
};

// ==========================================
// 15. B2B / BUSINESS BULK ENQUIRIES REPOSITORY
// ==========================================
export const businessEnquiriesRepo = {
  create(data: {
    contactName: string;
    companyName: string;
    email: string;
    phone: string;
    buyerType: string;
    deliveryCity: string;
    deliveryState: string;
    requirements?: string;
    gstNumber?: string;
    items?: Array<{
      productId?: string;
      sku: string;
      productName: string;
      quantity: number;
      unit?: string;
      targetPrice?: number;
    }>;
  }) {
    const db = getDatabase();
    const id = "enq_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    
    // Generate sequential enquiry number: ENQ-10001+
    const countRow = db.prepare("SELECT COUNT(*) as count FROM business_enquiries").get() as { count: number };
    const enquiryNumber = `ENQ-${10001 + (countRow?.count || 0)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO business_enquiries (
        id, enquiryNumber, contactName, companyName, email, phone, buyerType,
        deliveryCity, deliveryState, requirements, gstNumber, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?)
    `).run(
      id,
      enquiryNumber,
      data.contactName.trim(),
      data.companyName.trim(),
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.buyerType || "Retailer",
      data.deliveryCity.trim(),
      data.deliveryState.trim(),
      data.requirements?.trim() || null,
      data.gstNumber?.trim().toUpperCase() || null,
      now,
      now
    );

    if (data.items && data.items.length > 0) {
      const insertItem = db.prepare(`
        INSERT INTO business_enquiry_items (
          id, enquiryId, productId, sku, productName, quantity, unit, targetPrice, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of data.items) {
        const itemId = "eni_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
        insertItem.run(
          itemId,
          id,
          item.productId || null,
          item.sku,
          item.productName,
          Number(item.quantity) || 1,
          item.unit || "kg",
          item.targetPrice ? Number(item.targetPrice) : null,
          now
        );
      }
    }

    return this.getById(id);
  },

  getById(id: string) {
    const db = getDatabase();
    const enquiry = db.prepare("SELECT * FROM business_enquiries WHERE id = ?").get(id) as any;
    if (!enquiry) return null;
    const items = db.prepare("SELECT * FROM business_enquiry_items WHERE enquiryId = ? ORDER BY createdAt ASC").all(id) as any[];
    return { ...enquiry, items };
  },

  getByEnquiryNumber(enquiryNumber: string) {
    const db = getDatabase();
    const enquiry = db.prepare("SELECT * FROM business_enquiries WHERE enquiryNumber = ?").get(enquiryNumber) as any;
    if (!enquiry) return null;
    const items = db.prepare("SELECT * FROM business_enquiry_items WHERE enquiryId = ? ORDER BY createdAt ASC").all(enquiry.id) as any[];
    return { ...enquiry, items };
  },

  list(params: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const db = getDatabase();
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    let query = "SELECT * FROM business_enquiries WHERE 1=1";
    const args: any[] = [];

    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      query += " AND (enquiryNumber LIKE ? OR companyName LIKE ? OR contactName LIKE ? OR phone LIKE ? OR email LIKE ?)";
      args.push(s, s, s, s, s);
    }

    if (params.status && params.status !== "All") {
      query += " AND status = ?";
      args.push(params.status);
    }

    query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    args.push(limit, offset);

    const enquiries = db.prepare(query).all(...args) as any[];

    // Fetch total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM business_enquiries WHERE 1=1";
    const countArgs: any[] = [];
    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      countQuery += " AND (enquiryNumber LIKE ? OR companyName LIKE ? OR contactName LIKE ? OR phone LIKE ? OR email LIKE ?)";
      countArgs.push(s, s, s, s, s);
    }
    if (params.status && params.status !== "All") {
      countQuery += " AND status = ?";
      countArgs.push(params.status);
    }
    const countRow = db.prepare(countQuery).get(...countArgs) as { total: number };

    // Attach items to each enquiry
    const getItems = db.prepare("SELECT * FROM business_enquiry_items WHERE enquiryId = ?");
    const enriched = enquiries.map((enq) => ({
      ...enq,
      items: getItems.all(enq.id) as any[],
    }));

    return {
      enquiries: enriched,
      total: countRow?.total || 0,
      limit,
      offset,
    };
  },

  updateStatus(id: string, status: string, internalNotes?: string, assignedTo?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    let query = "UPDATE business_enquiries SET status = ?, updatedAt = ?";
    const args: any[] = [status, now];

    if (internalNotes !== undefined) {
      query += ", internalNotes = ?";
      args.push(internalNotes);
    }
    if (assignedTo !== undefined) {
      query += ", assignedTo = ?";
      args.push(assignedTo);
    }

    query += " WHERE id = ?";
    args.push(id);

    db.prepare(query).run(...args);
    return this.getById(id);
  },

  exportCsv() {
    const db = getDatabase();
    const enquiries = db.prepare("SELECT * FROM business_enquiries ORDER BY createdAt DESC").all() as any[];
    const itemsStmt = db.prepare("SELECT * FROM business_enquiry_items WHERE enquiryId = ?");

    const header = [
      "Enquiry Number",
      "Date",
      "Status",
      "Company Name",
      "Contact Person",
      "Phone",
      "Email",
      "Buyer Type",
      "GSTIN",
      "City",
      "State",
      "Requested Items",
      "Requirements",
      "Internal Notes",
    ];

    const rows = enquiries.map((enq) => {
      const items = itemsStmt.all(enq.id) as any[];
      const itemsSummary = items.map((i: any) => `${i.productName} (${i.sku}): ${i.quantity} ${i.unit}`).join(" | ");
      return [
        enq.enquiryNumber,
        enq.createdAt,
        enq.status,
        `"${(enq.companyName || "").replace(/"/g, '""')}"`,
        `"${(enq.contactName || "").replace(/"/g, '""')}"`,
        enq.phone,
        enq.email,
        enq.buyerType,
        enq.gstNumber || "N/A",
        `"${(enq.deliveryCity || "").replace(/"/g, '""')}"`,
        `"${(enq.deliveryState || "").replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        `"${(enq.requirements || "").replace(/"/g, '""')}"`,
        `"${(enq.internalNotes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    return [header.join(","), ...rows].join("\n");
  },
};

// ==========================================
// 14. AUTH OTPS REPOSITORY
// ==========================================
export const authOtpsRepo = {
  create(phone: string, otpHash: string, purpose = "LOGIN", ttlSeconds = 300) {
    const db = getDatabase();
    const id = "otp_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    const nowIso = now.toISOString();

    // Invalidate any active, unverified OTPs for this phone and purpose
    db.prepare(`
      UPDATE auth_otps
      SET expires_at = ?
      WHERE phone = ? AND purpose = ? AND verified_at IS NULL
    `).run(nowIso, phone, purpose);

    db.prepare(`
      INSERT INTO auth_otps (id, phone, otp_hash, purpose, expires_at, attempts, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NULL, ?)
    `).run(id, phone, otpHash, purpose, expiresAt, nowIso);

    return this.getById(id);
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM auth_otps WHERE id = ?").get(id) as any;
  },

  getLatestActive(phone: string, purpose = "LOGIN") {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    return db.prepare(`
      SELECT * FROM auth_otps
      WHERE phone = ? AND purpose = ? AND verified_at IS NULL AND expires_at > ? AND attempts < 5
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, purpose, nowIso) as any;
  },

  incrementAttempts(id: string) {
    const db = getDatabase();
    db.prepare("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?").run(id);
    return this.getById(id);
  },

  markVerified(id: string) {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    db.prepare("UPDATE auth_otps SET verified_at = ? WHERE id = ?").run(nowIso, id);
    return this.getById(id);
  },

  getLastRequestTime(phone: string, purpose = "LOGIN") {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT created_at FROM auth_otps
      WHERE phone = ? AND purpose = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, purpose) as { created_at: string } | undefined;
    return row ? new Date(row.created_at).getTime() : 0;
  },

  countRecentRequests(phone: string, windowSeconds = 600) {
    const db = getDatabase();
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM auth_otps
      WHERE phone = ? AND created_at > ?
    `).get(phone, since) as { count: number };
    return row ? row.count : 0;
  },
};



// ==========================================
// 15. SUPPORT TICKETS & HELPDESK REPOSITORY
// ==========================================
export const ticketsRepo = {
  generateTicketNumber(): string {
    const db = getDatabase();
    const year = new Date().getFullYear();
    const prefix = `TRN-SUP-${year}-`;
    const row = db.prepare(`
      SELECT count(*) as count FROM support_tickets WHERE ticket_number LIKE ?
    `).get(`${prefix}%`) as { count: number };
    const nextSeq = (row?.count || 0) + 1;
    return `${prefix}${String(nextSeq).padStart(5, "0")}`;
  },

  create(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    orderId?: string | null;
    orderNumber?: string | null;
    category: string;
    subject: string;
    description: string;
    priority?: string;
  }) {
    const db = getDatabase();
    const id = "tic_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const ticketNumber = this.generateTicketNumber();
    const now = new Date().toISOString();
    const priority = data.priority || "Normal";
    const status = "Open";

    db.prepare(`
      INSERT INTO support_tickets (
        id, ticket_number, customer_id, customer_name, customer_email, customer_phone,
        order_id, order_number, category, subject, description, priority, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ticketNumber,
      data.customerId,
      data.customerName,
      data.customerEmail,
      data.customerPhone || null,
      data.orderId || null,
      data.orderNumber || null,
      data.category,
      data.subject,
      data.description,
      priority,
      status,
      now,
      now
    );

    // Initial message
    const msgId = "tmsg_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    db.prepare(`
      INSERT INTO support_ticket_messages (
        id, ticket_id, sender_type, sender_id, sender_name, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(msgId, id, "CUSTOMER", data.customerId, data.customerName, data.description, now);

    // Audit log
    const logId = "tlog_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    db.prepare(`
      INSERT INTO support_ticket_audit_logs (
        id, ticket_id, action, performed_by, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, id, "CREATED", data.customerName, `Ticket opened under category '${data.category}' with priority '${priority}'`, now);

    return this.getById(id)!;
  },

  getById(id: string, customerId?: string) {
    const db = getDatabase();
    if (customerId) {
      return db.prepare("SELECT * FROM support_tickets WHERE id = ? AND customer_id = ?").get(id, customerId) as any;
    }
    return db.prepare("SELECT * FROM support_tickets WHERE id = ?").get(id) as any;
  },

  getByTicketNumber(ticketNumber: string, customerId?: string) {
    const db = getDatabase();
    if (customerId) {
      return db.prepare("SELECT * FROM support_tickets WHERE ticket_number = ? AND customer_id = ?").get(ticketNumber, customerId) as any;
    }
    return db.prepare("SELECT * FROM support_tickets WHERE ticket_number = ?").get(ticketNumber) as any;
  },

  listByCustomer(customerId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY created_at DESC").all(customerId) as any[];
  },

  listAll(filters: { status?: string; priority?: string; category?: string; search?: string } = {}) {
    const db = getDatabase();
    let query = "SELECT * FROM support_tickets WHERE 1=1";
    const params: any[] = [];

    if (filters.status && filters.status !== "ALL") {
      query += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.priority && filters.priority !== "ALL") {
      query += " AND priority = ?";
      params.push(filters.priority);
    }
    if (filters.category && filters.category !== "ALL") {
      query += " AND category = ?";
      params.push(filters.category);
    }
    if (filters.search) {
      query += " AND (ticket_number LIKE ? OR subject LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR order_number LIKE ?)";
      const term = `%${filters.search}%`;
      params.push(term, term, term, term, term);
    }

    query += " ORDER BY created_at DESC";
    return db.prepare(query).all(...params) as any[];
  },

  getMessages(ticketId: string, customerId?: string) {
    const db = getDatabase();
    if (customerId) {
      const ticket = this.getById(ticketId, customerId);
      if (!ticket) return null;
    }
    return db.prepare("SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(ticketId) as any[];
  },

  addMessage(data: {
    ticketId: string;
    senderType: "CUSTOMER" | "ADMIN" | "SYSTEM";
    senderId: string;
    senderName: string;
    message: string;
    attachmentReference?: string | null;
  }) {
    const db = getDatabase();
    const id = "tmsg_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO support_ticket_messages (
        id, ticket_id, sender_type, sender_id, sender_name, message, attachment_reference, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.ticketId,
      data.senderType,
      data.senderId,
      data.senderName,
      data.message,
      data.attachmentReference || null,
      now
    );

    // Update ticket updated_at and conditionally adjust status
    const ticket = this.getById(data.ticketId);
    let newStatus = ticket?.status;
    if (data.senderType === "CUSTOMER") {
      if (ticket?.status === "Waiting for Customer" || ticket?.status === "Resolved") {
        newStatus = "Open";
      }
    } else if (data.senderType === "ADMIN") {
      if (ticket?.status === "Open") {
        newStatus = "Waiting for Customer";
      }
    }

    db.prepare(`
      UPDATE support_tickets
      SET updated_at = ?, status = ?
      WHERE id = ?
    `).run(now, newStatus, data.ticketId);

    // Audit log
    const logId = "tlog_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    db.prepare(`
      INSERT INTO support_ticket_audit_logs (
        id, ticket_id, action, performed_by, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, data.ticketId, data.senderType === "ADMIN" ? "ADMIN_REPLY" : "CUSTOMER_REPLY", data.senderName, `Message sent by ${data.senderType}`, now);

    return db.prepare("SELECT * FROM support_ticket_messages WHERE id = ?").get(id) as any;
  },

  updateStatus(ticketId: string, status: string, performedBy: string, notes?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const isResolved = status === "Resolved" || status === "Closed";
    const resolvedAt = isResolved ? now : null;

    db.prepare(`
      UPDATE support_tickets
      SET status = ?, resolved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(status, resolvedAt, now, ticketId);

    const logId = "tlog_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    db.prepare(`
      INSERT INTO support_ticket_audit_logs (
        id, ticket_id, action, performed_by, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, ticketId, "STATUS_CHANGE", performedBy, `Status updated to '${status}'${notes ? ` (${notes})` : ""}`, now);

    return this.getById(ticketId);
  },

  updatePriority(ticketId: string, priority: string, performedBy: string) {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE support_tickets
      SET priority = ?, updated_at = ?
      WHERE id = ?
    `).run(priority, now, ticketId);

    const logId = "tlog_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    db.prepare(`
      INSERT INTO support_ticket_audit_logs (
        id, ticket_id, action, performed_by, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, ticketId, "PRIORITY_CHANGE", performedBy, `Priority changed to '${priority}'`, now);

    return this.getById(ticketId);
  },

  assignAdmin(ticketId: string, adminId: string, adminName: string, performedBy: string) {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE support_tickets
      SET assigned_admin_id = ?, assigned_admin_name = ?, updated_at = ?
      WHERE id = ?
    `).run(adminId, adminName, now, ticketId);

    const logId = "tlog_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    db.prepare(`
      INSERT INTO support_ticket_audit_logs (
        id, ticket_id, action, performed_by, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(logId, ticketId, "ASSIGNED", performedBy, `Assigned to admin '${adminName}'`, now);

    return this.getById(ticketId);
  },

  getAuditLogs(ticketId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM support_ticket_audit_logs WHERE ticket_id = ? ORDER BY created_at DESC").all(ticketId) as any[];
  },

  getMetrics() {
    const db = getDatabase();
    const totalRow = db.prepare("SELECT count(*) as count FROM support_tickets").get() as { count: number };
    const openRow = db.prepare("SELECT count(*) as count FROM support_tickets WHERE status = 'Open'").get() as { count: number };
    const inProgressRow = db.prepare("SELECT count(*) as count FROM support_tickets WHERE status = 'In Progress'").get() as { count: number };
    const waitingRow = db.prepare("SELECT count(*) as count FROM support_tickets WHERE status = 'Waiting for Customer'").get() as { count: number };
    const resolvedRow = db.prepare("SELECT count(*) as count FROM support_tickets WHERE status IN ('Resolved', 'Closed')").get() as { count: number };
    const urgentRow = db.prepare("SELECT count(*) as count FROM support_tickets WHERE priority = 'Urgent' AND status NOT IN ('Resolved', 'Closed')").get() as { count: number };

    // Average resolution time in hours for resolved tickets
    const resolvedTickets = db.prepare("SELECT created_at, resolved_at FROM support_tickets WHERE resolved_at IS NOT NULL").all() as { created_at: string; resolved_at: string }[];
    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalMs = resolvedTickets.reduce((acc, t) => {
        const c = new Date(t.created_at).getTime();
        const r = new Date(t.resolved_at).getTime();
        return acc + Math.max(0, r - c);
      }, 0);
      avgResolutionHours = Math.round((totalMs / resolvedTickets.length / (1000 * 60 * 60)) * 10) / 10;
    }

    return {
      total: totalRow?.count || 0,
      open: openRow?.count || 0,
      inProgress: inProgressRow?.count || 0,
      waiting: waitingRow?.count || 0,
      resolved: resolvedRow?.count || 0,
      urgent: urgentRow?.count || 0,
      avgResolutionHours,
    };
  },
};

// ==========================================
// 16. CUSTOMER FEEDBACK REPOSITORY
// ==========================================
export const feedbackRepo = {
  create(data: {
    customerId?: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    category: string;
    rating: number;
    title: string;
    message: string;
    orderId?: string | null;
    orderNumber?: string | null;
    productId?: string | null;
  }) {
    const db = getDatabase();
    const id = "fb_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    const rating = Math.max(1, Math.min(5, Math.round(data.rating)));

    db.prepare(`
      INSERT INTO customer_feedback (
        id, customer_id, customer_name, customer_email, customer_phone,
        category, rating, title, message, order_id, order_number, product_id,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW', ?, ?)
    `).run(
      id,
      data.customerId || null,
      data.customerName,
      data.customerEmail,
      data.customerPhone || null,
      data.category,
      rating,
      data.title,
      data.message,
      data.orderId || null,
      data.orderNumber || null,
      data.productId || null,
      now,
      now
    );

    return this.getById(id);
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM customer_feedback WHERE id = ?").get(id) as any;
  },

  listByCustomer(customerId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM customer_feedback WHERE customer_id = ? ORDER BY created_at DESC").all(customerId) as any[];
  },

  listAll(filters: { category?: string; rating?: number; status?: string; search?: string } = {}) {
    const db = getDatabase();
    let query = "SELECT * FROM customer_feedback WHERE 1=1";
    const params: any[] = [];

    if (filters.category && filters.category !== "ALL") {
      query += " AND category = ?";
      params.push(filters.category);
    }
    if (filters.rating) {
      query += " AND rating = ?";
      params.push(filters.rating);
    }
    if (filters.status && filters.status !== "ALL") {
      query += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.search) {
      query += " AND (title LIKE ? OR message LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)";
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY created_at DESC";
    return db.prepare(query).all(...params) as any[];
  },

  respond(id: string, response: string, internalNotes?: string) {
    const db = getDatabase();
    const fb = this.getById(id);
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customer_feedback
      SET admin_response = ?, admin_responded_at = ?, internal_notes = ?, status = 'REVIEWED', updated_at = ?
      WHERE id = ?
    `).run(response, now, internalNotes || null, now, id);

    if (fb && fb.customer_id) {
      try {
        const enabled = siteContentRepo.getRewardsEnabled();
        const pts = siteContentRepo.getFeedbackRewardPoints();
        if (enabled && pts > 0) {
          rewardsRepo.awardPoints({
            customerId: fb.customer_id,
            type: "FEEDBACK_EARNED",
            points: pts,
            referenceType: "FEEDBACK",
            referenceId: id,
            description: `Reward points for customer feedback: ${fb.title || fb.category || "Feedback"}`,
            actor: "Admin",
          });
        }
      } catch (rewardErr) {
        console.error("[Rewards] Failed to award feedback points:", rewardErr);
      }
    }
    return this.getById(id);
  },
};

// ==========================================
// 17. PRODUCT REVIEWS REPOSITORY
// ==========================================
export const reviewsRepo = {
  isVerifiedPurchase(customerId: string, productId: string): boolean {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT oi.id
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      WHERE o.customerId = ? AND oi.productId = ? AND (o.paymentStatus = 'PAID' OR o.orderStatus IN ('Delivered', 'Confirmed', 'Processing', 'Shipped'))
      LIMIT 1
    `).get(customerId, productId) as any;
    return Boolean(row);
  },

  create(data: {
    productId: string;
    customerId: string;
    customerName: string;
    rating: number;
    title: string;
    review: string;
  }) {
    const db = getDatabase();
    const id = "rev_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    const rating = Math.max(1, Math.min(5, Math.round(data.rating)));
    const isVerified = this.isVerifiedPurchase(data.customerId, data.productId) ? 1 : 0;

    db.prepare(`
      INSERT INTO product_reviews (
        id, product_id, customer_id, customer_name, rating, title, review,
        is_verified_purchase, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(
      id,
      data.productId,
      data.customerId,
      data.customerName,
      rating,
      data.title,
      data.review,
      isVerified,
      now,
      now
    );

    return this.getById(id);
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM product_reviews WHERE id = ?").get(id) as any;
  },

  listByProduct(productId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM product_reviews
      WHERE product_id = ? AND status = 'APPROVED'
      ORDER BY created_at DESC
    `).all(productId) as any[];
  },

  listByCustomer(customerId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM product_reviews WHERE customer_id = ? ORDER BY created_at DESC").all(customerId) as any[];
  },

  listAll(filters: { status?: string; productId?: string; search?: string } = {}) {
    const db = getDatabase();
    let query = "SELECT pr.*, p.nameEn as productName, p.sku FROM product_reviews pr LEFT JOIN products p ON p.id = pr.product_id WHERE 1=1";
    const params: any[] = [];

    if (filters.status && filters.status !== "ALL") {
      query += " AND pr.status = ?";
      params.push(filters.status);
    }
    if (filters.productId) {
      query += " AND pr.product_id = ?";
      params.push(filters.productId);
    }
    if (filters.search) {
      query += " AND (pr.title LIKE ? OR pr.review LIKE ? OR pr.customer_name LIKE ? OR p.nameEn LIKE ?)";
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY pr.created_at DESC";
    return db.prepare(query).all(...params) as any[];
  },

  moderate(id: string, status: "APPROVED" | "REJECTED", adminNotes?: string) {
    const db = getDatabase();
    const review = this.getById(id);
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE product_reviews
      SET status = ?, admin_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(status, adminNotes || null, now, id);

    if (review && review.customer_id) {
      try {
        if (status === "APPROVED") {
          const enabled = siteContentRepo.getRewardsEnabled();
          const pts = siteContentRepo.getFeedbackRewardPoints();
          if (enabled && pts > 0) {
            rewardsRepo.awardPoints({
              customerId: review.customer_id,
              type: "FEEDBACK_EARNED",
              points: pts,
              referenceType: "REVIEW",
              referenceId: id,
              description: `Reward points for approved product review: ${review.title || "Product Review"}`,
              actor: "Admin",
            });
          }
        } else if (status === "REJECTED") {
          rewardsRepo.reversePoints({
            customerId: review.customer_id,
            referenceType: "REVIEW",
            referenceId: id,
            reason: "Review rejected by administrator",
            actor: "Admin",
          });
        }
      } catch (rewardErr) {
        console.error("[Rewards] Failed to process review reward/reversal:", rewardErr);
      }
    }
    return this.getById(id);
  },
};

// ==========================================
// 18. WISHLIST & SAVE FOR LATER REPOSITORY
// ==========================================
export const wishlistRepo = {
  list(userId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        w.id as wishlistId,
        w.created_at as wishlistedAt,
        p.id,
        p.sku,
        p.nameEn,
        p.nameTa,
        p.slug,
        p.sellingPrice,
        p.mrp,
        p.discountPrice,
        p.stockAvailability,
        p.primaryImage,
        p.productType
      FROM wishlist_items w
      JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(userId) as any[];
  },

  getUserWishlistIds(userId: string): string[] {
    const db = getDatabase();
    const rows = db.prepare("SELECT product_id FROM wishlist_items WHERE user_id = ?").all(userId) as { product_id: string }[];
    return rows.map((r) => r.product_id);
  },

  isInWishlist(userId: string, productId: string): boolean {
    const db = getDatabase();
    const row = db.prepare("SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?").get(userId, productId) as any;
    return Boolean(row);
  },

  add(userId: string, productId: string) {
    const db = getDatabase();
    const id = "wsh_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO wishlist_items (id, user_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, productId, now);
    return { success: true, wishlisted: true };
  },

  remove(userId: string, productId: string) {
    const db = getDatabase();
    db.prepare("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?").run(userId, productId);
    return { success: true, wishlisted: false };
  },

  toggle(userId: string, productId: string) {
    if (this.isInWishlist(userId, productId)) {
      this.remove(userId, productId);
      return { wishlisted: false };
    } else {
      this.add(userId, productId);
      return { wishlisted: true };
    }
  },

  moveToCart(userId: string, productId: string, packSize = "100g") {
    // 1. Get or create cart for user
    const db = getDatabase();
    let cart = db.prepare("SELECT id FROM carts WHERE userId = ?").get(userId) as { id: string } | undefined;
    if (!cart) {
      const cartId = "crt_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();
      db.prepare("INSERT INTO carts (id, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?)").run(cartId, userId, now, now);
      cart = { id: cartId };
    }

    // 2. Fetch product price
    const prod = db.prepare("SELECT sellingPrice FROM products WHERE id = ?").get(productId) as { sellingPrice: number } | undefined;
    const unitPrice = prod?.sellingPrice || 100;

    // 3. Add to cart items (increment if exists, else insert)
    const existing = db.prepare("SELECT id, quantity FROM cart_items WHERE cartId = ? AND productId = ? AND packSize = ?").get(cart.id, productId, packSize) as { id: string; quantity: number } | undefined;
    if (existing) {
      db.prepare("UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?").run(existing.id);
    } else {
      const itemId = "ci_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();
      db.prepare("INSERT INTO cart_items (id, cartId, productId, packSize, unitPrice, quantity, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)").run(itemId, cart.id, productId, packSize, unitPrice, now);
    }

    // 4. Remove from wishlist
    this.remove(userId, productId);
    return { success: true };
  },

  saveForLater(userId: string, productId: string, cartItemId?: string) {
    const db = getDatabase();
    // 1. Add to wishlist
    this.add(userId, productId);

    // 2. If cartItemId provided, remove from cart_items
    if (cartItemId) {
      db.prepare("DELETE FROM cart_items WHERE id = ?").run(cartItemId);
    } else {
      // Find user's cart and remove that product
      const cart = db.prepare("SELECT id FROM carts WHERE userId = ?").get(userId) as { id: string } | undefined;
      if (cart) {
        db.prepare("DELETE FROM cart_items WHERE cartId = ? AND productId = ?").run(cart.id, productId);
      }
    }
    return { success: true };
  },
};


// ==========================================
// 8E. LOW STOCK ALERTS REPOSITORY (PHASE 6)
// ==========================================
export const lowStockAlertsRepo = {
  getAlert(productId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM low_stock_alerts WHERE productId = ?").get(productId) as any;
  },

  shouldAlert(productId: string, currentStock: number, threshold: number): boolean {
    if (currentStock > threshold) return false;
    const existing = this.getAlert(productId);
    if (!existing) return true;
    return existing.alertState !== "ALERTED";
  },

  recordAlert(productId: string, sku: string, threshold: number, stock: number) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = "lsa_" + crypto.randomUUID();
    db.prepare(`
      INSERT INTO low_stock_alerts (id, productId, sku, thresholdAtAlert, stockAtAlert, alertState, lastAlertSentAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'ALERTED', ?, ?, ?)
      ON CONFLICT(productId) DO UPDATE SET
        thresholdAtAlert = excluded.thresholdAtAlert,
        stockAtAlert = excluded.stockAtAlert,
        alertState = 'ALERTED',
        lastAlertSentAt = excluded.lastAlertSentAt,
        updatedAt = excluded.updatedAt
    `).run(id, productId, sku, threshold, stock, now, now, now);
  },

  clearAlert(productId: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("UPDATE low_stock_alerts SET alertState = 'CLEARED', updatedAt = ? WHERE productId = ?")
      .run(now, productId);
  },

  list(limit = 100) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM low_stock_alerts ORDER BY updatedAt DESC LIMIT ?").all(limit) as any[];
  }
};

/**
 * Public storefront stock privacy sanitizer (Phase 6)
 * When stock <= threshold: hides exact quantity, exposes 'Limited availability',
 * and for zero stock exposes 'Out of Stock'.
 */
export function sanitizePublicProduct(product: any, threshold?: number) {
  if (!product) return product;
  const thresh = threshold !== undefined ? threshold : siteContentRepo.getLowStockThreshold();
  const currentStock = typeof product.stock === "number" ? product.stock : 0;

  if (currentStock <= 0) {
    return {
      ...product,
      stock: 0,
      stockAvailability: "Out of Stock",
      isOutOfStock: true,
      isLowStock: false,
      sizes: product.sizes?.map((s: any) => ({ ...s, stock: 0 })) || product.sizes,
    };
  }

  if (currentStock <= thresh) {
    return {
      ...product,
      stock: null, // Exact quantity hidden from public users
      stockAvailability: "Limited availability",
      isOutOfStock: false,
      isLowStock: true,
      sizes: product.sizes?.map((s: any) => ({ ...s, stock: null })) || product.sizes,
    };
  }

  return {
    ...product,
    stockAvailability: "In Stock",
    isOutOfStock: false,
    isLowStock: false,
  };
}


let lowStockNotifier: ((prod: any, threshold: number) => Promise<void>) | null = null;

export function registerLowStockNotifier(fn: (prod: any, threshold: number) => Promise<void>) {
  lowStockNotifier = fn;
}

export async function handleStockChangeAlert(productId: string, newStock: number) {
  try {
    const threshold = siteContentRepo.getLowStockThreshold();
    const db = getDatabase();
    const prod = db.prepare("SELECT id, sku, nameEn, nameTa, stock FROM products WHERE id = ?").get(productId) as any;
    if (!prod) return;

    if (newStock <= threshold) {
      if (lowStockAlertsRepo.shouldAlert(productId, newStock, threshold)) {
        lowStockAlertsRepo.recordAlert(productId, prod.sku, threshold, newStock);
        auditLogsRepo.log("System", "LOW_STOCK_ALERT_TRIGGERED", `${prod.sku} stock (${newStock}) is at or below threshold (${threshold})`);
        if (lowStockNotifier) {
          try {
            await lowStockNotifier({ ...prod, stock: newStock }, threshold);
          } catch (notifErr: any) {
            console.error(`[LowStockAlert] Notification error for ${prod.sku}:`, notifErr?.message || notifErr);
            auditLogsRepo.log("System", "TELEGRAM_ALERT_FAILED", `Failed to send low stock alert for ${prod.sku}: ${notifErr?.message || notifErr}`);
          }
        }
      }
    } else {
      // Stock returned above threshold: reset alert state so a future drop alerts again
      const existing = lowStockAlertsRepo.getAlert(productId);
      if (existing && existing.alertState === "ALERTED") {
        lowStockAlertsRepo.clearAlert(productId);
        auditLogsRepo.log("System", "LOW_STOCK_ALERT_CLEARED", `${prod.sku} restocked to ${newStock} (above threshold ${threshold})`);
      }
    }
  } catch (err) {
    console.error("[LowStockAlert] Error in handleStockChangeAlert:", err);
  }
}


// ==========================================
// 21. CUSTOMER REWARDS & LOYALTY REPOSITORY (PHASE 7)
// ==========================================
export const rewardsRepo = {
  getSettings() {
    return {
      rewardsEnabled: siteContentRepo.getRewardsEnabled(),
      feedbackRewardPoints: siteContentRepo.getFeedbackRewardPoints(),
      freeProductRewardThreshold: siteContentRepo.getFreeProductRewardThreshold(),
    };
  },

  setSettings(settings: {
    rewardsEnabled?: boolean;
    feedbackRewardPoints?: number;
    freeProductRewardThreshold?: number;
  }) {
    if (settings.rewardsEnabled !== undefined) {
      siteContentRepo.setRewardsEnabled(settings.rewardsEnabled);
    }
    if (settings.feedbackRewardPoints !== undefined) {
      siteContentRepo.setFeedbackRewardPoints(settings.feedbackRewardPoints);
    }
    if (settings.freeProductRewardThreshold !== undefined) {
      siteContentRepo.setFreeProductRewardThreshold(settings.freeProductRewardThreshold);
    }
    return this.getSettings();
  },

  getBalance(customerId: string) {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT transactionType, points
      FROM customer_reward_transactions
      WHERE customerId = ?
    `).all(customerId) as Array<{ transactionType: string; points: number }>;

    let balance = 0;
    let totalEarned = 0;
    let totalRedeemed = 0;

    for (const row of rows) {
      balance += row.points;
      if (row.points > 0) {
        totalEarned += row.points;
      } else if (row.points < 0) {
        totalRedeemed += Math.abs(row.points);
      }
    }

    const threshold = siteContentRepo.getFreeProductRewardThreshold();
    const rewardsEnabled = siteContentRepo.getRewardsEnabled();
    const canRedeem = rewardsEnabled && balance >= threshold;
    const pointsToNextReward = balance >= threshold ? 0 : threshold - balance;

    return {
      customerId,
      balance: Math.max(0, balance),
      totalEarned,
      totalRedeemed,
      freeProductRewardThreshold: threshold,
      pointsToNextReward,
      canRedeem,
      rewardsEnabled,
    };
  },

  getTransactions(customerId: string, limit = 50) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM customer_reward_transactions
      WHERE customerId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).all(customerId, limit) as any[];
  },

  awardPoints(params: {
    customerId: string;
    type: "FEEDBACK_EARNED" | "ADMIN_CREDIT";
    points: number;
    referenceType?: string;
    referenceId?: string;
    description: string;
    actor?: string;
  }) {
    const db = getDatabase();

    // Check if rewards program is enabled (unless admin manual credit)
    if (params.type === "FEEDBACK_EARNED" && !siteContentRepo.getRewardsEnabled()) {
      return null;
    }

    if (!params.points || params.points <= 0) {
      throw new Error("Points to award must be a positive integer.");
    }

    // Deduplication check: if referenceType and referenceId provided, ensure not already awarded
    if (params.referenceType && params.referenceId) {
      const existing = db.prepare(`
        SELECT id FROM customer_reward_transactions
        WHERE customerId = ? AND referenceType = ? AND referenceId = ? AND transactionType = ?
      `).get(params.customerId, params.referenceType, params.referenceId, params.type) as any;

      if (existing) {
        // Idempotent: already awarded
        return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(existing.id) as any;
      }
    }

    const id = "rtx_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_reward_transactions (
        id, customerId, transactionType, points, referenceType, referenceId,
        description, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.customerId,
      params.type,
      Math.floor(params.points),
      params.referenceType || null,
      params.referenceId || null,
      params.description,
      now,
      params.actor || "System"
    );

    auditLogsRepo.log(
      params.actor || "System",
      "REWARD_POINTS_AWARDED",
      `Awarded ${params.points} points to customer ${params.customerId} (${params.type})`
    );

    return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(id) as any;
  },

  reversePoints(params: {
    customerId: string;
    referenceType: string;
    referenceId: string;
    reason: string;
    actor?: string;
  }) {
    const db = getDatabase();

    // Find the original transaction
    const original = db.prepare(`
      SELECT * FROM customer_reward_transactions
      WHERE customerId = ? AND referenceType = ? AND referenceId = ? AND transactionType != 'REVERSAL'
      ORDER BY createdAt DESC LIMIT 1
    `).get(params.customerId, params.referenceType, params.referenceId) as any;

    if (!original) {
      return null;
    }

    // Check if already reversed
    const existingReversal = db.prepare(`
      SELECT id FROM customer_reward_transactions
      WHERE customerId = ? AND referenceType = ? AND referenceId = ? AND transactionType = 'REVERSAL'
    `).get(params.customerId, params.referenceType, params.referenceId) as any;

    if (existingReversal) {
      return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(existingReversal.id) as any;
    }

    // Reverse the points: if original was +50, reversal is -50; if original was -200, reversal is +200
    const reversePoints = -original.points;
    const id = "rtx_rev_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_reward_transactions (
        id, customerId, transactionType, points, referenceType, referenceId,
        description, createdAt, createdBy
      ) VALUES (?, ?, 'REVERSAL', ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.customerId,
      reversePoints,
      params.referenceType,
      params.referenceId,
      `Reversal: ${params.reason}`,
      now,
      params.actor || "Admin"
    );

    auditLogsRepo.log(
      params.actor || "Admin",
      "REWARD_POINTS_REVERSED",
      `Reversed ${reversePoints} points for customer ${params.customerId} (${params.referenceType}:${params.referenceId})`
    );

    return db.prepare("SELECT * FROM customer_reward_transactions WHERE id = ?").get(id) as any;
  },

  adjustCustomerPoints(params: {
    customerId: string;
    points: number; // Positive for credit, negative for debit
    reason: string;
    actor: string;
  }) {
    const db = getDatabase();
    if (!params.points || params.points === 0) {
      throw new Error("Adjustment points cannot be zero.");
    }
    if (!params.reason || !params.reason.trim()) {
      throw new Error("A reason is mandatory for manual reward point adjustments.");
    }
    if (!params.actor || !params.actor.trim()) {
      throw new Error("Administrator identity is required for manual adjustments.");
    }

    const { balance } = this.getBalance(params.customerId);
    if (params.points < 0 && balance < Math.abs(params.points)) {
      throw new Error(`Insufficient customer points. Available balance is ${balance}, cannot deduct ${Math.abs(params.points)} points.`);
    }

    const type = params.points > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT";
    const id = "rtx_adj_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_reward_transactions (
        id, customerId, transactionType, points, referenceType, referenceId,
        description, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, 'ADMIN', ?, ?, ?, ?)
    `).run(
      id,
      params.customerId,
      type,
      Math.floor(params.points),
      id,
      params.reason.trim(),
      now,
      params.actor.trim()
    );

    auditLogsRepo.log(
      params.actor.trim(),
      `REWARD_${type}`,
      `Adjusted points by ${params.points} for customer ${params.customerId}: ${params.reason.trim()}`
    );

    return this.getBalance(params.customerId);
  },

  redeemFreeProduct(params: {
    customerId: string;
    productId: string;
    notes?: string;
  }) {
    const db = getDatabase();

    if (!siteContentRepo.getRewardsEnabled()) {
      throw new Error("The TRINAYAA rewards loyalty programme is currently inactive.");
    }

    const product = productsRepo.getById(params.productId);
    if (!product) {
      throw new Error("Selected product not found in catalogue.");
    }

    if (product.status !== "Published") {
      throw new Error("Selected product is not currently available for redemption.");
    }

    if (product.isRewardEligible === false || product.isRewardEligible === 0) {
      throw new Error("This product is marked as ineligible for reward points redemption.");
    }

    const threshold = siteContentRepo.getFreeProductRewardThreshold();

    // Execute atomically
    db.exec("BEGIN TRANSACTION;");
    let redemptionId = "";
    try {
      const { balance } = this.getBalance(params.customerId);
      if (balance < threshold) {
        throw new Error(`Insufficient reward points. You have ${balance} points, but ${threshold} points are required to redeem this product.`);
      }

      redemptionId = "rdm_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();

      // 1. Create redemption request
      db.prepare(`
        INSERT INTO customer_reward_redemptions (
          id, customerId, rewardProductId, pointsSpent, status, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, ?)
      `).run(
        redemptionId,
        params.customerId,
        params.productId,
        threshold,
        params.notes || null,
        now,
        now
      );

      // 2. Deduct points ledger transaction
      const txId = "rtx_rdm_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      db.prepare(`
        INSERT INTO customer_reward_transactions (
          id, customerId, transactionType, points, referenceType, referenceId,
          description, createdAt, createdBy
        ) VALUES (?, ?, 'REWARD_REDEEMED', ?, 'REDEMPTION', ?, ?, ?, ?)
      `).run(
        txId,
        params.customerId,
        -threshold,
        redemptionId,
        `Redemption: Free ${product.nameEn} (SKU: ${product.sku})`,
        now,
        params.customerId
      );

      db.exec("COMMIT;");
    } catch (txErr) {
      db.exec("ROLLBACK;");
      throw txErr;
    }

    auditLogsRepo.log(
      params.customerId,
      "REWARD_PRODUCT_REDEEMED",
      `Requested free product ${product.sku} for ${threshold} points (Redemption ID: ${redemptionId})`
    );

    return this.getRedemptionById(redemptionId);
  },

  getRedemptionById(id: string) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT r.*, p.sku as productSku, p.nameEn as productName, p.primaryImage as productImage,
             u.name as customerName, u.email as customerEmail, u.phone as customerPhone
      FROM customer_reward_redemptions r
      LEFT JOIN products p ON p.id = r.rewardProductId
      LEFT JOIN users u ON u.id = r.customerId
      WHERE r.id = ?
    `).get(id) as any;
    return row || null;
  },

  moderateRedemption(params: {
    redemptionId: string;
    status: "APPROVED" | "FULFILLED" | "REJECTED" | "CANCELLED";
    adminNotes?: string;
    orderId?: string;
    actor?: string;
  }) {
    const db = getDatabase();
    const redemption = this.getRedemptionById(params.redemptionId);
    if (!redemption) {
      throw new Error("Redemption request not found.");
    }

    const now = new Date().toISOString();
    const fulfilledAt = params.status === "FULFILLED" ? now : (redemption.fulfilledAt || null);

    // If changing to REJECTED or CANCELLED, restore points if not already reversed
    if (params.status === "REJECTED" || params.status === "CANCELLED") {
      this.reversePoints({
        customerId: redemption.customerId,
        referenceType: "REDEMPTION",
        referenceId: redemption.id,
        reason: `Restoration for ${params.status.toLowerCase()} redemption: ${params.adminNotes || "Request rejected/cancelled"}`,
        actor: params.actor || "Admin",
      });
    }

    db.prepare(`
      UPDATE customer_reward_redemptions
      SET status = ?, adminNotes = ?, orderId = COALESCE(?, orderId),
          updatedAt = ?, fulfilledAt = ?
      WHERE id = ?
    `).run(
      params.status,
      params.adminNotes !== undefined ? params.adminNotes : redemption.adminNotes,
      params.orderId || null,
      now,
      fulfilledAt,
      params.redemptionId
    );

    auditLogsRepo.log(
      params.actor || "Admin",
      "REWARD_REDEMPTION_MODERATED",
      `Redemption ${params.redemptionId} marked as ${params.status}`
    );

    return this.getRedemptionById(params.redemptionId);
  },

  listRedemptions(filters: { status?: string; customerId?: string; search?: string; limit?: number } = {}) {
    const db = getDatabase();
    let query = `
      SELECT r.*, p.sku as productSku, p.nameEn as productName, p.primaryImage as productImage,
             u.name as customerName, u.email as customerEmail, u.phone as customerPhone
      FROM customer_reward_redemptions r
      LEFT JOIN products p ON p.id = r.rewardProductId
      LEFT JOIN users u ON u.id = r.customerId
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.status && filters.status !== "ALL") {
      query += " AND r.status = ?";
      params.push(filters.status);
    }
    if (filters.customerId) {
      query += " AND r.customerId = ?";
      params.push(filters.customerId);
    }
    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += " AND (r.id LIKE ? OR p.nameEn LIKE ? OR p.sku LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      params.push(term, term, term, term, term);
    }

    query += " ORDER BY r.createdAt DESC";
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    return db.prepare(query).all(...params) as any[];
  },

  getOverviewStats() {
    const db = getDatabase();
    const participating = db.prepare(`
      SELECT COUNT(DISTINCT customerId) as count
      FROM customer_reward_transactions
    `).get() as { count: number };

    const pointsIssued = db.prepare(`
      SELECT COALESCE(SUM(points), 0) as total
      FROM customer_reward_transactions
      WHERE points > 0
    `).get() as { total: number };

    const pointsRedeemed = db.prepare(`
      SELECT COALESCE(ABS(SUM(points)), 0) as total
      FROM customer_reward_transactions
      WHERE transactionType = 'REWARD_REDEEMED'
    `).get() as { total: number };

    const redemptionCounts = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'REQUESTED' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'FULFILLED' THEN 1 ELSE 0 END) as fulfilled,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM customer_reward_redemptions
    `).get() as any;

    return {
      participatingCustomers: participating?.count || 0,
      totalPointsIssued: pointsIssued?.total || 0,
      totalPointsRedeemed: pointsRedeemed?.total || 0,
      totalRedemptions: redemptionCounts?.total || 0,
      pendingRedemptions: redemptionCounts?.pending || 0,
      approvedRedemptions: redemptionCounts?.approved || 0,
      fulfilledRedemptions: redemptionCounts?.fulfilled || 0,
      rejectedRedemptions: redemptionCounts?.rejected || 0,
      settings: this.getSettings(),
    };
  },

  listCustomersWithRewards(filters: { search?: string; limit?: number; offset?: number } = {}) {
    const db = getDatabase();
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.status, u.createdAt,
             COALESCE(SUM(t.points), 0) as balance,
             COALESCE(SUM(CASE WHEN t.points > 0 THEN t.points ELSE 0 END), 0) as totalEarned,
             COALESCE(ABS(SUM(CASE WHEN t.transactionType = 'REWARD_REDEEMED' THEN t.points ELSE 0 END)), 0) as totalRedeemed,
             COUNT(t.id) as transactionCount
      FROM users u
      LEFT JOIN customer_reward_transactions t ON t.customerId = u.id
      WHERE u.role = 'CUSTOMER'
    `;
    const params: any[] = [];

    if (filters.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      params.push(term, term, term);
    }

    query += " GROUP BY u.id ORDER BY balance DESC, u.name ASC";
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
      if (filters.offset) {
        query += " OFFSET ?";
        params.push(filters.offset);
      }
    }

    return db.prepare(query).all(...params) as any[];
  },

  toggleProductRewardEligibility(productId: string, isEligible: boolean) {
    const db = getDatabase();
    const val = isEligible ? 1 : 0;
    db.prepare("UPDATE products SET isRewardEligible = ?, updatedAt = ? WHERE id = ?")
      .run(val, new Date().toISOString(), productId);
    return productsRepo.getById(productId);
  },
};


// ==========================================
// 22. WEBSITE POLICIES CMS REPOSITORY (PHASE 8)
// ==========================================
export interface PolicyDocument {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  isPublished: boolean;
  lastUpdated: string;
}

export const policiesRepo = {
  getPolicy(slug: string): PolicyDocument | null {
    const cleanSlug = slug.toLowerCase().trim();
    const key = `policy_content_${cleanSlug}`;
    const raw = siteContentRepo.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PolicyDocument;
    } catch {
      return null;
    }
  },

  getAllPolicies(): PolicyDocument[] {
    const slugs = ["shipping", "returns", "privacy", "terms"];
    return slugs.map((slug) => {
      const doc = this.getPolicy(slug);
      if (doc) return doc;
      return {
        slug,
        title:
          slug === "shipping"
            ? "Shipping & Delivery Policy"
            : slug === "returns"
            ? "Return & Refund Policy"
            : slug === "privacy"
            ? "Privacy Policy"
            : "Terms & Conditions",
        subtitle: "",
        content: "<p>Policy draft under review by TRINAYAA administration.</p>",
        isPublished: false,
        lastUpdated: "Draft",
      };
    });
  },

  updatePolicy(data: {
    slug: string;
    title: string;
    subtitle?: string;
    content: string;
    isPublished: boolean;
    lastUpdated?: string;
    actor?: string;
  }): PolicyDocument {
    const cleanSlug = data.slug.toLowerCase().trim();
    const validSlugs = ["shipping", "returns", "privacy", "terms"];
    if (!validSlugs.includes(cleanSlug)) {
      throw new Error(`Invalid policy slug "${data.slug}". Must be one of: ${validSlugs.join(", ")}`);
    }

    if (!data.title || !data.title.trim()) {
      throw new Error("Policy title cannot be empty.");
    }

    const key = `policy_content_${cleanSlug}`;
    const updatedDate =
      data.lastUpdated && data.lastUpdated.trim()
        ? data.lastUpdated.trim()
        : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const doc: PolicyDocument = {
      slug: cleanSlug,
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || "",
      content: data.content,
      isPublished: Boolean(data.isPublished),
      lastUpdated: updatedDate,
    };

    siteContentRepo.set(key, JSON.stringify(doc));

    auditLogsRepo.log(
      data.actor || "Admin",
      "POLICY_UPDATED",
      `Updated policy "${doc.title}" (${cleanSlug}): published=${doc.isPublished}`
    );

    return doc;
  },
};

// ==========================================
// 23. SOCIAL MEDIA & WHATSAPP LINKS REPOSITORY (PHASE 8)
// ==========================================
export interface SocialLinksConfig {
  instagram: string;
  facebook: string;
  whatsappPhone: string;
  whatsappMessage: string;
  whatsappUrl: string;
}

export const socialLinksRepo = {
  getConfig(): SocialLinksConfig {
    const instagram = siteContentRepo.get("social_instagram") || "";
    const facebook = siteContentRepo.get("social_facebook") || "";
    const whatsappPhone = siteContentRepo.get("social_whatsapp_phone") || "";
    const whatsappMessage = siteContentRepo.get("social_whatsapp_message") || "";
    const whatsappUrl = generateWhatsAppLink(whatsappPhone, whatsappMessage);

    return {
      instagram,
      facebook,
      whatsappPhone,
      whatsappMessage,
      whatsappUrl,
    };
  },

  updateConfig(data: {
    instagram?: string;
    facebook?: string;
    whatsappPhone?: string;
    whatsappMessage?: string;
    actor?: string;
  }): SocialLinksConfig {
    if (data.instagram !== undefined) {
      const val = data.instagram.trim();
      if (val && !isValidSocialUrl(val, "instagram")) {
        throw new Error("Invalid Instagram URL. Must be a valid HTTPS URL pointing to instagram.com.");
      }
      siteContentRepo.set("social_instagram", val);
    }

    if (data.facebook !== undefined) {
      const val = data.facebook.trim();
      if (val && !isValidSocialUrl(val, "facebook")) {
        throw new Error("Invalid Facebook URL. Must be a valid HTTPS URL pointing to facebook.com.");
      }
      siteContentRepo.set("social_facebook", val);
    }

    if (data.whatsappPhone !== undefined) {
      const val = data.whatsappPhone.trim();
      if (val) {
        const clean = val.replace(/[^0-9]/g, "");
        if (clean.length < 10 || clean.length > 15) {
          throw new Error("Invalid WhatsApp phone number. Please enter a valid 10-digit Indian phone number or international number.");
        }
      }
      siteContentRepo.set("social_whatsapp_phone", val);
    }

    if (data.whatsappMessage !== undefined) {
      siteContentRepo.set("social_whatsapp_message", data.whatsappMessage.trim());
    }

    auditLogsRepo.log(
      data.actor || "Admin",
      "SOCIAL_LINKS_UPDATED",
      `Updated social media links & WhatsApp configuration`
    );

    return this.getConfig();
  },
};
