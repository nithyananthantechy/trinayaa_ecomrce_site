// Safe loader for Node.js built-in SQLite that prevents Vite bundling conflicts
const sqliteModule: any = (process as any).getBuiltinModule ? (process as any).getBuiltinModule("node:sqlite") : eval("require")("node:sqlite");
const DatabaseSync = sqliteModule.DatabaseSync;
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

// Path to SQLite database
const DB_PATH = process.env.DATABASE_URL?.replace(/^sqlite:/, "") || path.resolve(process.cwd(), "data", "trinayaa.db");

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
      query += " AND (c.name = ? OR p.categoryId = ?)";
      params.push(options.category, options.category);
    }

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      query += " AND (p.nameEn LIKE ? OR p.nameTa LIKE ? OR p.sku LIKE ? OR p.shortDesc LIKE ?)";
      params.push(term, term, term, term);
    }

    if (options.sort === "price-low") {
      query += " ORDER BY p.sellingPrice ASC";
    } else if (options.sort === "price-high") {
      query += " ORDER BY p.sellingPrice DESC";
    } else if (options.sort === "name") {
      query += " ORDER BY p.nameEn ASC";
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

  create(data: any) {
    const db = getDatabase();
    const id = data.id || "prod_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const slug = data.slug || (data.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + data.sku.toLowerCase());

    db.prepare(`
      INSERT OR REPLACE INTO products (
        id, sku, nameEn, nameTa, slug, shortDesc, fullDesc, categoryId, productType,
        primaryImage, gallery, sellingPrice, mrp, discountPrice, stock, stockAvailability,
        status, featured, seoTitle, seoDescription, seoKeywords, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      "stock", "stockAvailability", "status", "featured", "seoTitle", "seoDescription", "seoKeywords"
    ];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        if (key === "featured") {
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

  delete(id: string) {
    const db = getDatabase();
    db.prepare("DELETE FROM product_variants WHERE productId = ?").run(id);
    const res = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return res.changes > 0;
  },

  updateStock(id: string, stock: number) {
    const db = getDatabase();
    const availability = stock > 0 ? "In Stock" : "Out of Stock";
    db.prepare("UPDATE products SET stock = ?, stockAvailability = ?, updatedAt = ? WHERE id = ?")
      .run(stock, availability, new Date().toISOString(), id);
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

  return {
    ...p,
    id: p.id,
    name: p.nameEn,
    nameTa: p.nameTa,
    category: p.categoryName || "Herbs",
    price: p.sellingPrice,
    compareAt: p.mrp > p.sellingPrice ? p.mrp : undefined,
    image: p.primaryImage || "/images/products/packaged/pouch_001.png",
    description: p.shortDesc || p.fullDesc || "",
    featured: Boolean(p.featured),
    sizes,
    gallery: gallery.length > 0 ? gallery : [p.primaryImage || "/images/products/packaged/pouch_001.png"],
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
    const res = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return res.changes > 0;
  }
};

// ==========================================
// 3. USERS & AUTH REPOSITORY
// ==========================================
export const usersRepo = {
  getByEmail(email: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as any;
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT id, email, name, phone, role, status, telegramId, createdAt, updatedAt FROM users WHERE id = ?").get(id) as any;
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
      SELECT u.id, u.email, u.name, u.phone, u.role, u.status, u.createdAt,
             (SELECT COUNT(*) FROM orders o WHERE o.customerId = u.id) as totalOrders,
             (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.customerId = u.id AND o.paymentStatus = 'PAID') as totalSpent
      FROM users u
      WHERE u.role = 'CUSTOMER'
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];
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

  addItem(cartId: string, productId: string, packSize: string, unitPrice: number, quantity = 1) {
    const db = getDatabase();
    const existing = db.prepare("SELECT * FROM cart_items WHERE cartId = ? AND productId = ? AND packSize = ?")
      .get(cartId, productId, packSize) as any;

    if (existing) {
      db.prepare("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?")
        .run(quantity, existing.id);
    } else {
      const id = "ci_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      db.prepare(`
        INSERT INTO cart_items (id, cartId, productId, packSize, unitPrice, quantity, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, cartId, productId, packSize, unitPrice, quantity, new Date().toISOString());
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

    let userCart = db.prepare("SELECT * FROM carts WHERE userId = ?").get(userId) as any;
    if (!userCart) {
      // Re-assign guest cart to user
      db.prepare("UPDATE carts SET userId = ?, guestToken = NULL, updatedAt = ? WHERE id = ?")
        .run(userId, new Date().toISOString(), guestCart.id);
      return;
    }

    // Merge items into userCart
    const guestItems = db.prepare("SELECT * FROM cart_items WHERE cartId = ?").all(guestCart.id) as any[];
    for (const item of guestItems) {
      this.addItem(userCart.id, item.productId, item.packSize, item.unitPrice, item.quantity);
    }

    // Delete guest cart
    db.prepare("DELETE FROM cart_items WHERE cartId = ?").run(guestCart.id);
    db.prepare("DELETE FROM carts WHERE id = ?").run(guestCart.id);
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
        orderStatus, internalNotes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

    return this.getById(id);
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

  trackOrder(orderNumber: string, verificationPhoneOrEmail?: string) {
    const db = getDatabase();
    const cleanNumber = orderNumber.trim().toUpperCase();
    let query = "SELECT * FROM orders WHERE UPPER(orderNumber) = ?";
    const params: any[] = [cleanNumber];

    if (verificationPhoneOrEmail && verificationPhoneOrEmail.trim()) {
      const ver = verificationPhoneOrEmail.trim().toLowerCase();
      query += " AND (LOWER(customerEmail) = ? OR customerPhone LIKE ?)";
      params.push(ver, `%${ver.replace(/\D/g, "")}%`);
    }

    const order = db.prepare(query).get(...params) as any;
    if (!order) return null;

    // Return sanitized tracking details preserving privacy
    const history = db.prepare("SELECT status, note, createdAt FROM order_status_history WHERE orderId = ? ORDER BY createdAt ASC").all(order.id) as any[];
    const items = db.prepare("SELECT productNameEn, packSize, quantity, image FROM order_items WHERE orderId = ?").all(order.id) as any[];

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items,
      history,
    };
  },

  updateStatus(orderId: string, status: string, note?: string, updatedBy = "Admin") {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("UPDATE orders SET orderStatus = ?, updatedAt = ? WHERE id = ?").run(status, now, orderId);

    db.prepare(`
      INSERT INTO order_status_history (id, orderId, status, note, updatedBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run("osh_" + crypto.randomUUID(), orderId, status, note || `Status changed to ${status}`, updatedBy, now);

    return this.getById(orderId);
  },

  updatePayment(orderId: string, paymentStatus: string, razorpayPaymentId?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    let orderStatus = "Pending Payment";
    if (paymentStatus === "PAID") {
      orderStatus = "Confirmed";
    } else if (paymentStatus === "FAILED") {
      orderStatus = "Failed payment";
    }

    db.prepare(`
      UPDATE orders
      SET paymentStatus = ?, orderStatus = ?, razorpayPaymentId = COALESCE(?, razorpayPaymentId), updatedAt = ?
      WHERE id = ?
    `).run(paymentStatus, orderStatus, razorpayPaymentId || null, now, orderId);

    db.prepare(`
      INSERT INTO order_status_history (id, orderId, status, note, updatedBy, createdAt)
      VALUES (?, ?, ?, ?, 'Razorpay Gateway', ?)
    `).run("osh_" + crypto.randomUUID(), orderId, orderStatus, `Payment verified: ${paymentStatus}`, now);

    return this.getById(orderId);
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
    if (!campaign.isActive) {
      return { valid: false, message: "This offer is no longer active." };
    }
    const now = new Date().toISOString();
    if (now < campaign.startDate || now > campaign.endDate) {
      return { valid: false, message: "This promotional campaign has expired." };
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
      data.isActive ? 1 : 0,
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
  }
};

// ==========================================
// 8. TELEGRAM ADMIN & AUDIT REPOSITORY
// ==========================================
export const telegramRepo = {
  isAllowed(telegramId: string): boolean {
    const db = getDatabase();
    const cleanId = String(telegramId).trim();
    // Also check env allowlist
    const envAdmins = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (envAdmins.includes(cleanId)) return true;

    const row = db.prepare("SELECT * FROM telegram_allowed_admins WHERE telegramId = ?").get(cleanId);
    return Boolean(row);
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
// 9. ADMIN DASHBOARD STATS REPOSITORY
// ==========================================
export const adminStatsRepo = {
  getOverview() {
    const db = getDatabase();
    const totalProducts = (db.prepare("SELECT COUNT(*) as count FROM products").get() as any)?.count || 0;
    const activeProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE status = 'Published'").get() as any)?.count || 0;
    const lowStockProducts = (db.prepare("SELECT COUNT(*) as count FROM products WHERE stock < 10").get() as any)?.count || 0;

    const totalOrders = (db.prepare("SELECT COUNT(*) as count FROM orders").get() as any)?.count || 0;
    const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE orderStatus IN ('Pending Payment', 'Confirmed', 'Processing')").get() as any)?.count || 0;
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE orderStatus = 'Delivered'").get() as any)?.count || 0;

    const revenueResult = db.prepare("SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE paymentStatus = 'PAID'").get() as any;
    const totalRevenue = revenueResult?.totalRevenue || 0;

    const activeCampaigns = (db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE isActive = 1").get() as any)?.count || 0;
    const recentOrders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC LIMIT 5").all() as any[];

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      activeCampaigns,
      recentOrders: recentOrders.map((o) => ordersRepo.enrichOrder(o)),
    };
  }
};
