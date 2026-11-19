// Safe loader for Node.js built-in SQLite that prevents Vite bundling conflicts
const sqliteModule: any = (process as any).getBuiltinModule ? (process as any).getBuiltinModule("node:sqlite") : eval("require")("node:sqlite");
const DatabaseSync = sqliteModule.DatabaseSync;
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { notificationsService, type OrderNotificationEvent } from "./notifications.ts";
import { generateWhatsAppLink, isValidSocialUrl } from "./sanitize.ts";

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
      billingAddress TEXT,
      billingName TEXT,
      billingPhone TEXT,
      billingEmail TEXT,
      recipientName TEXT,
      recipientPhone TEXT,
      recipientEmail TEXT,
      isSameAddress INTEGER NOT NULL DEFAULT 1,
      isGiftOrder INTEGER NOT NULL DEFAULT 0,
      giftMessage TEXT,
      deliveryInstructions TEXT,
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

    CREATE TABLE IF NOT EXISTS order_documents (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      document_type TEXT NOT NULL, -- 'INVOICE', 'SHIPPING_SLIP', 'DELIVERY_CHALLAN', 'PACKING_STICKER'
      document_number TEXT NOT NULL UNIQUE,
      generated_by TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_order_docs_order ON order_documents(order_id, document_type);
    CREATE INDEX IF NOT EXISTS idx_order_docs_number ON order_documents(document_number);
    CREATE INDEX IF NOT EXISTS idx_order_docs_order_number ON order_documents(order_number);

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      updatedBy TEXT NOT NULL DEFAULT 'System',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_returns (
      id TEXT PRIMARY KEY,
      return_number TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      order_item_id TEXT,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      pack_size TEXT NOT NULL,
      quantity_requested INTEGER NOT NULL,
      quantity_received INTEGER NOT NULL DEFAULT 0,
      quantity_inspected INTEGER NOT NULL DEFAULT 0,
      item_price REAL NOT NULL,
      refund_amount REAL NOT NULL,
      return_reason TEXT NOT NULL,
      description TEXT NOT NULL,
      supporting_image TEXT,
      pickup_instructions TEXT,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      stock_disposition TEXT NOT NULL DEFAULT 'NONE',
      restocked_quantity INTEGER NOT NULL DEFAULT 0,
      refund_method TEXT,
      refund_reference TEXT,
      refunded_at TEXT,
      admin_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_returns_order ON order_returns(order_id);
    CREATE INDEX IF NOT EXISTS idx_returns_order_number ON order_returns(order_number);
    CREATE INDEX IF NOT EXISTS idx_returns_customer ON order_returns(customer_id);
    CREATE INDEX IF NOT EXISTS idx_returns_number ON order_returns(return_number);
    CREATE INDEX IF NOT EXISTS idx_returns_status ON order_returns(status);

    CREATE TABLE IF NOT EXISTS order_return_history (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (return_id) REFERENCES order_returns(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_return_history_ret ON order_return_history(return_id);

    CREATE TABLE IF NOT EXISTS customer_subscriptions (
      id TEXT PRIMARY KEY,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      product_name TEXT NOT NULL,
      product_sku TEXT NOT NULL,
      variant_label TEXT,
      product_snapshot TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      shipping_fee REAL NOT NULL DEFAULT 0,
      total_per_cycle REAL NOT NULL,
      frequency TEXT NOT NULL,
      frequency_days INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      next_delivery_date TEXT NOT NULL,
      last_order_date TEXT,
      delivery_address TEXT NOT NULL,
      delivery_instructions TEXT,
      payment_preference TEXT NOT NULL DEFAULT 'COD',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      pause_reason TEXT,
      cancellation_reason TEXT,
      cancelled_at TEXT,
      paused_at TEXT,
      cycle_count INTEGER NOT NULL DEFAULT 0,
      failure_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_sub_customer ON customer_subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sub_number ON customer_subscriptions(subscription_number);
    CREATE INDEX IF NOT EXISTS idx_sub_status ON customer_subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_sub_next_delivery ON customer_subscriptions(next_delivery_date);

    CREATE TABLE IF NOT EXISTS subscription_cycles (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      subscription_number TEXT NOT NULL,
      cycle_number INTEGER NOT NULL,
      cycle_reference TEXT UNIQUE NOT NULL,
      scheduled_date TEXT NOT NULL,
      processed_date TEXT,
      order_id TEXT,
      order_number TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      failure_reason TEXT,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      payment_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cycle_sub ON subscription_cycles(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_cycle_ref ON subscription_cycles(cycle_reference);
    CREATE INDEX IF NOT EXISTS idx_cycle_status ON subscription_cycles(status);

    CREATE TABLE IF NOT EXISTS subscription_history (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      actor_id TEXT,
      note TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (subscription_id) REFERENCES customer_subscriptions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sub_hist_sub ON subscription_history(subscription_id);


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

    CREATE TABLE IF NOT EXISTS telegram_stock_requests (
      id TEXT PRIMARY KEY,
      requestNumber TEXT UNIQUE NOT NULL,
      managerTelegramId TEXT NOT NULL,
      managerName TEXT NOT NULL,
      productSku TEXT NOT NULL,
      productName TEXT NOT NULL,
      currentStock INTEGER NOT NULL,
      quantityChange INTEGER NOT NULL,
      newStockTarget INTEGER NOT NULL,
      requestType TEXT NOT NULL DEFAULT 'RESTOCK',
      photoFileId TEXT,
      photoUrl TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reviewedBy TEXT,
      reviewedAt TEXT,
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

    -- Phase 3: New Product Enquiries
    CREATE TABLE IF NOT EXISTS product_enquiries (
      id TEXT PRIMARY KEY,
      enquiry_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      product_name TEXT NOT NULL,
      category TEXT,
      requested_quantity TEXT NOT NULL,
      preferred_pack_size TEXT,
      description TEXT NOT NULL,
      reference_image TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      admin_notes TEXT,
      reviewed_at TEXT,
      reviewed_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_product_enquiries_cust ON product_enquiries(customer_id);
    CREATE INDEX IF NOT EXISTS idx_product_enquiries_num ON product_enquiries(enquiry_number);
    CREATE INDEX IF NOT EXISTS idx_product_enquiries_status ON product_enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_product_enquiries_created ON product_enquiries(created_at);

    -- ==========================================
    -- RETAIL BRANCHES & WAREHOUSES (PHASE 4)
    -- ==========================================
    CREATE TABLE IF NOT EXISTS retail_branches (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Tamil Nadu',
      pin_code TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS retail_branch_stock (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      sku TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 50,
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(branch_id, product_id, sku)
    );

    CREATE TABLE IF NOT EXISTS retail_stock_movements (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      change_type TEXT NOT NULL,
      delta INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_id TEXT,
      reason TEXT,
      performed_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retail_stock_adjustments (
      id TEXT PRIMARY KEY,
      adjustment_number TEXT UNIQUE NOT NULL,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      requested_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      requested_by TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retail_sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      branch_id TEXT NOT NULL,
      handler_id TEXT NOT NULL,
      handler_name TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
      customer_phone TEXT,
      customer_email TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_reason TEXT,
      tax_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PAID',
      sale_status TEXT NOT NULL DEFAULT 'COMPLETED',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS retail_sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      pack_size TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES retail_sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_retail_stock_branch ON retail_branch_stock(branch_id);
    CREATE INDEX IF NOT EXISTS idx_retail_stock_prod ON retail_branch_stock(product_id);
    CREATE INDEX IF NOT EXISTS idx_retail_sales_branch ON retail_sales(branch_id);
    CREATE INDEX IF NOT EXISTS idx_retail_sales_inv ON retail_sales(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_retail_sales_created ON retail_sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_retail_movements_branch ON retail_stock_movements(branch_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_retail_adj_branch ON retail_stock_adjustments(branch_id, status);
  `);

  // Safe schema migrations for existing database tables
  const safeAlter = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      // Column or index already exists
    }
  };

  safeAlter("ALTER TABLE users ADD COLUMN branchId TEXT;");

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
  safeAlter("ALTER TABLE orders ADD COLUMN subscriptionId TEXT;");
  safeAlter("ALTER TABLE orders ADD COLUMN subscriptionCycleId TEXT;");
  safeAlter("ALTER TABLE orders ADD COLUMN isSubscriptionOrder INTEGER NOT NULL DEFAULT 0;");
  safeAlter("ALTER TABLE products ADD COLUMN isSubscriptionEligible INTEGER NOT NULL DEFAULT 1;");

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
    variants: variants.map((v) => ({ id: v.id, label: v.packSize, packSize: v.packSize, price: v.price, mrp: v.mrp, stock: v.stock, sku: v.sku })),
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
    return db.prepare("SELECT id, email, name, phone, role, status, branchId, adminNotes, telegramId, createdAt, updatedAt FROM users WHERE id = ?").get(id) as any;
  },

  create(data: { email: string; password: string; name: string; phone?: string; role?: string; branchId?: string }) {
    const db = getDatabase();
    const id = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const hash = hashPassword(data.password);
    const now = new Date().toISOString();
    const email = data.email.toLowerCase().trim();

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(id, email, hash, data.name, data.phone || "", data.role || "CUSTOMER", data.branchId || null, now, now);

    return this.getById(id);
  },

  listAdmins() {
    const db = getDatabase();
    return db.prepare(`
      SELECT u.id, u.email, u.name, u.phone, u.role, u.status, u.branchId, u.adminNotes, u.telegramId, u.createdAt, u.updatedAt,
             b.name as branchName, b.code as branchCode
      FROM users u
      LEFT JOIN retail_branches b ON u.branchId = b.id
      WHERE u.role IN ('ADMIN', 'SUPER_ADMIN', 'RETAIL_SHOP_HANDLER')
      ORDER BY CASE u.role WHEN 'SUPER_ADMIN' THEN 1 WHEN 'ADMIN' THEN 2 ELSE 3 END, u.createdAt ASC
    `).all() as any[];
  },

  listRetailHandlers(branchId?: string) {
    const db = getDatabase();
    let sql = `
      SELECT u.id, u.email, u.name, u.phone, u.role, u.status, u.branchId, u.createdAt, u.updatedAt,
             b.name as branchName, b.code as branchCode
      FROM users u
      LEFT JOIN retail_branches b ON u.branchId = b.id
      WHERE u.role = 'RETAIL_SHOP_HANDLER'
    `;
    const params: any[] = [];
    if (branchId) {
      sql += " AND u.branchId = ?";
      params.push(branchId);
    }
    sql += " ORDER BY u.name ASC";
    return db.prepare(sql).all(...params) as any[];
  },

  createAdminUser(data: { email: string; password: string; name: string; phone?: string; role?: string; branchId?: string }) {
    const db = getDatabase();
    const existing = this.getByEmail(data.email);
    if (existing) {
      throw new Error(`User with email "${data.email}" already exists`);
    }
    const id = "usr_staff_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const hash = hashPassword(data.password);
    const now = new Date().toISOString();
    const email = data.email.toLowerCase().trim();
    let role = "ADMIN";
    const reqRole = (data.role || "").toUpperCase();
    if (reqRole === "SUPER_ADMIN") role = "SUPER_ADMIN";
    else if (reqRole === "RETAIL_SHOP_HANDLER") role = "RETAIL_SHOP_HANDLER";

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(id, email, hash, data.name.trim(), data.phone || "", role, data.branchId || null, now, now);

    return this.getById(id);
  },

  updateAdminUser(id: string, data: { name?: string; phone?: string; role?: string; status?: string; branchId?: string | null; newPassword?: string }) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) throw new Error("Staff account not found");

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const phone = data.phone !== undefined ? data.phone : existing.phone;
    const role = data.role !== undefined ? data.role : existing.role;
    const status = data.status !== undefined ? data.status : existing.status;
    const branchId = data.branchId !== undefined ? data.branchId : existing.branchId;

    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, role = ?, status = ?, branchId = ?, updatedAt = ?
      WHERE id = ?
    `).run(name, phone, role, status, branchId, now, id);

    if (data.newPassword && data.newPassword.trim().length >= 8) {
      const hash = hashPassword(data.newPassword.trim());
      db.prepare("UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?").run(hash, now, id);
    }

    return this.getById(id);
  },

  deleteAdminUser(id: string) {
    const db = getDatabase();
    const res = db.prepare("DELETE FROM users WHERE id = ? AND role IN ('ADMIN', 'SUPER_ADMIN', 'RETAIL_SHOP_HANDLER')").run(id);
    return res.changes > 0;
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
// 4B. FULFILMENT & ORDER DOCUMENTS REPOSITORY (PHASE 5)
// ==========================================
export function numberToIndianWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return "Rupees Zero Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? " " + ones[unit] : "");
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (hundred > 0) {
      res += ones[hundred] + " Hundred";
      if (rest > 0) res += " ";
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let n = integerPart;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundredAndRest = n;

  const parts: string[] = [];
  if (crore > 0) parts.push(convertThreeDigits(crore) + " Crore");
  if (lakh > 0) parts.push(convertTwoDigits(lakh) + " Lakh");
  if (thousand > 0) parts.push(convertTwoDigits(thousand) + " Thousand");
  if (hundredAndRest > 0) parts.push(convertThreeDigits(hundredAndRest));

  let words = "Rupees " + (parts.length > 0 ? parts.join(" ") : "Zero");
  if (decimalPart > 0) {
    words += " and " + convertTwoDigits(decimalPart) + " Paise";
  }
  words += " Only";
  return words;
}

export const orderDocumentsRepo = {
  getDocPrefix(docType: string): string {
    switch (docType) {
      case "INVOICE": return "TRN-INV";
      case "DELIVERY_CHALLAN": return "TRN-DC";
      case "SHIPPING_SLIP": return "TRN-SHIP";
      case "PACKING_STICKER": return "TRN-LBL";
      default: return `TRN-${docType}`;
    }
  },

  getNextSequence(docType: string, year: number): number {
    const db = getDatabase();
    const prefix = `${this.getDocPrefix(docType)}-${year}-%`;
    const row = db.prepare(
      "SELECT MAX(CAST(SUBSTR(document_number, -5) AS INTEGER)) as maxSeq FROM order_documents WHERE document_type = ? AND document_number LIKE ?"
    ).get(docType, prefix) as any;
    return (row?.maxSeq || 0) + 1;
  },

  getOrGenerate(orderId: string, orderNumber: string, docType: string, generatedBy: string = "system", metadata: any = {}) {
    const db = getDatabase();
    // 1. Check if document already exists for this order & docType
    const existing = db.prepare(
      "SELECT * FROM order_documents WHERE (order_id = ? OR order_number = ?) AND document_type = ?"
    ).get(orderId, orderNumber, docType) as any;

    if (existing) {
      return {
        ...existing,
        metadata: existing.metadata ? (typeof existing.metadata === "string" ? JSON.parse(existing.metadata) : existing.metadata) : {}
      };
    }

    // 2. Generate sequential number: TRN-[TYPE]-YYYY-XXXXX with collision retry for concurrent workers
    const year = new Date().getFullYear();
    const prefix = this.getDocPrefix(docType);
    let attempts = 0;
    while (attempts < 10) {
      const seq = this.getNextSequence(docType, year);
      const docNumber = `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
      const id = "doc_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const now = new Date().toISOString();

      try {
        db.prepare(`
          INSERT INTO order_documents (id, order_id, order_number, document_type, document_number, generated_by, metadata, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, orderId, orderNumber, docType, docNumber, generatedBy, JSON.stringify(metadata || {}), now);

        return {
          id,
          order_id: orderId,
          order_number: orderNumber,
          document_type: docType,
          document_number: docNumber,
          generated_by: generatedBy,
          metadata,
          created_at: now
        };
      } catch (err: any) {
        if (err?.message?.includes("UNIQUE constraint failed: order_documents.document_number")) {
          attempts++;
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Failed to generate unique document number for ${docType} after 10 attempts`);
  },

  listByOrder(orderIdentifier: string) {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM order_documents WHERE order_id = ? OR order_number = ? ORDER BY created_at ASC").all(orderIdentifier, orderIdentifier) as any[];
    return rows.map(r => ({
      ...r,
      metadata: r.metadata ? (typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata) : {}
    }));
  },

  getByNumber(documentNumber: string) {
    const db = getDatabase();
    const r = db.prepare("SELECT * FROM order_documents WHERE document_number = ?").get(documentNumber) as any;
    if (!r) return null;
    return {
      ...r,
      metadata: r.metadata ? (typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata) : {}
    };
  }
};

// ==========================================
// 5. ORDERS & TRACKING REPOSITORY
// ==========================================
export const ordersRepo = {
  create(orderData: any, items: any[]) {
    const db = getDatabase();
    const id = "ord_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    let orderNumber = orderData.orderNumber;
    if (!orderNumber || db.prepare("SELECT id FROM orders WHERE orderNumber = ?").get(orderNumber)) {
      let candidate = "TRN-" + Math.floor(10000 + Math.random() * 90000);
      let attempts = 0;
      while (db.prepare("SELECT id FROM orders WHERE orderNumber = ?").get(candidate) && attempts < 50) {
        candidate = "TRN-" + Math.floor(10000 + Math.random() * 90000);
        attempts++;
      }
      orderNumber = candidate;
    }
    const now = new Date().toISOString();

    const isSameAddress = orderData.isSameAddress === false ? 0 : 1;
    const shippingAddressStr = typeof orderData.shippingAddress === "string"
      ? orderData.shippingAddress
      : JSON.stringify(orderData.shippingAddress);
    const billingAddressStr = isSameAddress
      ? shippingAddressStr
      : (typeof orderData.billingAddress === "string" ? orderData.billingAddress : (orderData.billingAddress ? JSON.stringify(orderData.billingAddress) : shippingAddressStr));
    const billingName = orderData.billingName || orderData.customerName;
    const billingPhone = orderData.billingPhone || orderData.customerPhone;
    const billingEmail = orderData.billingEmail || orderData.customerEmail;
    const recipientName = orderData.recipientName || orderData.customerName;
    const recipientPhone = orderData.recipientPhone || orderData.customerPhone;
    const recipientEmail = orderData.recipientEmail || orderData.customerEmail;
    const isGiftOrder = orderData.isGiftOrder ? 1 : 0;
    const giftMessage = orderData.giftMessage || null;
    const deliveryInstructions = orderData.deliveryInstructions || null;

    db.prepare(`
      INSERT INTO orders (
        id, orderNumber, customerId, customerName, customerEmail, customerPhone,
        shippingAddress, billingAddress, billingName, billingPhone, billingEmail,
        recipientName, recipientPhone, recipientEmail, isSameAddress, isGiftOrder,
        giftMessage, deliveryInstructions, subtotal, discountAmount, shippingFee, total,
        paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId,
        subscriptionId, subscriptionCycleId, isSubscriptionOrder,
        orderStatus, internalNotes, couponCode, trackingNumber, carrier, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orderNumber,
      orderData.customerId || null,
      orderData.customerName,
      orderData.customerEmail,
      orderData.customerPhone,
      shippingAddressStr,
      billingAddressStr,
      billingName,
      billingPhone,
      billingEmail,
      recipientName,
      recipientPhone,
      recipientEmail,
      isSameAddress,
      isGiftOrder,
      giftMessage,
      deliveryInstructions,
      orderData.subtotal,
      orderData.discountAmount || 0,
      orderData.shippingFee || 0,
      orderData.total,
      orderData.paymentMethod || "RAZORPAY",
      orderData.paymentStatus || "PENDING",
      orderData.razorpayOrderId || null,
      orderData.razorpayPaymentId || null,
      orderData.subscriptionId || null,
      orderData.subscriptionCycleId || null,
      orderData.isSubscriptionOrder ? 1 : (orderData.subscriptionId ? 1 : 0),
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
    let shippingAddress: any = {};
    try {
      shippingAddress = JSON.parse(order.shippingAddress);
    } catch {
      shippingAddress = { street: order.shippingAddress };
    }
    let billingAddress: any = null;
    if (order.billingAddress) {
      try {
        billingAddress = JSON.parse(order.billingAddress);
      } catch {
        billingAddress = { street: order.billingAddress };
      }
    } else {
      billingAddress = shippingAddress;
    }
    return {
      ...order,
      items,
      history,
      shippingAddress,
      billingAddress,
      isSameAddress: Boolean(order.isSameAddress ?? 1),
      isGiftOrder: Boolean(order.isGiftOrder ?? 0),
      billingName: order.billingName || order.customerName,
      billingPhone: order.billingPhone || order.customerPhone,
      billingEmail: order.billingEmail || order.customerEmail,
      recipientName: order.recipientName || order.customerName,
      recipientPhone: order.recipientPhone || order.customerPhone,
      recipientEmail: order.recipientEmail || order.customerEmail,
      giftMessage: order.giftMessage || null,
      deliveryInstructions: order.deliveryInstructions || null,
      subscriptionId: order.subscriptionId || null,
      subscriptionCycleId: order.subscriptionCycleId || null,
      isSubscriptionOrder: Boolean(order.isSubscriptionOrder || order.subscriptionId),
    };
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

  getShippingSlip(orderIdentifier: string, generatedBy: string = "Admin") {
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

    const recipientName = enriched.recipientName || parsedAddress?.recipientName || enriched.customerName;
    const recipientPhone = enriched.recipientPhone || parsedAddress?.recipientPhone || enriched.customerPhone;
    const recipientEmail = enriched.recipientEmail || enriched.customerEmail;

    const addressLines = [
      recipientName ? `Attn: ${recipientName}` : null,
      parsedAddress?.addressLine1 || parsedAddress?.street,
      parsedAddress?.addressLine2,
      parsedAddress?.landmark ? `Landmark: ${parsedAddress.landmark}` : null,
      parsedAddress?.district,
      parsedAddress?.city,
      parsedAddress?.state ? `${parsedAddress.state} - ${parsedAddress?.pinCode || ""}` : parsedAddress?.pinCode,
    ].filter(Boolean);

    // Document numbering sequence: TRN-SHIP-YYYY-XXXXX
    const docRecord = orderDocumentsRepo.getOrGenerate(
      enriched.id,
      enriched.orderNumber,
      "SHIPPING_SLIP",
      generatedBy,
      { total: enriched.total, itemCount: (enriched.items || []).length }
    );

    return {
      documentType: "SHIPPING_SLIP",
      documentNumber: docRecord.document_number,
      documentId: docRecord.id,
      orderId: enriched.id,
      orderNumber: enriched.orderNumber,
      createdAt: enriched.createdAt,
      orderDate: new Date(enriched.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      customerName: recipientName,
      customerPhone: recipientPhone,
      customerEmail: recipientEmail,
      recipientName,
      recipientPhone,
      recipientEmail,
      purchaserName: enriched.billingName || enriched.customerName,
      purchaserPhone: enriched.billingPhone || enriched.customerPhone,
      purchaserEmail: enriched.billingEmail || enriched.customerEmail,
      isSameAddress: enriched.isSameAddress,
      isGiftOrder: enriched.isGiftOrder,
      giftMessage: enriched.giftMessage,
      deliveryInstructions: enriched.deliveryInstructions,
      shippingAddress: parsedAddress,
      formattedAddress: addressLines.join(", "),
      items: (enriched.items || []).map((it: any, idx: number) => ({
        sNo: idx + 1,
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
      couponCode: enriched.couponCode || null,
      total: enriched.total,
      totalInWords: numberToIndianWords(enriched.total),
      paymentMethod: enriched.paymentMethod,
      paymentStatus: enriched.paymentStatus,
      orderStatus: enriched.orderStatus,
      trackingNumber: enriched.trackingNumber || null,
      carrier: enriched.carrier || null,
      dispatchHq: "TRINAYAA Erode Fulfillment Centre, Tamil Nadu",
      signatory: "Authorized Dispatch Supervisor - TRINAYAA ENTERPRISES",
    };
  },

  getCustomerInvoice(orderIdentifier: string, generatedBy: string = "Admin") {
    const db = getDatabase();
    const order = (db.prepare("SELECT * FROM orders WHERE id = ? OR orderNumber = ?").get(orderIdentifier, orderIdentifier) || null) as any;
    if (!order) return null;
    const enriched = this.enrichOrder(order);

    let parsedShipping = enriched.shippingAddress;
    if (typeof parsedShipping === "string") {
      try {
        parsedShipping = JSON.parse(parsedShipping);
      } catch {
        parsedShipping = { street: parsedShipping, city: "", state: "Tamil Nadu", pinCode: "" };
      }
    }
    let parsedBilling = enriched.billingAddress;
    if (typeof parsedBilling === "string") {
      try {
        parsedBilling = JSON.parse(parsedBilling);
      } catch {
        parsedBilling = { street: parsedBilling, city: "", state: "Tamil Nadu", pinCode: "" };
      }
    }
    if (!parsedBilling) {
      parsedBilling = parsedShipping;
    }

    const formatAddressLines = (addr: any) => [
      addr?.recipientName ? `Attn: ${addr.recipientName}` : null,
      addr?.addressLine1 || addr?.street,
      addr?.addressLine2,
      addr?.landmark ? `Landmark: ${addr.landmark}` : null,
      addr?.district,
      addr?.city,
      addr?.state ? `${addr.state} - ${addr?.pinCode || ""}` : addr?.pinCode,
    ].filter(Boolean);

    const shippingLines = formatAddressLines(parsedShipping);
    const billingLines = formatAddressLines(parsedBilling);

    // Document numbering sequence: TRN-INV-YYYY-XXXXX
    const docRecord = orderDocumentsRepo.getOrGenerate(
      enriched.id,
      enriched.orderNumber,
      "INVOICE",
      generatedBy,
      { total: enriched.total, paymentMethod: enriched.paymentMethod }
    );

    // Line items with HSN and GST calculation (Botanical wellness commodities default GST 5%: 2.5% CGST + 2.5% SGST)
    const items = (enriched.items || []).map((it: any, idx: number) => {
      const lineTotal = (it.price || it.unitPrice) * it.quantity;
      const taxable = Math.round((lineTotal / 1.05) * 100) / 100;
      const gstAmount = Math.round((lineTotal - taxable) * 100) / 100;
      const halfGst = Math.round((gstAmount / 2) * 100) / 100;

      return {
        sNo: idx + 1,
        id: it.id,
        productId: it.productId,
        productNameEn: it.productNameEn || it.name,
        productNameTa: it.productNameTa || "",
        sku: it.sku || `TRN-${it.productId?.replace(/\D/g, "") || "ITEM"}`,
        hsnCode: "121190",
        packSize: it.packSize || "100g",
        unitPrice: it.price || it.unitPrice,
        quantity: it.quantity,
        taxableAmount: taxable,
        cgstRate: 2.5,
        cgstAmount: halfGst,
        sgstRate: 2.5,
        sgstAmount: halfGst,
        total: lineTotal,
      };
    });

    const totalTaxable = Math.round(items.reduce((acc: number, it: any) => acc + it.taxableAmount, 0) * 100) / 100;
    const totalCgst = Math.round(items.reduce((acc: number, it: any) => acc + it.cgstAmount, 0) * 100) / 100;
    const totalSgst = Math.round(items.reduce((acc: number, it: any) => acc + it.sgstAmount, 0) * 100) / 100;

    return {
      documentType: "CUSTOMER_INVOICE",
      invoiceNumber: docRecord.document_number,
      documentId: docRecord.id,
      orderId: enriched.id,
      orderNumber: enriched.orderNumber,
      invoiceDate: new Date(docRecord.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      orderDate: new Date(enriched.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      sellerDetails: {
        companyName: "TRINAYAA ENTERPRISES",
        tagline: "Pure Seeds • Raw Powders • True Herbs",
        registeredOffice: "14/2, Perundurai Road, Erode, Tamil Nadu - 638 011, India",
        fulfillmentCenter: "TRINAYAA Erode Fulfillment Centre, Erode HQ",
        state: "Tamil Nadu",
        stateCode: "33",
        gstin: "33AABCT9988F1Z2",
        pan: "AABCT9988F",
        fssaiNumber: "12423008000451",
        contactEmail: "support@trinayaa.com",
        contactPhone: "+91 94422 18990",
        website: "https://trinayaa.com",
      },
      buyerDetails: {
        customerId: enriched.customerId || null,
        customerName: enriched.billingName || enriched.customerName,
        customerEmail: enriched.billingEmail || enriched.customerEmail,
        customerPhone: enriched.billingPhone || enriched.customerPhone,
        billingName: enriched.billingName || enriched.customerName,
        billingEmail: enriched.billingEmail || enriched.customerEmail,
        billingPhone: enriched.billingPhone || enriched.customerPhone,
        billingAddress: parsedBilling,
        formattedBillingAddress: billingLines.join(", "),
        recipientName: enriched.recipientName || enriched.customerName,
        recipientPhone: enriched.recipientPhone || enriched.customerPhone,
        recipientEmail: enriched.recipientEmail || enriched.customerEmail,
        shippingAddress: parsedShipping,
        formattedShippingAddress: shippingLines.join(", "),
        formattedAddress: billingLines.join(", ") || shippingLines.join(", "),
        isSameAddress: enriched.isSameAddress,
        isGiftOrder: enriched.isGiftOrder,
        giftMessage: enriched.giftMessage,
        placeOfSupply: parsedShipping?.state ? `${parsedShipping.state} (${parsedShipping.state.toLowerCase() === "tamil nadu" ? "33" : "OS"})` : "Tamil Nadu (33)",
      },
      items,
      subtotal: enriched.subtotal,
      discountAmount: enriched.discountAmount || 0,
      couponCode: enriched.couponCode || null,
      shippingFee: enriched.shippingFee || 0,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalTax: Math.round((totalCgst + totalSgst) * 100) / 100,
      total: enriched.total,
      totalInWords: numberToIndianWords(enriched.total),
      paymentMethod: enriched.paymentMethod,
      paymentStatus: enriched.paymentStatus,
      paymentRef: enriched.razorpayPaymentId || (enriched.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid Online"),
      orderStatus: enriched.orderStatus,
      isGiftOrder: enriched.isGiftOrder,
      giftMessage: enriched.giftMessage,
      termsAndConditions: [
        "All products sold are natural botanicals and wellness commodities.",
        "Computer-generated invoice. No physical signature required under Section 10A of IT Act 2000.",
        "Subject to Erode, Tamil Nadu jurisdiction.",
      ],
      authorizedSignatory: "TRINAYAA ENTERPRISES - Authorized Signatory",
    };
  },

  getDeliveryChallan(orderIdentifier: string, generatedBy: string = "Admin") {
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

    const recipientName = enriched.recipientName || parsedAddress?.recipientName || enriched.customerName;
    const recipientPhone = enriched.recipientPhone || parsedAddress?.recipientPhone || enriched.customerPhone;
    const recipientEmail = enriched.recipientEmail || enriched.customerEmail;

    const addressLines = [
      recipientName ? `Attn: ${recipientName}` : null,
      parsedAddress?.addressLine1 || parsedAddress?.street,
      parsedAddress?.addressLine2,
      parsedAddress?.landmark ? `Landmark: ${parsedAddress.landmark}` : null,
      parsedAddress?.district,
      parsedAddress?.city,
      parsedAddress?.state ? `${parsedAddress.state} - ${parsedAddress?.pinCode || ""}` : parsedAddress?.pinCode,
    ].filter(Boolean);

    // Document numbering sequence: TRN-DC-YYYY-XXXXX
    const docRecord = orderDocumentsRepo.getOrGenerate(
      enriched.id,
      enriched.orderNumber,
      "DELIVERY_CHALLAN",
      generatedBy,
      { total: enriched.total, itemCount: (enriched.items || []).length }
    );

    // Also look up invoice number if generated
    const invDoc = db.prepare("SELECT document_number FROM order_documents WHERE order_id = ? AND document_type = 'INVOICE'").get(enriched.id) as any;

    const items = (enriched.items || []).map((it: any, idx: number) => ({
      sNo: idx + 1,
      id: it.id,
      productId: it.productId,
      productNameEn: it.productNameEn || it.name,
      productNameTa: it.productNameTa || "",
      sku: it.sku || `TRN-${it.productId?.replace(/\D/g, "") || "ITEM"}`,
      hsnCode: "121190",
      packSize: it.packSize || "100g",
      quantity: it.quantity,
      uom: "Packs",
      rate: it.price || it.unitPrice,
      totalValue: (it.price || it.unitPrice) * it.quantity,
    }));

    const totalQuantity = items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);

    return {
      documentType: "DELIVERY_CHALLAN",
      challanNumber: docRecord.document_number,
      documentId: docRecord.id,
      orderId: enriched.id,
      orderNumber: enriched.orderNumber,
      invoiceNumber: invDoc?.document_number || "To be billed / Pending",
      challanDate: new Date(docRecord.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      orderDate: new Date(enriched.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      consignor: {
        name: "TRINAYAA ENTERPRISES",
        address: "14/2, Perundurai Road, Erode, Tamil Nadu - 638 011",
        fulfillmentCenter: "TRINAYAA Erode Warehouse & Dispatch Facility",
        gstin: "33AABCT9988F1Z2",
        phone: "+91 94422 18990",
      },
      consignee: {
        name: recipientName,
        phone: recipientPhone,
        email: recipientEmail,
        shippingAddress: parsedAddress,
        formattedAddress: addressLines.join(", "),
        city: parsedAddress?.city || "",
        district: parsedAddress?.district || "",
        state: parsedAddress?.state || "Tamil Nadu",
        pinCode: parsedAddress?.pinCode || "",
      },
      transportDetails: {
        carrier: enriched.carrier || "E-Commerce Express Courier",
        trackingNumber: enriched.trackingNumber || `AWB-PENDING-${enriched.orderNumber}`,
        modeOfTransport: "Road / Surface Express Cargo",
        vehicleOrLorryNumber: "N/A (Courier Parcel)",
        placeOfSupply: parsedAddress?.state || "Tamil Nadu",
      },
      reasonForTransport: "Supply of Goods under Section 31(7) and Rule 55 of CGST Rules, 2017 (E-Commerce Customer Delivery)",
      items,
      totalQuantity,
      subtotal: enriched.subtotal,
      shippingFee: enriched.shippingFee || 0,
      total: enriched.total,
      totalInWords: numberToIndianWords(enriched.total),
      isGiftOrder: enriched.isGiftOrder,
      giftMessage: enriched.giftMessage,
      declaration: "Certified that the particulars given above are true and correct and the goods described are being transported for delivery to customer against confirmed e-commerce order under Section 31(7) and Rule 55 of the CGST Rules, 2017.",
      dispatchedBy: "TRINAYAA Warehouse Dispatch HQ",
      receivedBy: "Consignee Signature & Date",
    };
  },

  getPackingSticker(orderIdentifier: string, generatedBy: string = "Admin") {
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

    const recipientName = enriched.recipientName || parsedAddress?.recipientName || enriched.customerName;
    const recipientPhone = enriched.recipientPhone || parsedAddress?.recipientPhone || enriched.customerPhone;

    const addressLines = [
      recipientName ? `Attn: ${recipientName}` : null,
      parsedAddress?.addressLine1 || parsedAddress?.street,
      parsedAddress?.addressLine2,
      parsedAddress?.landmark ? `Landmark: ${parsedAddress.landmark}` : null,
      parsedAddress?.district,
      parsedAddress?.city,
      parsedAddress?.state ? `${parsedAddress.state} - ${parsedAddress?.pinCode || ""}` : parsedAddress?.pinCode,
    ].filter(Boolean);

    // Document numbering sequence: TRN-LBL-YYYY-XXXXX
    const docRecord = orderDocumentsRepo.getOrGenerate(
      enriched.id,
      enriched.orderNumber,
      "PACKING_STICKER",
      generatedBy,
      { total: enriched.total, paymentMethod: enriched.paymentMethod }
    );

    const isCod = (enriched.paymentMethod || "").toUpperCase() === "COD";
    const totalItems = (enriched.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
    const estWeight = totalItems * 125 + 75; // Approx weight in grams based on herbal powder packs

    return {
      documentType: "PACKING_STICKER",
      stickerNumber: docRecord.document_number,
      documentId: docRecord.id,
      orderNumber: enriched.orderNumber,
      orderId: enriched.id,
      orderDate: new Date(enriched.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      from: {
        name: "TRINAYAA ENTERPRISES",
        addressLine: "14/2, Perundurai Road, Erode, Tamil Nadu - 638 011",
        contact: "+91 94422 18990 | dispatch@trinayaa.com",
        originHub: "ED-01 (Erode Dispatch HQ)",
      },
      to: {
        name: recipientName,
        phone: recipientPhone,
        pinCode: parsedAddress?.pinCode || "638001",
        city: parsedAddress?.city || "",
        district: parsedAddress?.district || "",
        state: parsedAddress?.state || "Tamil Nadu",
        formattedAddress: addressLines.join(", "),
        addressLines,
      },
      isGiftOrder: enriched.isGiftOrder,
      giftMessage: enriched.giftMessage,
      routing: {
        originHub: "ED-01 (Erode Dispatch HQ)",
        destinationPin: parsedAddress?.pinCode || "638001",
        carrier: enriched.carrier || "Express Logistics",
        trackingNumber: enriched.trackingNumber || `AWB-${enriched.orderNumber}`,
        serviceType: isCod ? "COD EXPRESS" : (enriched.isGiftOrder ? "PREPAID GIFT PARCEL" : "PREPAID SURFACE"),
      },
      payment: {
        isCod,
        badgeText: isCod ? "CASH ON DELIVERY (COD)" : (enriched.isGiftOrder ? "PREPAID GIFT PARCEL" : "PREPAID ORDER"),
        badgeColor: isCod ? "amber" : "emerald",
        collectAmount: isCod ? enriched.total : 0,
        collectDisplay: isCod ? `COLLECT CASH: ₹${enriched.total}` : "DO NOT COLLECT CASH",
        paymentStatus: enriched.paymentStatus,
      },
      packageSummary: {
        totalPieces: totalItems,
        itemCount: (enriched.items || []).length,
        weightGrams: estWeight,
        weightKg: (estWeight / 1000).toFixed(2),
        itemManifest: (enriched.items || []).map((it: any) => ({
          name: it.productNameEn || it.name,
          packSize: it.packSize || "100g",
          quantity: it.quantity,
          sku: it.sku || `TRN-${it.productId?.replace(/\D/g, "") || "ITEM"}`,
        })),
      },
      barcodeData: {
        orderNumberBarcode: `*${enriched.orderNumber}*`,
        trackingBarcode: `*${enriched.trackingNumber || enriched.orderNumber}*`,
      },
      securityNotice: "TAMPER-EVIDENT BOTANICAL PACK • DO NOT ACCEPT IF SEAL IS BROKEN",
    };
  },
  getAllDocuments(orderIdentifier: string, generatedBy: string = "Admin") {
    const shippingSlip = this.getShippingSlip(orderIdentifier, generatedBy);
    const customerInvoice = this.getCustomerInvoice(orderIdentifier, generatedBy);
    const deliveryChallan = this.getDeliveryChallan(orderIdentifier, generatedBy);
    const packingSticker = this.getPackingSticker(orderIdentifier, generatedBy);

    if (!shippingSlip) return null;

    return {
      orderNumber: shippingSlip.orderNumber,
      orderId: shippingSlip.orderId,
      shippingSlip,
      customerInvoice,
      deliveryChallan,
      packingSticker,
      generatedAt: new Date().toISOString(),
      generatedBy,
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
    return db.prepare(`
      SELECT * FROM campaigns 
      WHERE isActive = 1 
        AND (CASE WHEN length(startDate) = 10 THEN startDate || 'T00:00:00.000Z' ELSE startDate END) <= ?
        AND (CASE WHEN length(endDate) = 10 THEN endDate || 'T23:59:59.999Z' ELSE endDate END) >= ?
        AND (usageLimit <= 0 OR usageCount < usageLimit)
      ORDER BY discountValue DESC
    `).all(now, now) as any[];
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
    const endFormatted = campaign.endDate && campaign.endDate.length === 10 ? campaign.endDate + "T23:59:59.999Z" : campaign.endDate;
    const startFormatted = campaign.startDate && campaign.startDate.length === 10 ? campaign.startDate + "T00:00:00.000Z" : campaign.startDate;

    if (endFormatted && now > endFormatted) {
      return { valid: false, message: "This promotional campaign has expired." };
    }
    if (startFormatted && now < startFormatted) {
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
  },

  getAdminRole(telegramId: string): "SUPER_ADMIN" | "STOCK_MANAGER" | null {
    const db = getDatabase();
    const cleanId = String(telegramId).trim();
    const row = db.prepare("SELECT role FROM telegram_allowed_admins WHERE telegramId = ?").get(cleanId) as { role: string } | undefined;
    if (row && (row.role === "STOCK_MANAGER" || row.role === "SUPER_ADMIN")) {
      return row.role as any;
    }
    const envAdmins = [
      ...(process.env.TELEGRAM_ALLOWED_ADMIN_IDS || "").split(","),
      ...(process.env.TELEGRAM_ADMIN_IDS || "").split(","),
    ].map((s) => s.trim()).filter(Boolean);
    if (envAdmins.includes(cleanId)) return "SUPER_ADMIN";
    return null;
  },

  getFounderAdminIds(): string[] {
    const db = getDatabase();
    const envAdmins = [
      ...(process.env.TELEGRAM_ALLOWED_ADMIN_IDS || "").split(","),
      ...(process.env.TELEGRAM_ADMIN_IDS || "").split(","),
    ].map((s) => s.trim()).filter(Boolean);
    const dbAdmins = db.prepare("SELECT telegramId FROM telegram_allowed_admins WHERE role = 'SUPER_ADMIN'").all() as { telegramId: string }[];
    const set = new Set([...envAdmins, ...dbAdmins.map((d) => String(d.telegramId).trim())]);
    return Array.from(set).filter(Boolean);
  },

  createStockRequest(data: {
    managerTelegramId: string;
    managerName: string;
    productSku: string;
    productName: string;
    currentStock: number;
    quantityChange: number;
    newStockTarget: number;
    requestType?: string;
    photoFileId?: string;
    photoUrl?: string;
    notes?: string;
  }) {
    const db = getDatabase();
    const id = "stk_req_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const requestNumber = "REQ-" + (1000 + Math.floor(Math.random() * 9000));
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO telegram_stock_requests (
        id, requestNumber, managerTelegramId, managerName,
        productSku, productName, currentStock, quantityChange,
        newStockTarget, requestType, photoFileId, photoUrl, notes,
        status, reviewedBy, reviewedAt, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, ?)
    `).run(
      id,
      requestNumber,
      data.managerTelegramId,
      data.managerName,
      data.productSku,
      data.productName,
      data.currentStock,
      data.quantityChange,
      data.newStockTarget,
      data.requestType || 'RESTOCK',
      data.photoFileId || null,
      data.photoUrl || null,
      data.notes || '',
      now
    );
    return db.prepare("SELECT * FROM telegram_stock_requests WHERE id = ?").get(id) as any;
  },

  getStockRequest(idOrNumber: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM telegram_stock_requests WHERE id = ? OR requestNumber = ?").get(idOrNumber, idOrNumber) as any;
  },

  listStockRequests(limit = 50) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM telegram_stock_requests ORDER BY createdAt DESC LIMIT ?").all(limit) as any[];
  },

  approveStockRequest(idOrNumber: string, reviewedBy: string) {
    const db = getDatabase();
    const req = db.prepare("SELECT * FROM telegram_stock_requests WHERE id = ? OR requestNumber = ?").get(idOrNumber, idOrNumber) as any;
    if (!req) return { success: false, error: "Request not found" };
    const now = new Date().toISOString();
    db.prepare("UPDATE telegram_stock_requests SET status = 'APPROVED', reviewedBy = ?, reviewedAt = ? WHERE id = ?")
      .run(reviewedBy, now, req.id);
    if (req.productSku && req.quantityChange) {
      const prod = db.prepare("SELECT id, stock FROM products WHERE sku = ?").get(req.productSku) as any;
      if (prod) {
        const newStock = Math.max(0, (prod.stock || 0) + req.quantityChange);
        inventoryRepo.updateStock(prod.id, newStock, `Telegram approval: ${req.requestNumber || req.id} by ${reviewedBy}`, `Admin:${reviewedBy}`);
      }
    }
    const updated = db.prepare("SELECT * FROM telegram_stock_requests WHERE id = ?").get(req.id) as any;
    return { success: true, request: updated };
  },

  rejectStockRequest(idOrNumber: string, reviewedBy: string, reason?: string) {
    const db = getDatabase();
    const req = db.prepare("SELECT * FROM telegram_stock_requests WHERE id = ? OR requestNumber = ?").get(idOrNumber, idOrNumber) as any;
    if (!req) return { success: false, error: "Request not found" };
    const now = new Date().toISOString();
    const updatedNotes = reason ? (req.notes ? `${req.notes} [Rejected: ${reason}]` : `Rejected: ${reason}`) : req.notes;
    db.prepare("UPDATE telegram_stock_requests SET status = 'REJECTED', reviewedBy = ?, reviewedAt = ?, notes = ? WHERE id = ?")
      .run(reviewedBy, now, updatedNotes, req.id);
    const updated = db.prepare("SELECT * FROM telegram_stock_requests WHERE id = ?").get(req.id) as any;
    return { success: true, request: updated };
  },

  updateAdminRole(telegramId: string, role: string) {
    const db = getDatabase();
    const res = db.prepare("UPDATE telegram_allowed_admins SET role = ? WHERE telegramId = ?").run(role, String(telegramId).trim());
    return res.changes > 0;
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

// ==========================================
// 23. PRODUCT ENQUIRIES REPOSITORY (PHASE 3)
// ==========================================
function mapEnquiryRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    enquiryNumber: row.enquiry_number,
    enquiry_number: row.enquiry_number,
    customerId: row.customer_id,
    customer_id: row.customer_id,
    customerName: row.customer_name,
    customer_name: row.customer_name,
    customerEmail: row.customer_email,
    customer_email: row.customer_email,
    customerPhone: row.customer_phone,
    customer_phone: row.customer_phone,
    productName: row.product_name,
    product_name: row.product_name,
    category: row.category,
    requestedQuantity: row.requested_quantity,
    requested_quantity: row.requested_quantity,
    preferredPackSize: row.preferred_pack_size,
    preferred_pack_size: row.preferred_pack_size,
    description: row.description,
    referenceImage: row.reference_image,
    reference_image: row.reference_image,
    status: row.status,
    adminNotes: row.admin_notes,
    admin_notes: row.admin_notes,
    reviewedAt: row.reviewed_at,
    reviewed_at: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewed_by: row.reviewed_by,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
  };
}

export const productEnquiriesRepo = {
  generateEnquiryNumber(): string {
    const db = getDatabase();
    const year = new Date().getFullYear();
    const prefix = `TRN-ENQ-${year}-`;
    const row = db.prepare(`
      SELECT count(*) as count FROM product_enquiries WHERE enquiry_number LIKE ?
    `).get(`${prefix}%`) as { count: number };
    const nextSeq = (row?.count || 0) + 1;
    return `${prefix}${String(nextSeq).padStart(5, "0")}`;
  },

  create(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    productName: string;
    category?: string | null;
    requestedQuantity: string;
    preferredPackSize?: string | null;
    description: string;
    referenceImage?: string | null;
  }) {
    const db = getDatabase();
    const id = "enq_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const enquiryNumber = this.generateEnquiryNumber();
    const now = new Date().toISOString();
    const status = "NEW";

    db.prepare(`
      INSERT INTO product_enquiries (
        id, enquiry_number, customer_id, customer_name, customer_email, customer_phone,
        product_name, category, requested_quantity, preferred_pack_size, description,
        reference_image, status, admin_notes, reviewed_at, reviewed_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)
    `).run(
      id,
      enquiryNumber,
      data.customerId,
      data.customerName,
      data.customerEmail,
      data.customerPhone || null,
      data.productName.trim(),
      data.category?.trim() || null,
      data.requestedQuantity.trim(),
      data.preferredPackSize?.trim() || null,
      data.description.trim(),
      data.referenceImage || null,
      status,
      now,
      now
    );

    return this.getById(id)!;
  },

  getById(id: string, customerId?: string) {
    const db = getDatabase();
    let row: any;
    if (customerId) {
      row = db.prepare("SELECT * FROM product_enquiries WHERE id = ? AND customer_id = ?").get(id, customerId);
    } else {
      row = db.prepare("SELECT * FROM product_enquiries WHERE id = ?").get(id);
    }
    return mapEnquiryRow(row);
  },

  getByEnquiryNumber(enquiryNumber: string, customerId?: string) {
    const db = getDatabase();
    let row: any;
    if (customerId) {
      row = db.prepare("SELECT * FROM product_enquiries WHERE enquiry_number = ? AND customer_id = ?").get(enquiryNumber, customerId);
    } else {
      row = db.prepare("SELECT * FROM product_enquiries WHERE enquiry_number = ?").get(enquiryNumber);
    }
    return mapEnquiryRow(row);
  },

  getByCustomerId(customerId: string) {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM product_enquiries WHERE customer_id = ? ORDER BY created_at DESC").all(customerId) as any[];
    return rows.map(mapEnquiryRow);
  },

  adminList(filters: { status?: string; search?: string } = {}) {
    const db = getDatabase();
    let query = "SELECT * FROM product_enquiries WHERE 1=1";
    const params: any[] = [];

    if (filters.status && filters.status !== "ALL") {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.search && filters.search.trim()) {
      query += " AND (enquiry_number LIKE ? OR product_name LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ?)";
      const term = `%${filters.search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    query += " ORDER BY created_at DESC";
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(mapEnquiryRow);
  },

  adminUpdateStatus(id: string, status: string, adminNotes?: string, adminName?: string) {
    const db = getDatabase();
    const validStatuses = ["NEW", "UNDER_REVIEW", "SOURCING", "AVAILABLE", "UNABLE_TO_SOURCE", "CLOSED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of ${validStatuses.join(", ")}`);
    }

    const now = new Date().toISOString();
    let query = "UPDATE product_enquiries SET status = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?";
    const params: any[] = [status, now, adminName || "Administrator", now];

    if (adminNotes !== undefined) {
      query += ", admin_notes = ?";
      params.push(adminNotes.trim());
    }

    query += " WHERE id = ?";
    params.push(id);

    db.prepare(query).run(...params);
    return this.getById(id);
  },
};

// ==========================================
// RETAIL OPERATIONS REPOSITORIES (PHASE 4)
// ==========================================

function formatBranch(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    pinCode: row.pin_code,
    phone: row.phone,
    email: row.email,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const retailBranchesRepo = {
  getAll(includeInactive = false) {
    const db = getDatabase();
    const sql = includeInactive
      ? "SELECT * FROM retail_branches ORDER BY name ASC"
      : "SELECT * FROM retail_branches WHERE is_active = 1 ORDER BY name ASC";
    const rows = db.prepare(sql).all() as any[];
    return rows.map(formatBranch);
  },

  getById(id: string) {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM retail_branches WHERE id = ?").get(id) as any;
    return row ? formatBranch(row) : null;
  },

  getByCode(code: string) {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM retail_branches WHERE UPPER(code) = ?").get(code.toUpperCase().trim()) as any;
    return row ? formatBranch(row) : null;
  },

  create(data: { code: string; name: string; address: string; city: string; state?: string; pinCode: string; phone: string; email?: string }) {
    const db = getDatabase();
    const id = "brn_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const now = new Date().toISOString();
    const code = data.code.toUpperCase().trim();
    const existing = this.getByCode(code);
    if (existing) {
      throw new Error(`Branch with code "${code}" already exists`);
    }
    db.prepare(`
      INSERT INTO retail_branches (id, code, name, address, city, state, pin_code, phone, email, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, code, data.name.trim(), data.address.trim(), data.city.trim(), data.state || "Tamil Nadu", data.pinCode.trim(), data.phone.trim(), data.email?.trim() || null, now, now);

    // Automatically seed all existing products into this new branch with initial stock
    const prods = db.prepare("SELECT id, sku FROM products WHERE status != 'Archived'").all() as any[];
    for (const p of prods) {
      db.prepare(`
        INSERT INTO retail_branch_stock (id, branch_id, product_id, sku, stock_quantity, low_stock_threshold, updated_at)
        VALUES (?, ?, ?, ?, 50, 10, ?)
        ON CONFLICT(branch_id, product_id, sku) DO NOTHING
      `).run(`rbs_${id}_${p.id}`, id, p.id, p.sku, now);
    }
    return this.getById(id);
  },

  update(id: string, data: { name?: string; address?: string; city?: string; state?: string; pinCode?: string; phone?: string; email?: string; isActive?: number }) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) throw new Error("Branch not found");
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name.trim()); }
    if (data.address !== undefined) { fields.push("address = ?"); values.push(data.address.trim()); }
    if (data.city !== undefined) { fields.push("city = ?"); values.push(data.city.trim()); }
    if (data.state !== undefined) { fields.push("state = ?"); values.push(data.state.trim()); }
    if (data.pinCode !== undefined) { fields.push("pin_code = ?"); values.push(data.pinCode.trim()); }
    if (data.phone !== undefined) { fields.push("phone = ?"); values.push(data.phone.trim()); }
    if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email?.trim() || null); }
    if (data.isActive !== undefined) { fields.push("is_active = ?"); values.push(data.isActive); }
    fields.push("updated_at = ?");
    values.push(now);
    values.push(id);
    db.prepare(`UPDATE retail_branches SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.getById(id);
  },

  delete(id: string) {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) throw new Error("Branch not found");
    const salesCount = (db.prepare("SELECT COUNT(*) as c FROM retail_sales WHERE branch_id = ?").get(id) as any)?.c || 0;
    if (salesCount > 0) {
      db.prepare("UPDATE retail_branches SET is_active = 0, updated_at = ? WHERE id = ?").run(new Date().toISOString(), id);
      return { success: true, softDeleted: true, message: `Branch "${existing.name}" deactivated (${salesCount} historical sales retained)` };
    }
    db.prepare("DELETE FROM retail_branch_stock WHERE branch_id = ?").run(id);
    db.prepare("DELETE FROM retail_branches WHERE id = ?").run(id);
    return { success: true, softDeleted: false, message: `Branch "${existing.name}" deleted successfully` };
  }
};

export const retailStockRepo = {
  getBranchStock(branchId: string, options: { search?: string; status?: string; limit?: number; offset?: number } = {}) {
    const db = getDatabase();
    let sql = `
      SELECT s.id, s.branch_id as branchId, s.product_id as productId, s.sku, s.stock_quantity as stockQuantity,
             s.low_stock_threshold as lowStockThreshold, s.updated_at as updatedAt,
             p.nameEn, p.nameTa, p.sellingPrice, p.mrp, p.primaryImage, p.productType,
             c.name as categoryName
      FROM retail_branch_stock s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE s.branch_id = ? AND p.status != 'Archived'
    `;
    const params: any[] = [branchId];
    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      sql += " AND (p.nameEn LIKE ? OR p.nameTa LIKE ? OR s.sku LIKE ? OR c.name LIKE ?)";
      params.push(term, term, term, term);
    }
    if (options.status === "in_stock") {
      sql += " AND s.stock_quantity > s.low_stock_threshold";
    } else if (options.status === "low_stock") {
      sql += " AND s.stock_quantity > 0 AND s.stock_quantity <= s.low_stock_threshold";
    } else if (options.status === "out_of_stock") {
      sql += " AND s.stock_quantity <= 0";
    }
    sql += " ORDER BY s.stock_quantity ASC, p.nameEn ASC LIMIT ? OFFSET ?";
    params.push(options.limit || 200, options.offset || 0);

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map((r: any) => {
      let stockStatus = "In Stock";
      if (r.stockQuantity <= 0) stockStatus = "Out of Stock";
      else if (r.stockQuantity <= r.lowStockThreshold) stockStatus = "Low Stock";
      return {
        ...r,
        stockStatus,
      };
    });
  },

  getItemStock(branchId: string, productId: string, sku?: string) {
    const db = getDatabase();
    let sql = "SELECT * FROM retail_branch_stock WHERE branch_id = ? AND product_id = ?";
    const params: any[] = [branchId, productId];
    if (sku) {
      sql += " AND sku = ?";
      params.push(sku);
    }
    return db.prepare(sql).get(...params) as any;
  },

  adjustBranchStock(branchId: string, productId: string, sku: string, delta: number, changeType: string, referenceId: string | null, reason: string, actor: string) {
    const db = getDatabase();
    const item = db.prepare("SELECT * FROM retail_branch_stock WHERE branch_id = ? AND product_id = ?").get(branchId, productId) as any;
    if (!item) {
      throw new Error(`Product not found in branch stock`);
    }
    const previousStock = item.stock_quantity;
    const newStock = previousStock + delta;
    if (newStock < 0) {
      throw new Error(`Insufficient stock. Current: ${previousStock}, cannot deduct ${Math.abs(delta)}`);
    }
    const now = new Date().toISOString();
    db.prepare("UPDATE retail_branch_stock SET stock_quantity = ?, updated_at = ? WHERE id = ?").run(newStock, now, item.id);

    const movId = "mov_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO retail_stock_movements (id, branch_id, product_id, sku, change_type, delta, previous_stock, new_stock, reference_id, reason, performed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(movId, branchId, productId, sku, changeType, delta, previousStock, newStock, referenceId, reason, actor, now);

    return { previousStock, newStock, delta };
  },

  requestAdjustment(data: { branchId: string; productId: string; sku: string; requestedDelta: number; reason: string; requestedBy: string }) {
    const db = getDatabase();
    const id = "adj_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const count = (db.prepare("SELECT COUNT(*) as count FROM retail_stock_adjustments").get() as any)?.count || 0;
    const adjustmentNumber = `TRN-ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO retail_stock_adjustments (id, adjustment_number, branch_id, product_id, sku, requested_delta, reason, status, requested_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
    `).run(id, adjustmentNumber, data.branchId, data.productId, data.sku, data.requestedDelta, data.reason, data.requestedBy, now, now);

    return db.prepare("SELECT * FROM retail_stock_adjustments WHERE id = ?").get(id);
  },

  listAdjustments(branchId?: string, status?: string) {
    const db = getDatabase();
    let sql = `
      SELECT a.*, p.nameEn as productName, b.name as branchName
      FROM retail_stock_adjustments a
      JOIN products p ON a.product_id = p.id
      JOIN retail_branches b ON a.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (branchId) {
      sql += " AND a.branch_id = ?";
      params.push(branchId);
    }
    if (status && status !== "ALL") {
      sql += " AND a.status = ?";
      params.push(status);
    }
    sql += " ORDER BY a.created_at DESC";
    return db.prepare(sql).all(...params) as any[];
  },

  reviewAdjustment(id: string, status: "APPROVED" | "REJECTED", reviewedBy: string, adminNotes?: string) {
    const db = getDatabase();
    const adj = db.prepare("SELECT * FROM retail_stock_adjustments WHERE id = ?").get(id) as any;
    if (!adj) throw new Error("Adjustment request not found");
    if (adj.status !== "PENDING") throw new Error(`Adjustment already ${adj.status.toLowerCase()}`);

    const now = new Date().toISOString();
    if (status === "APPROVED") {
      this.adjustBranchStock(
        adj.branch_id,
        adj.product_id,
        adj.sku,
        adj.requested_delta,
        "ADJUSTMENT",
        adj.adjustment_number,
        adj.reason + (adminNotes ? ` (Admin: ${adminNotes})` : ""),
        reviewedBy
      );
    }

    db.prepare(`
      UPDATE retail_stock_adjustments
      SET status = ?, reviewed_by = ?, reviewed_at = ?, admin_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(status, reviewedBy, now, adminNotes || null, now, id);

    return db.prepare("SELECT * FROM retail_stock_adjustments WHERE id = ?").get(id);
  },

  getMovements(branchId: string, limit = 50) {
    const db = getDatabase();
    return db.prepare(`
      SELECT m.*, p.nameEn as productName
      FROM retail_stock_movements m
      JOIN products p ON m.product_id = p.id
      WHERE m.branch_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(branchId, limit) as any[];
  }
};

export const retailSalesRepo = {
  generateInvoiceNumber() {
    const db = getDatabase();
    const year = new Date().getFullYear();
    const count = (db.prepare("SELECT COUNT(*) as count FROM retail_sales").get() as any)?.count || 0;
    return `TRN-RET-${year}-${String(count + 1).padStart(5, "0")}`;
  },

  processSale(
    saleData: {
      branchId: string;
      handlerId: string;
      handlerName: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      discountAmount?: number;
      discountReason?: string;
      taxAmount?: number;
      paymentMethod: "CASH" | "UPI" | "CARD";
      notes?: string;
    },
    items: Array<{ productId: string; sku?: string; packSize: string; unitPrice: number; quantity: number }>
  ) {
    if (!items || items.length === 0) {
      throw new Error("Cannot process a sale with an empty cart");
    }
    const db = getDatabase();
    const branch = retailBranchesRepo.getById(saleData.branchId);
    if (!branch) throw new Error("Branch not found");

    // Begin database transaction for atomic validation & stock deduction
    db.exec("BEGIN IMMEDIATE;");
    try {
      let subtotal = 0;
      const verifiedItems: any[] = [];

      // 1. Validate stock availability for all items
      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new Error("Quantity must be greater than zero");
        }
        const prod = db.prepare("SELECT * FROM products WHERE id = ?").get(item.productId) as any;
        if (!prod) throw new Error(`Product not found (ID: ${item.productId})`);

        const sku = item.sku || prod.sku;
        const stockRow = db.prepare("SELECT * FROM retail_branch_stock WHERE branch_id = ? AND product_id = ?").get(saleData.branchId, item.productId) as any;
        const availableStock = stockRow ? stockRow.stock_quantity : 0;

        if (availableStock < item.quantity) {
          throw new Error(`Insufficient branch stock for "${prod.nameEn}". Requested: ${item.quantity}, Available: ${availableStock}`);
        }

        const totalPrice = item.unitPrice * item.quantity;
        subtotal += totalPrice;
        verifiedItems.push({
          productId: prod.id,
          productName: prod.nameEn,
          sku,
          packSize: item.packSize || "Standard",
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice,
          availableStock,
          stockRowId: stockRow.id,
        });
      }

      const discountAmount = Math.max(0, saleData.discountAmount || 0);
      const taxAmount = Math.max(0, saleData.taxAmount || 0);
      const total = Math.max(0, subtotal - discountAmount + taxAmount);

      const saleId = "sale_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const invoiceNumber = this.generateInvoiceNumber();
      const now = new Date().toISOString();

      // 2. Insert Retail Sale
      db.prepare(`
        INSERT INTO retail_sales (
          id, invoice_number, branch_id, handler_id, handler_name, customer_name,
          customer_phone, customer_email, subtotal, discount_amount, discount_reason,
          tax_amount, total, payment_method, payment_status, sale_status, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', 'COMPLETED', ?, ?, ?)
      `).run(
        saleId,
        invoiceNumber,
        saleData.branchId,
        saleData.handlerId,
        saleData.handlerName,
        saleData.customerName?.trim() || "Walk-in Customer",
        saleData.customerPhone?.trim() || null,
        saleData.customerEmail?.trim() || null,
        subtotal,
        discountAmount,
        saleData.discountReason || null,
        taxAmount,
        total,
        saleData.paymentMethod,
        saleData.notes || null,
        now,
        now
      );

      // 3. Insert Line Items and Deduct Branch Stock atomically
      for (const item of verifiedItems) {
        const itemId = "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
        db.prepare(`
          INSERT INTO retail_sale_items (
            id, sale_id, product_id, product_name, sku, pack_size, unit_price, quantity, total_price, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          itemId,
          saleId,
          item.productId,
          item.productName,
          item.sku,
          item.packSize,
          item.unitPrice,
          item.quantity,
          item.totalPrice,
          now
        );

        // Deduct branch stock
        const newStock = item.availableStock - item.quantity;
        db.prepare("UPDATE retail_branch_stock SET stock_quantity = ?, updated_at = ? WHERE id = ?")
          .run(newStock, now, item.stockRowId);

        // Record stock movement
        const movId = "mov_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        db.prepare(`
          INSERT INTO retail_stock_movements (
            id, branch_id, product_id, sku, change_type, delta, previous_stock, new_stock, reference_id, reason, performed_by, created_at
          ) VALUES (?, ?, ?, ?, 'SALE', ?, ?, ?, ?, 'Retail Sale POS', ?, ?)
        `).run(
          movId,
          saleData.branchId,
          item.productId,
          item.sku,
          -item.quantity,
          item.availableStock,
          newStock,
          invoiceNumber,
          saleData.handlerName,
          now
        );
      }

      db.exec("COMMIT;");
      return this.getSaleById(saleId);
    } catch (err) {
      try {
        db.exec("ROLLBACK;");
      } catch {}
      throw err;
    }
  },

  getSaleById(id: string) {
    const db = getDatabase();
    const sale = db.prepare(`
      SELECT s.*, b.name as branchName, b.code as branchCode, b.address as branchAddress,
             b.city as branchCity, b.state as branchState, b.pin_code as branchPinCode,
             b.phone as branchPhone, b.email as branchEmail
      FROM retail_sales s
      JOIN retail_branches b ON s.branch_id = b.id
      WHERE s.id = ?
    `).get(id) as any;
    if (!sale) return null;

    const items = db.prepare("SELECT * FROM retail_sale_items WHERE sale_id = ? ORDER BY created_at ASC").all(id) as any[];
    return { ...sale, items };
  },

  getSaleByInvoice(invoiceNumber: string) {
    const db = getDatabase();
    const sale = db.prepare(`
      SELECT s.*, b.name as branchName, b.code as branchCode, b.address as branchAddress,
             b.city as branchCity, b.state as branchState, b.pin_code as branchPinCode,
             b.phone as branchPhone, b.email as branchEmail
      FROM retail_sales s
      JOIN retail_branches b ON s.branch_id = b.id
      WHERE s.invoice_number = ?
    `).get(invoiceNumber) as any;
    if (!sale) return null;

    const items = db.prepare("SELECT * FROM retail_sale_items WHERE sale_id = ? ORDER BY created_at ASC").all(sale.id) as any[];
    return { ...sale, items };
  },

  listSales(options: {
    branchId?: string;
    search?: string;
    paymentMethod?: string;
    saleStatus?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const db = getDatabase();
    let sql = `
      SELECT s.*, b.name as branchName, b.code as branchCode,
             (SELECT COUNT(*) FROM retail_sale_items WHERE sale_id = s.id) as itemCount
      FROM retail_sales s
      JOIN retail_branches b ON s.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (options.branchId) {
      sql += " AND s.branch_id = ?";
      params.push(options.branchId);
    }
    if (options.paymentMethod && options.paymentMethod !== "ALL") {
      sql += " AND s.payment_method = ?";
      params.push(options.paymentMethod);
    }
    if (options.saleStatus && options.saleStatus !== "ALL") {
      sql += " AND s.sale_status = ?";
      params.push(options.saleStatus);
    }
    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      sql += " AND (s.invoice_number LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ?)";
      params.push(term, term, term);
    }
    sql += " ORDER BY s.created_at DESC LIMIT ? OFFSET ?";
    params.push(options.limit || 50, options.offset || 0);

    return db.prepare(sql).all(...params) as any[];
  },

  cancelOrRefundSale(saleId: string, reason: string, actor: string) {
    const db = getDatabase();
    const sale = this.getSaleById(saleId);
    if (!sale) throw new Error("Sale not found");
    if (sale.sale_status === "CANCELLED") throw new Error("Sale has already been cancelled");

    db.exec("BEGIN IMMEDIATE;");
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE retail_sales
        SET sale_status = 'CANCELLED', payment_status = 'REFUNDED', notes = COALESCE(notes || ' | ', '') || ?, updated_at = ?
        WHERE id = ?
      `).run(`Cancelled by ${actor}: ${reason}`, now, saleId);

      // Reverse branch stock
      for (const item of sale.items) {
        const stockRow = db.prepare("SELECT * FROM retail_branch_stock WHERE branch_id = ? AND product_id = ?").get(sale.branch_id, item.product_id) as any;
        if (stockRow) {
          const newStock = stockRow.stock_quantity + item.quantity;
          db.prepare("UPDATE retail_branch_stock SET stock_quantity = ?, updated_at = ? WHERE id = ?").run(newStock, now, stockRow.id);

          const movId = "mov_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
          db.prepare(`
            INSERT INTO retail_stock_movements (
              id, branch_id, product_id, sku, change_type, delta, previous_stock, new_stock, reference_id, reason, performed_by, created_at
            ) VALUES (?, ?, ?, ?, 'RETURN', ?, ?, ?, ?, ?, ?, ?)
          `).run(
            movId,
            sale.branch_id,
            item.product_id,
            item.sku,
            item.quantity,
            stockRow.stock_quantity,
            newStock,
            sale.invoice_number,
            `Sale Cancellation: ${reason}`,
            actor,
            now
          );
        }
      }
      db.exec("COMMIT;");
      return this.getSaleById(saleId);
    } catch (err) {
      try { db.exec("ROLLBACK;"); } catch {}
      throw err;
    }
  },

  getSalesMetrics(branchId?: string) {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);
    let todaySql = "SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM retail_sales WHERE sale_status = 'COMPLETED' AND created_at LIKE ?";
    let overallSql = "SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM retail_sales WHERE sale_status = 'COMPLETED'";
    const todayParams: any[] = [`${today}%`];
    const overallParams: any[] = [];

    if (branchId) {
      todaySql += " AND branch_id = ?";
      todayParams.push(branchId);
      overallSql += " AND branch_id = ?";
      overallParams.push(branchId);
    }

    const todayStats = db.prepare(todaySql).get(...todayParams) as any;
    const overallStats = db.prepare(overallSql).get(...overallParams) as any;

    return {
      todayCount: todayStats?.count || 0,
      todayRevenue: todayStats?.revenue || 0,
      totalCount: overallStats?.count || 0,
      totalRevenue: overallStats?.revenue || 0,
    };
  }
};



// ==========================================
// 30. ORDER RETURNS & RMA REPOSITORY (Phase 6)
// ==========================================
export const orderReturnsRepo = {
  getNextRmaNumber(year: number): string {
    const db = getDatabase();
    const prefix = `TRN-RMA-${year}-%`;
    const row = db.prepare(
      "SELECT MAX(CAST(SUBSTR(return_number, -5) AS INTEGER)) as maxSeq FROM order_returns WHERE return_number LIKE ?"
    ).get(prefix) as any;
    const nextSeq = (row?.maxSeq || 0) + 1;
    return `TRN-RMA-${year}-${String(nextSeq).padStart(5, "0")}`;
  },

  createReturn(input: {
    orderId?: string;
    orderNumber?: string;
    customerId: string;
    orderItemId?: string;
    productId?: string;
    quantityRequested: number;
    returnReason: string;
    description: string;
    supportingImage?: string | null;
    pickupInstructions?: string | null;
  }) {
    const db = getDatabase();

    // 1. Fetch order
    let order: any = null;
    if (input.orderId) {
      order = ordersRepo.getById(input.orderId);
    } else if (input.orderNumber) {
      order = ordersRepo.getByOrderNumber(input.orderNumber);
    }
    if (!order) {
      throw new Error("Order not found");
    }

    // 2. Verify ownership
    if (order.customerId && order.customerId !== input.customerId) {
      throw new Error("Unauthorized: Order does not belong to this customer");
    }

    // 3. Verify order status is Delivered
    const orderStatusNorm = (order.orderStatus || "").trim().toLowerCase();
    if (orderStatusNorm !== "delivered" && orderStatusNorm !== "completed") {
      throw new Error("Return requests can only be initiated for delivered orders.");
    }

    // 4. Match order item
    const items = order.items || [];
    let matchedItem = null;
    if (input.orderItemId) {
      matchedItem = items.find((it: any) => it.id === input.orderItemId);
    }
    if (!matchedItem && input.productId) {
      matchedItem = items.find((it: any) => it.productId === input.productId);
    }
    if (!matchedItem && items.length === 1) {
      matchedItem = items[0];
    }
    if (!matchedItem) {
      throw new Error("Item not found in order");
    }

    // 5. Validate quantity requested
    const qty = Number(input.quantityRequested);
    if (!qty || qty < 1) {
      throw new Error("Quantity requested must be at least 1");
    }
    if (qty > matchedItem.quantity) {
      throw new Error(`Return quantity cannot exceed delivered quantity (maximum allowed: ${matchedItem.quantity})`);
    }

    // 6. Check duplicate active return
    const activeReturn = db.prepare(`
      SELECT * FROM order_returns
      WHERE order_id = ? AND product_id = ? AND status NOT IN ('REJECTED', 'CLOSED')
    `).get(order.id, matchedItem.productId) as any;
    if (activeReturn) {
      throw new Error(`A return request (${activeReturn.return_number}) is already active for this item.`);
    }

    // 7. Calculate authoritative refund amount
    const unitPrice = Number(matchedItem.price || matchedItem.unitPrice || 0);
    const refundAmount = Math.round(unitPrice * qty * 100) / 100;

    // 8. Generate RMA number with retry on race condition
    const year = new Date().getFullYear();
    let attempts = 0;
    while (attempts < 10) {
      const returnNumber = this.getNextRmaNumber(year);
      const returnId = "ret_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const now = new Date().toISOString();

      try {
        db.prepare(`
          INSERT INTO order_returns (
            id, return_number, order_id, order_number, customer_id, customer_name,
            customer_email, customer_phone, order_item_id, product_id, product_name,
            sku, pack_size, quantity_requested, quantity_received, quantity_inspected,
            item_price, refund_amount, return_reason, description, supporting_image,
            pickup_instructions, status, stock_disposition, restocked_quantity,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, 'REQUESTED', 'NONE', 0, ?, ?)
        `).run(
          returnId,
          returnNumber,
          order.id,
          order.orderNumber,
          order.customerId || input.customerId,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          matchedItem.id || null,
          matchedItem.productId,
          matchedItem.productNameEn || matchedItem.name,
          matchedItem.sku || `TRN-${matchedItem.productId}`,
          matchedItem.packSize || "100g",
          qty,
          unitPrice,
          refundAmount,
          input.returnReason,
          input.description,
          input.supportingImage || null,
          input.pickupInstructions || null,
          now,
          now
        );

        // Initial history record
        const histId = "rh_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        db.prepare(`
          INSERT INTO order_return_history (
            id, return_id, from_status, to_status, action, actor, note, created_at
          ) VALUES (?, ?, NULL, 'REQUESTED', 'RETURN_REQUESTED', ?, ?, ?)
        `).run(
          histId,
          returnId,
          order.customerName || order.customerId || "Customer",
          `Customer initiated return request for ${qty}x ${matchedItem.productNameEn || matchedItem.name}. Reason: ${input.returnReason}`,
          now
        );

        return this.getById(returnId);
      } catch (err: any) {
        if (err?.message?.includes("UNIQUE constraint failed: order_returns.return_number")) {
          attempts++;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Failed to generate unique RMA number after 10 attempts");
  },

  getById(idOrNumber: string) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM order_returns WHERE id = ? OR return_number = ?
    `).get(idOrNumber, idOrNumber) as any;
    if (!row) return null;
    return this.enrichReturn(row);
  },

  listByCustomer(customerId: string) {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM order_returns WHERE customer_id = ? ORDER BY created_at DESC
    `).all(customerId) as any[];
    return rows.map((r) => this.enrichReturn(r));
  },

  listAll(options: { search?: string; status?: string; limit?: number; offset?: number } = {}) {
    const db = getDatabase();
    let query = "SELECT * FROM order_returns WHERE 1=1";
    const params: any[] = [];
    if (options.status && options.status !== "ALL") {
      query += " AND status = ?";
      params.push(options.status);
    }
    if (options.search) {
      query += " AND (return_number LIKE ? OR order_number LIKE ? OR customer_name LIKE ? OR product_name LIKE ?)";
      const term = `%${options.search}%`;
      params.push(term, term, term, term);
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(options.limit || 100, options.offset || 0);

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => this.enrichReturn(r));
  },

  enrichReturn(row: any) {
    const db = getDatabase();
    const history = db.prepare(`
      SELECT * FROM order_return_history WHERE return_id = ? ORDER BY created_at ASC
    `).all(row.id) as any[];

    return {
      id: row.id,
      returnNumber: row.return_number,
      orderId: row.order_id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      orderItemId: row.order_item_id,
      productId: row.product_id,
      productName: row.product_name,
      sku: row.sku,
      packSize: row.pack_size,
      quantityRequested: row.quantity_requested,
      quantityReceived: row.quantity_received,
      quantityInspected: row.quantity_inspected,
      itemPrice: row.item_price,
      refundAmount: row.refund_amount,
      returnReason: row.return_reason,
      description: row.description,
      supportingImage: row.supporting_image,
      pickupInstructions: row.pickup_instructions,
      status: row.status,
      stockDisposition: row.stock_disposition,
      restockedQuantity: row.restocked_quantity,
      refundMethod: row.refund_method,
      refundReference: row.refund_reference,
      refundedAt: row.refunded_at,
      adminNotes: row.admin_notes,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      history: history.map((h: any) => ({
        id: h.id,
        returnId: h.return_id,
        fromStatus: h.from_status,
        toStatus: h.to_status,
        action: h.action,
        actor: h.actor,
        note: h.note,
        createdAt: h.created_at,
      })),
    };
  },

  updateStatus(id: string, input: {
    status: string;
    adminNotes?: string;
    actor?: string;
    quantityReceived?: number;
    quantityInspected?: number;
    stockDisposition?: string;
    restockedQuantity?: number;
    refundMethod?: string;
    refundReference?: string;
  }) {
    const db = getDatabase();
    const ret = db.prepare("SELECT * FROM order_returns WHERE id = ? OR return_number = ?").get(id, id) as any;
    if (!ret) throw new Error("Return request not found");

    const validStatuses = [
      "REQUESTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "PICKUP_SCHEDULED",
      "ITEM_RECEIVED",
      "INSPECTED",
      "REFUND_PENDING",
      "REFUNDED",
      "CLOSED"
    ];

    const newStatus = (input.status || "").trim().toUpperCase();
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${input.status}. Must be one of: ${validStatuses.join(", ")}`);
    }

    const currentStatus = ret.status;
    const now = new Date().toISOString();
    const actor = input.actor || "Admin";

    // Validate invalid backwards transitions from terminal states
    if (currentStatus === "CLOSED" && newStatus !== "CLOSED") {
      throw new Error("Cannot alter status of a closed return request");
    }
    if (currentStatus === "REJECTED" && newStatus !== "REJECTED" && newStatus !== "CLOSED") {
      throw new Error("Cannot change status of a rejected return request");
    }

    // Stock disposition handling
    let newDisposition = input.stockDisposition || ret.stock_disposition || "NONE";
    let restockedQty = ret.restocked_quantity || 0;

    // Safety: If stockDisposition is RESTOCKED, restock inventory exactly once!
    if (newDisposition === "RESTOCKED" && restockedQty === 0) {
      const qtyToRestock = Number(input.restockedQuantity || input.quantityInspected || ret.quantity_requested || 1);
      if (qtyToRestock > 0) {
        inventoryRepo.adjustStock(
          ret.product_id,
          null,
          qtyToRestock,
          "RETURN_RESTOCK",
          ret.return_number,
          `Restocked from return inspection for RMA ${ret.return_number}`,
          actor
        );
        restockedQty = qtyToRestock;
      }
    }

    // Refund fields handling
    let refundMethod = ret.refund_method;
    let refundReference = ret.refund_reference;
    let refundedAt = ret.refunded_at;

    if (newStatus === "REFUNDED") {
      refundMethod = input.refundMethod || ret.refund_method || "MANUAL_COD_RECORD";
      refundReference = input.refundReference || ret.refund_reference || `REF-${ret.return_number}-${Date.now()}`;
      refundedAt = ret.refunded_at || now;
    }

    const qtyRecv = input.quantityReceived !== undefined ? input.quantityReceived : ret.quantity_received;
    const qtyInsp = input.quantityInspected !== undefined ? input.quantityInspected : ret.quantity_inspected;
    const adminNotes = input.adminNotes !== undefined ? input.adminNotes : ret.admin_notes;

    db.prepare(`
      UPDATE order_returns
      SET status = ?,
          stock_disposition = ?,
          restocked_quantity = ?,
          quantity_received = ?,
          quantity_inspected = ?,
          refund_method = ?,
          refund_reference = ?,
          refunded_at = ?,
          admin_notes = ?,
          reviewed_by = ?,
          reviewed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      newStatus,
      newDisposition,
      restockedQty,
      qtyRecv,
      qtyInsp,
      refundMethod,
      refundReference,
      refundedAt,
      adminNotes,
      actor,
      now,
      now,
      ret.id
    );

    // Insert history
    const histId = "rh_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO order_return_history (
        id, return_id, from_status, to_status, action, actor, note, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      histId,
      ret.id,
      currentStatus,
      newStatus,
      `STATUS_CHANGE_${newStatus}`,
      actor,
      input.adminNotes || `Status updated from ${currentStatus} to ${newStatus}`,
      now
    );

    return this.getById(ret.id);
  }
};


// ==========================================
// 30. PRODUCT SUBSCRIPTIONS REPOSITORY (PHASE 7)
// ==========================================
export const subscriptionsRepo = {
  getNextSubscriptionNumber(year: number): string {
    const db = getDatabase();
    const prefix = `TRN-SUB-${year}-%`;
    const row = db.prepare(
      "SELECT MAX(CAST(SUBSTR(subscription_number, -5) AS INTEGER)) as maxSeq FROM customer_subscriptions WHERE subscription_number LIKE ?"
    ).get(prefix) as any;
    const nextSeq = (row?.maxSeq || 0) + 1;
    return `TRN-SUB-${year}-${String(nextSeq).padStart(5, "0")}`;
  },

  enrichSubscription(sub: any) {
    if (!sub) return null;
    const db = getDatabase();

    let productSnapshot: any = {};
    try {
      productSnapshot = typeof sub.product_snapshot === "string" ? JSON.parse(sub.product_snapshot) : (sub.product_snapshot || {});
    } catch {
      productSnapshot = {};
    }

    let deliveryAddress: any = {};
    try {
      deliveryAddress = typeof sub.delivery_address === "string" ? JSON.parse(sub.delivery_address) : (sub.delivery_address || {});
    } catch {
      deliveryAddress = {};
    }

    const cycles = db.prepare(
      "SELECT * FROM subscription_cycles WHERE subscription_id = ? ORDER BY cycle_number ASC"
    ).all(sub.id) as any[];

    const history = db.prepare(
      "SELECT * FROM subscription_history WHERE subscription_id = ? ORDER BY created_at DESC"
    ).all(sub.id) as any[];

    const orders = db.prepare(
      "SELECT id, orderNumber, total, orderStatus, paymentStatus, paymentMethod, createdAt FROM orders WHERE subscriptionId = ? ORDER BY createdAt DESC"
    ).all(sub.id) as any[];

    return {
      id: sub.id,
      subscriptionNumber: sub.subscription_number,
      customerId: sub.customer_id,
      customerName: sub.customer_name,
      customerEmail: sub.customer_email,
      customerPhone: sub.customer_phone,
      productId: sub.product_id,
      variantId: sub.variant_id,
      productName: sub.product_name,
      productSku: sub.product_sku,
      variantLabel: sub.variant_label,
      productSnapshot,
      quantity: sub.quantity,
      unitPrice: sub.unit_price,
      subtotal: sub.subtotal,
      shippingFee: sub.shipping_fee,
      totalPerCycle: sub.total_per_cycle,
      frequency: sub.frequency,
      frequencyDays: sub.frequency_days,
      startDate: sub.start_date,
      nextDeliveryDate: sub.next_delivery_date,
      lastOrderDate: sub.last_order_date,
      deliveryAddress,
      deliveryInstructions: sub.delivery_instructions,
      paymentPreference: sub.payment_preference,
      status: sub.status,
      pauseReason: sub.pause_reason,
      cancellationReason: sub.cancellation_reason,
      cancelledAt: sub.cancelled_at,
      pausedAt: sub.paused_at,
      cycleCount: sub.cycle_count,
      failureReason: sub.failure_reason,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
      cycles,
      history,
      orders,
      // snake_case compatibility
      subscription_number: sub.subscription_number,
      customer_id: sub.customer_id,
      customer_name: sub.customer_name,
      customer_email: sub.customer_email,
      customer_phone: sub.customer_phone,
      product_id: sub.product_id,
      variant_id: sub.variant_id,
      product_name: sub.product_name,
      product_sku: sub.product_sku,
      variant_label: sub.variant_label,
      product_snapshot: productSnapshot,
      unit_price: sub.unit_price,
      shipping_fee: sub.shipping_fee,
      total_per_cycle: sub.total_per_cycle,
      frequency_days: sub.frequency_days,
      start_date: sub.start_date,
      next_delivery_date: sub.next_delivery_date,
      last_order_date: sub.last_order_date,
      delivery_address: deliveryAddress,
      delivery_instructions: sub.delivery_instructions,
      payment_preference: sub.payment_preference,
      pause_reason: sub.pause_reason,
      cancellation_reason: sub.cancellation_reason,
      cancelled_at: sub.cancelled_at,
      paused_at: sub.paused_at,
      cycle_count: sub.cycle_count,
      failure_reason: sub.failure_reason,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
    };
  },

  getFrequencyDays(frequency: string): number {
    switch (frequency) {
      case "15_DAYS": return 15;
      case "30_DAYS": return 30;
      case "45_DAYS": return 45;
      case "60_DAYS": return 60;
      case "90_DAYS": return 90;
      default: return 30;
    }
  },

  create(input: {
    customerId: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    productId: string;
    variantId?: string | null;
    quantity: number;
    frequency: string;
    deliveryAddress: any;
    deliveryInstructions?: string | null;
    paymentPreference?: string;
    startDate?: string | null;
  }) {
    const db = getDatabase();

    // 1. Fetch customer
    const customer = usersRepo.getById(input.customerId);
    const customerName = input.customerName || customer?.name || "Valued Subscriber";
    const customerEmail = input.customerEmail || customer?.email || "subscriber@trinayaa.test";
    const customerPhone = input.customerPhone || customer?.phone || "+919876543210";

    // 2. Fetch and validate product
    const product = productsRepo.getById(input.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    if (product.isSubscriptionEligible === 0 || product.isSubscriptionEligible === false || product.isSubscriptionEligible === "0") {
      throw new Error("This botanical product is not eligible for subscription");
    }
    if (product.isAvailable === 0 || product.isAvailable === false) {
      throw new Error("This botanical product is currently unavailable for subscriptions.");
    }
    const qty = Number(input.quantity);
    if (!qty || qty < 1) {
      throw new Error("Subscription quantity must be at least 1");
    }
    if (product.stock < qty) {
      throw new Error(`Insufficient stock for subscription (Requested: ${qty}, In Stock: ${product.stock})`);
    }

    // 3. Resolve variant & pricing
    let variantLabel = "100g";
    let unitPrice = Number(product.price);
    let sku = product.sku || `TRN-${product.id}`;

    if (input.variantId) {
      const dbVariant = (db.prepare("SELECT * FROM product_variants WHERE id = ?").get(input.variantId) as any)
        || product.variants?.find((v: any) => v.id === input.variantId);
      if (dbVariant) {
        variantLabel = dbVariant.packSize || dbVariant.label || variantLabel;
        unitPrice = Number(dbVariant.price);
        sku = dbVariant.sku || sku;
      }
    } else if (product.sizes && product.sizes.length > 0) {
      variantLabel = product.sizes[0].label || variantLabel;
      unitPrice = Number(product.sizes[0].price);
    }

    // 4. Calculate financials
    const subtotal = Math.round(unitPrice * qty * 100) / 100;
    // Standard TRINAYAA delivery policy: Free delivery above Rs. 799, otherwise Rs. 60
    const shippingFee = subtotal >= 799 ? 0 : 60;
    const totalPerCycle = Math.round((subtotal + shippingFee) * 100) / 100;

    // 5. Calculate frequency & dates
    const freqDays = this.getFrequencyDays(input.frequency);
    const now = new Date().toISOString();
    const startDate = input.startDate ? new Date(input.startDate).toISOString() : now;
    // First scheduled cycle target date
    const nextDeliveryDate = startDate;

    const deliveryAddressStr = typeof input.deliveryAddress === "string"
      ? input.deliveryAddress
      : JSON.stringify(input.deliveryAddress || {});

    const productSnapshot = JSON.stringify({
      id: product.id,
      name: product.name,
      nameTa: product.nameTa,
      sku,
      image: product.image,
      category: product.category,
      badge: product.badge,
      description: product.description,
      variantId: input.variantId || null,
      variantLabel,
      unitPrice,
    });

    const paymentPref = input.paymentPreference === "MANUAL_RENEWAL" ? "MANUAL_RENEWAL" : "COD";

    // 6. Generate unique subscription number with collision retry
    const year = new Date().getFullYear();
    let attempts = 0;
    while (attempts < 10) {
      const subNumber = this.getNextSubscriptionNumber(year);
      const subId = "sub_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

      try {
        db.prepare(`
          INSERT INTO customer_subscriptions (
            id, subscription_number, customer_id, customer_name, customer_email,
            customer_phone, product_id, variant_id, product_name, product_sku,
            variant_label, product_snapshot, quantity, unit_price, subtotal,
            shipping_fee, total_per_cycle, frequency, frequency_days, start_date,
            next_delivery_date, delivery_address, delivery_instructions,
            payment_preference, status, cycle_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?, ?)
        `).run(
          subId,
          subNumber,
          input.customerId,
          customerName,
          customerEmail,
          customerPhone,
          product.id,
          input.variantId || null,
          product.name,
          sku,
          variantLabel,
          productSnapshot,
          qty,
          unitPrice,
          subtotal,
          shippingFee,
          totalPerCycle,
          input.frequency,
          freqDays,
          startDate,
          nextDeliveryDate,
          deliveryAddressStr,
          input.deliveryInstructions || null,
          paymentPref,
          now,
          now
        );

        // 7. Create initial cycle record
        const cycleId = "scyc_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        const cycleRef = `${subNumber}-C1`;
        db.prepare(`
          INSERT INTO subscription_cycles (
            id, subscription_id, subscription_number, cycle_number, cycle_reference,
            scheduled_date, status, amount, payment_method, payment_status,
            created_at, updated_at
          ) VALUES (?, ?, ?, 1, ?, ?, 'PENDING', ?, ?, 'PENDING', ?, ?)
        `).run(
          cycleId,
          subId,
          subNumber,
          cycleRef,
          nextDeliveryDate,
          totalPerCycle,
          paymentPref,
          now,
          now
        );

        // 8. Create initial history record
        const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        db.prepare(`
          INSERT INTO subscription_history (
            id, subscription_id, from_status, to_status, action, actor, actor_id, note, created_at
          ) VALUES (?, ?, NULL, 'ACTIVE', 'CREATED', 'CUSTOMER', ?, ?, ?)
        `).run(
          histId,
          subId,
          input.customerId,
          `Subscription created for ${qty}x ${product.name} (${variantLabel}), frequency: ${input.frequency}`,
          now
        );

        const enriched = this.getById(subId);

        // Telegram alert (background safe)
        try {
          const { notifySubscriptionCreated } = require("./telegram");
          notifySubscriptionCreated({
            subscriptionNumber: subNumber,
            customerName,
            productName: product.name,
            variantLabel,
            quantity: qty,
            frequency: input.frequency,
            nextDeliveryDate,
          }).catch(() => {});
        } catch {}

        return enriched;
      } catch (err: any) {
        if (err?.message?.includes("UNIQUE constraint failed: customer_subscriptions.subscription_number")) {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    throw new Error("Failed to generate unique subscription reference after 10 attempts");
  },

  getById(idOrNumber: string) {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM customer_subscriptions WHERE id = ? OR subscription_number = ?
    `).get(idOrNumber, idOrNumber) as any;
    if (!row) return null;
    return this.enrichSubscription(row);
  },

  listByCustomer(customerId: string) {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM customer_subscriptions WHERE customer_id = ? ORDER BY created_at DESC
    `).all(customerId) as any[];
    return rows.map((r) => this.enrichSubscription(r));
  },

  listAll(filters: {
    status?: string;
    frequency?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.status && filters.status !== "ALL") {
      conditions.push("status = ?");
      params.push(filters.status.toUpperCase());
    }

    if (filters.frequency && filters.frequency !== "ALL") {
      conditions.push("frequency = ?");
      params.push(filters.frequency);
    }

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      conditions.push(
        "(LOWER(subscription_number) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ? OR LOWER(product_name) LIKE ?)"
      );
      params.push(q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const totalRow = db.prepare(`
      SELECT COUNT(*) as total FROM customer_subscriptions ${whereClause}
    `).get(...params) as any;
    const total = totalRow?.total || 0;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const rows = db.prepare(`
      SELECT * FROM customer_subscriptions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    return {
      subscriptions: rows.map((r) => this.enrichSubscription(r)),
      total,
    };
  },

  getStats() {
    const db = getDatabase();
    const totalRow = db.prepare("SELECT COUNT(*) as c FROM customer_subscriptions").get() as any;
    const activeRow = db.prepare("SELECT COUNT(*) as c FROM customer_subscriptions WHERE status = 'ACTIVE'").get() as any;
    const pausedRow = db.prepare("SELECT COUNT(*) as c FROM customer_subscriptions WHERE status = 'PAUSED'").get() as any;
    const cancelledRow = db.prepare("SELECT COUNT(*) as c FROM customer_subscriptions WHERE status = 'CANCELLED'").get() as any;
    const exceptionsRow = db.prepare("SELECT COUNT(*) as c FROM customer_subscriptions WHERE status = 'FAILED' OR failure_reason IS NOT NULL").get() as any;

    const upcomingLimit = new Date(Date.now() + 7 * 86400000).toISOString();
    const upcomingRow = db.prepare(`
      SELECT COUNT(*) as c FROM customer_subscriptions
      WHERE status = 'ACTIVE' AND next_delivery_date <= ?
    `).get(upcomingLimit) as any;

    return {
      total: totalRow?.c || 0,
      active: activeRow?.c || 0,
      paused: pausedRow?.c || 0,
      cancelled: cancelledRow?.c || 0,
      exceptions: exceptionsRow?.c || 0,
      upcoming7Days: upcomingRow?.c || 0,
    };
  },

  pause(id: string, reason: string = "Paused by customer", actor: string = "CUSTOMER", actorId?: string) {
    const db = getDatabase();
    const sub = this.getById(id);
    if (!sub) throw new Error("Subscription not found");
    if (sub.status === "PAUSED") return sub;
    if (sub.status === "CANCELLED") throw new Error("Cancelled subscriptions cannot be paused");

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customer_subscriptions
      SET status = 'PAUSED', pause_reason = ?, paused_at = ?, updated_at = ?
      WHERE id = ?
    `).run(reason, now, now, sub.id);

    const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, from_status, to_status, action, actor, actor_id, note, created_at
      ) VALUES (?, ?, ?, 'PAUSED', 'PAUSED', ?, ?, ?, ?)
    `).run(histId, sub.id, sub.status, actor, actorId || null, reason, now);

    return this.getById(sub.id);
  },

  resume(id: string, actor: string = "CUSTOMER", actorId?: string) {
    const db = getDatabase();
    const sub = this.getById(id);
    if (!sub) throw new Error("Subscription not found");
    if (sub.status === "ACTIVE") return sub;
    if (sub.status === "CANCELLED") throw new Error("Cancelled subscriptions cannot be resumed");

    const now = new Date().toISOString();
    let nextDeliveryDate = sub.nextDeliveryDate;
    // If the next delivery date lapsed while paused, recalibrate to today + frequencyDays
    if (new Date(nextDeliveryDate).getTime() <= Date.now()) {
      nextDeliveryDate = new Date(Date.now() + sub.frequencyDays * 86400000).toISOString();
    }

    db.prepare(`
      UPDATE customer_subscriptions
      SET status = 'ACTIVE', pause_reason = NULL, paused_at = NULL, next_delivery_date = ?, updated_at = ?
      WHERE id = ?
    `).run(nextDeliveryDate, now, sub.id);

    const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, from_status, to_status, action, actor, actor_id, note, created_at
      ) VALUES (?, ?, 'PAUSED', 'ACTIVE', 'RESUMED', ?, ?, 'Subscription resumed', ?)
    `).run(histId, sub.id, actor, actorId || null, now);

    return this.getById(sub.id);
  },

  skipNext(id: string, reason: string = "Customer skipped delivery", actor: string = "CUSTOMER", actorId?: string) {
    const db = getDatabase();
    const sub = this.getById(id);
    if (!sub) throw new Error("Subscription not found");
    if (sub.status !== "ACTIVE") throw new Error("Only active subscriptions can skip upcoming deliveries");

    const now = new Date().toISOString();
    const currentDate = new Date(sub.nextDeliveryDate).getTime();
    const newNextDate = new Date(currentDate + sub.frequencyDays * 86400000).toISOString();

    // Mark current pending cycle as SKIPPED
    const currentCycleNum = sub.cycleCount + 1;
    const currentRef = `${sub.subscriptionNumber}-C${currentCycleNum}`;

    db.prepare(`
      UPDATE subscription_cycles
      SET status = 'SKIPPED', updated_at = ?
      WHERE subscription_id = ? AND cycle_reference = ? AND status = 'PENDING'
    `).run(now, sub.id, currentRef);

    // Create next scheduled cycle
    const nextCycleNum = currentCycleNum + 1;
    const nextRef = `${sub.subscriptionNumber}-C${nextCycleNum}`;
    const cycleId = "scyc_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    const existingNext = db.prepare("SELECT id FROM subscription_cycles WHERE cycle_reference = ?").get(nextRef);
    if (!existingNext) {
      db.prepare(`
        INSERT INTO subscription_cycles (
          id, subscription_id, subscription_number, cycle_number, cycle_reference,
          scheduled_date, status, amount, payment_method, payment_status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 'PENDING', ?, ?)
      `).run(
        cycleId,
        sub.id,
        sub.subscriptionNumber,
        nextCycleNum,
        nextRef,
        newNextDate,
        sub.totalPerCycle,
        sub.paymentPreference,
        now,
        now
      );
    }

    // Advance subscription delivery date without creating order
    db.prepare(`
      UPDATE customer_subscriptions
      SET next_delivery_date = ?, updated_at = ?
      WHERE id = ?
    `).run(newNextDate, now, sub.id);

    // Log history
    const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, from_status, to_status, action, actor, actor_id, note, created_at
      ) VALUES (?, ?, 'ACTIVE', 'ACTIVE', 'SKIPPED', ?, ?, ?, ?)
    `).run(
      histId,
      sub.id,
      actor,
      actorId || null,
      `Delivery skipped. Schedule advanced from ${sub.nextDeliveryDate.slice(0, 10)} to ${newNextDate.slice(0, 10)}. Reason: ${reason}`,
      now
    );

    return this.getById(sub.id);
  },

  updateSettings(id: string, updates: {
    quantity?: number;
    frequency?: string;
    deliveryAddress?: any;
    deliveryInstructions?: string | null;
  }, actor: string = "CUSTOMER", actorId?: string) {
    const db = getDatabase();
    const sub = this.getById(id);
    if (!sub) throw new Error("Subscription not found");
    if (sub.status === "CANCELLED") throw new Error("Cannot modify a cancelled subscription");

    const now = new Date().toISOString();
    let qty = sub.quantity;
    let subtotal = sub.subtotal;
    let shippingFee = sub.shippingFee;
    let totalPerCycle = sub.totalPerCycle;

    if (updates.quantity !== undefined) {
      qty = Number(updates.quantity);
      if (!qty || qty < 1) throw new Error("Quantity must be at least 1");
      subtotal = Math.round(sub.unitPrice * qty * 100) / 100;
      shippingFee = subtotal >= 799 ? 0 : 60;
      totalPerCycle = Math.round((subtotal + shippingFee) * 100) / 100;
    }

    let frequency = sub.frequency;
    let frequencyDays = sub.frequencyDays;
    if (updates.frequency && updates.frequency !== sub.frequency) {
      frequency = updates.frequency;
      frequencyDays = this.getFrequencyDays(frequency);
    }

    let deliveryAddressStr = typeof sub.deliveryAddress === "string"
      ? sub.deliveryAddress
      : JSON.stringify(sub.deliveryAddress);

    if (updates.deliveryAddress) {
      deliveryAddressStr = typeof updates.deliveryAddress === "string"
        ? updates.deliveryAddress
        : JSON.stringify(updates.deliveryAddress);
    }

    const deliveryInstructions = updates.deliveryInstructions !== undefined
      ? updates.deliveryInstructions
      : sub.deliveryInstructions;

    db.prepare(`
      UPDATE customer_subscriptions
      SET quantity = ?, subtotal = ?, shipping_fee = ?, total_per_cycle = ?,
          frequency = ?, frequency_days = ?, delivery_address = ?,
          delivery_instructions = ?, updated_at = ?
      WHERE id = ?
    `).run(
      qty,
      subtotal,
      shippingFee,
      totalPerCycle,
      frequency,
      frequencyDays,
      deliveryAddressStr,
      deliveryInstructions,
      now,
      sub.id
    );

    const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, from_status, to_status, action, actor, actor_id, note, created_at
      ) VALUES (?, ?, ?, ?, 'SETTINGS_UPDATED', ?, ?, 'Subscription settings updated', ?)
    `).run(histId, sub.id, sub.status, sub.status, actor, actorId || null, now);

    return this.getById(sub.id);
  },

  cancel(id: string, reason: string = "Cancelled by customer", actor: string = "CUSTOMER", actorId?: string) {
    const db = getDatabase();
    const sub = this.getById(id);
    if (!sub) throw new Error("Subscription not found");
    if (sub.status === "CANCELLED") return sub;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customer_subscriptions
      SET status = 'CANCELLED', cancellation_reason = ?, cancelled_at = ?, updated_at = ?
      WHERE id = ?
    `).run(reason, now, now, sub.id);

    // Cancel pending cycle
    db.prepare(`
      UPDATE subscription_cycles
      SET status = 'CANCELLED', updated_at = ?
      WHERE subscription_id = ? AND status = 'PENDING'
    `).run(now, sub.id);

    const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, from_status, to_status, action, actor, actor_id, note, created_at
      ) VALUES (?, ?, ?, 'CANCELLED', 'CANCELLED', ?, ?, ?, ?)
    `).run(histId, sub.id, sub.status, actor, actorId || null, reason, now);

    return this.getById(sub.id);
  },

  processDueCycles(options: {
    now?: string;
    dryRun?: boolean;
    subscriptionId?: string;
  } = {}) {
    const db = getDatabase();
    const targetNow = options.now ? new Date(options.now).toISOString() : new Date().toISOString();

    let query = "SELECT * FROM customer_subscriptions WHERE status = 'ACTIVE' AND next_delivery_date <= ?";
    const params: any[] = [targetNow];

    if (options.subscriptionId) {
      query += " AND id = ?";
      params.push(options.subscriptionId);
    }

    const eligible = db.prepare(query).all(...params) as any[];

    const results: any[] = [];
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const subRow of eligible) {
      const sub = this.enrichSubscription(subRow);
      if (!sub) continue;

      // 1. Validate Product Availability
      const product = productsRepo.getById(sub.productId);
      if (!product || product.isAvailable === 0 || product.isAvailable === false) {
        const failureReason = "Product is currently unavailable";
        db.prepare(`
          UPDATE customer_subscriptions
          SET failure_reason = ?, updated_at = ?
          WHERE id = ?
        `).run(failureReason, targetNow, sub.id);

        const failCycleNum = sub.cycleCount + 1;
        db.prepare(`
          UPDATE subscription_cycles
          SET status = 'FAILED', failure_reason = ?, updated_at = ?
          WHERE subscription_id = ? AND cycle_number = ?
        `).run(failureReason, targetNow, sub.id, failCycleNum);

        const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        db.prepare(`
          INSERT INTO subscription_history (
            id, subscription_id, from_status, to_status, action, actor, note, created_at
          ) VALUES (?, ?, 'ACTIVE', 'ACTIVE', 'PROCESSING_FAILED', 'SYSTEM', ?, ?)
        `).run(histId, sub.id, `Processing failed: ${failureReason}`, targetNow);

        failed++;
        results.push({ subscriptionId: sub.id, subscriptionNumber: sub.subscriptionNumber, status: "FAILED", reason: failureReason });
        continue;
      }

      // 2. Validate Stock
      if (product.stock < sub.quantity) {
        const failureReason = `Insufficient stock: requested ${sub.quantity}, available ${product.stock}`;
        db.prepare(`
          UPDATE customer_subscriptions
          SET failure_reason = ?, updated_at = ?
          WHERE id = ?
        `).run(failureReason, targetNow, sub.id);

        const failCycleNum = sub.cycleCount + 1;
        db.prepare(`
          UPDATE subscription_cycles
          SET status = 'FAILED', failure_reason = ?, updated_at = ?
          WHERE subscription_id = ? AND cycle_number = ?
        `).run(failureReason, targetNow, sub.id, failCycleNum);

        const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        db.prepare(`
          INSERT INTO subscription_history (
            id, subscription_id, from_status, to_status, action, actor, note, created_at
          ) VALUES (?, ?, 'ACTIVE', 'ACTIVE', 'PROCESSING_FAILED', 'SYSTEM', ?, ?)
        `).run(histId, sub.id, `Processing failed: ${failureReason}`, targetNow);

        try {
          const { notifySubscriptionException } = require("./telegram");
          notifySubscriptionException(
            { subscriptionNumber: sub.subscriptionNumber, customerName: sub.customerName, productName: sub.productName },
            failureReason
          ).catch(() => {});
        } catch {}

        failed++;
        results.push({ subscriptionId: sub.id, subscriptionNumber: sub.subscriptionNumber, status: "FAILED", reason: failureReason });
        continue;
      }

      // 3. Clear failure reason if resolved
      if (sub.failureReason) {
        db.prepare("UPDATE customer_subscriptions SET failure_reason = NULL WHERE id = ?").run(sub.id);
      }

      // 4. Idempotency Check: Determine Cycle Reference
      const cycleNumber = sub.cycleCount + 1;
      const cycleRef = `${sub.subscriptionNumber}-C${cycleNumber}`;

      // Check if order already exists for this cycle reference
      const existingOrder = db.prepare("SELECT id, orderNumber FROM orders WHERE subscriptionCycleId = ?").get(cycleRef) as any;
      if (existingOrder) {
        skipped++;
        results.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          status: "SKIPPED",
          reason: `Cycle ${cycleRef} already processed (Order: ${existingOrder.orderNumber})`,
        });
        continue;
      }

      if (options.dryRun) {
        succeeded++;
        results.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          cycleReference: cycleRef,
          status: "DRY_RUN_ELIGIBLE",
        });
        continue;
      }

      // 5. Payment Preference Flow:
      if (sub.paymentPreference === "MANUAL_RENEWAL") {
        // Option B: Transition to PAYMENT_PENDING
        db.prepare(`
          UPDATE customer_subscriptions
          SET status = 'PAYMENT_PENDING', updated_at = ?
          WHERE id = ?
        `).run(targetNow, sub.id);

        db.prepare(`
          INSERT OR REPLACE INTO subscription_cycles (
            id, subscription_id, subscription_number, cycle_number, cycle_reference,
            scheduled_date, status, amount, payment_method, payment_status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'PAYMENT_PENDING', ?, 'RAZORPAY_RENEWAL', 'PENDING', ?, ?)
        `).run(
          "scyc_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
          sub.id,
          sub.subscriptionNumber,
          cycleNumber,
          cycleRef,
          sub.nextDeliveryDate,
          sub.totalPerCycle,
          targetNow,
          targetNow
        );

        const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        db.prepare(`
          INSERT INTO subscription_history (
            id, subscription_id, from_status, to_status, action, actor, note, created_at
          ) VALUES (?, ?, 'ACTIVE', 'PAYMENT_PENDING', 'PAYMENT_REQUESTED', 'SYSTEM', ?, ?)
        `).run(histId, sub.id, `Renewal payment requested for cycle #${cycleNumber} (${cycleRef})`, targetNow);

        succeeded++;
        results.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          cycleReference: cycleRef,
          status: "PAYMENT_PENDING",
        });
        continue;
      }

      // 6. Cash on Delivery (COD) Automatic Cycle Order Creation:
      const orderItems = [
        {
          productId: sub.productId,
          productNameEn: sub.productName,
          name: sub.productName,
          packSize: sub.variantLabel || "100g",
          price: sub.unitPrice,
          unitPrice: sub.unitPrice,
          quantity: sub.quantity,
          subtotal: sub.subtotal,
          image: sub.productSnapshot?.image || null,
        },
      ];

      const orderData = {
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        customerPhone: sub.customerPhone,
        shippingAddress: sub.deliveryAddress,
        billingAddress: sub.deliveryAddress,
        isSameAddress: 1,
        isGiftOrder: 0,
        subtotal: sub.subtotal,
        shippingFee: sub.shippingFee,
        discountAmount: 0,
        total: sub.totalPerCycle,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "Confirmed",
        subscriptionId: sub.id,
        subscriptionCycleId: cycleRef,
        isSubscriptionOrder: 1,
        internalNotes: `Recurring subscription delivery for ${sub.subscriptionNumber} (Cycle #${cycleNumber})`,
      };

      const createdOrder = ordersRepo.create(orderData, orderItems);

      // 7. Atomic Inventory Deduction
      try {
        inventoryRepo.adjustStock(
          sub.productId,
          sub.variantId || null,
          -sub.quantity,
          "SALE",
          createdOrder.orderNumber,
          `Subscription order delivery (${sub.subscriptionNumber} - ${cycleRef})`,
          "Subscription Engine"
        );
      } catch (err) {
        console.error("[Subscription Stock Deduction Error]:", err);
      }

      // 8. Update or Insert Cycle Record
      const existingCycle = db.prepare("SELECT id FROM subscription_cycles WHERE cycle_reference = ?").get(cycleRef) as any;
      const cycleId = existingCycle ? existingCycle.id : "scyc_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

      db.prepare(`
        INSERT OR REPLACE INTO subscription_cycles (
          id, subscription_id, subscription_number, cycle_number, cycle_reference,
          scheduled_date, processed_date, order_id, order_number, status,
          amount, payment_method, payment_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ORDER_GENERATED', ?, 'COD', 'PENDING', ?, ?)
      `).run(
        cycleId,
        sub.id,
        sub.subscriptionNumber,
        cycleNumber,
        cycleRef,
        sub.nextDeliveryDate,
        targetNow,
        createdOrder.id,
        createdOrder.orderNumber,
        sub.totalPerCycle,
        targetNow,
        targetNow
      );

      // 9. Advance Subscription Schedule
      const nextDate = new Date(Date.parse(sub.nextDeliveryDate) + sub.frequencyDays * 86400000).toISOString();

      db.prepare(`
        UPDATE customer_subscriptions
        SET cycle_count = cycle_count + 1,
            last_order_date = ?,
            next_delivery_date = ?,
            failure_reason = NULL,
            updated_at = ?
        WHERE id = ?
      `).run(targetNow, nextDate, targetNow, sub.id);

      // Insert next scheduled cycle record
      const nextCycleNum = cycleNumber + 1;
      const nextCycleRef = `${sub.subscriptionNumber}-C${nextCycleNum}`;
      const nextCycleId = "scyc_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const existingNext = db.prepare("SELECT id FROM subscription_cycles WHERE cycle_reference = ?").get(nextCycleRef);
      if (!existingNext) {
        db.prepare(`
          INSERT INTO subscription_cycles (
            id, subscription_id, subscription_number, cycle_number, cycle_reference,
            scheduled_date, status, amount, payment_method, payment_status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 'PENDING', ?, ?)
        `).run(
          nextCycleId,
          sub.id,
          sub.subscriptionNumber,
          nextCycleNum,
          nextCycleRef,
          nextDate,
          sub.totalPerCycle,
          sub.paymentPreference,
          targetNow,
          targetNow
        );
      }

      // 10. Record Subscription History
      const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      db.prepare(`
        INSERT INTO subscription_history (
          id, subscription_id, from_status, to_status, action, actor, note, created_at
        ) VALUES (?, ?, 'ACTIVE', 'ACTIVE', 'ORDER_GENERATED', 'SYSTEM', ?, ?)
      `).run(
        histId,
        sub.id,
        `Order ${createdOrder.orderNumber} successfully generated for Cycle #${cycleNumber}. Next delivery scheduled for ${nextDate.slice(0, 10)}.`,
        targetNow
      );

      // 11. Telegram Alert
      try {
        const { notifySubscriptionOrderGenerated } = require("./telegram");
        notifySubscriptionOrderGenerated(
          { subscriptionNumber: sub.subscriptionNumber, customerName: sub.customerName, productName: sub.productName },
          { orderNumber: createdOrder.orderNumber, total: sub.totalPerCycle }
        ).catch(() => {});
      } catch {}

      succeeded++;
      results.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        cycleReference: cycleRef,
        orderNumber: createdOrder.orderNumber,
        status: "ORDER_GENERATED",
      });
    }

    return {
      totalEligible: eligible.length,
      succeeded,
      failed,
      skipped,
      results,
    };
  },

  recordRenewalPayment(cycleIdOrRef: string, paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId: string;
    amount?: number;
  }) {
    const db = getDatabase();
    const cycle = db.prepare(`
      SELECT * FROM subscription_cycles WHERE id = ? OR cycle_reference = ?
    `).get(cycleIdOrRef, cycleIdOrRef) as any;

    if (!cycle) throw new Error("Subscription cycle not found");
    if (cycle.status === "ORDER_GENERATED") throw new Error("Order has already been generated for this cycle");

    const sub = this.getById(cycle.subscription_id);
    if (!sub) throw new Error("Subscription not found");

    const now = new Date().toISOString();

    // 1. Create order for renewed cycle
    const orderItems = [
      {
        productId: sub.productId,
        productNameEn: sub.productName,
        name: sub.productName,
        packSize: sub.variantLabel || "100g",
        price: sub.unitPrice,
        unitPrice: sub.unitPrice,
        quantity: sub.quantity,
        subtotal: sub.subtotal,
        image: sub.productSnapshot?.image || null,
      },
    ];

    const orderData = {
      customerId: sub.customerId,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      customerPhone: sub.customerPhone,
      shippingAddress: sub.deliveryAddress,
      billingAddress: sub.deliveryAddress,
      isSameAddress: 1,
      isGiftOrder: 0,
      subtotal: sub.subtotal,
      shippingFee: sub.shippingFee,
      discountAmount: 0,
      total: sub.totalPerCycle,
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      razorpayOrderId: paymentDetails.razorpayOrderId || null,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
      orderStatus: "Confirmed",
      subscriptionId: sub.id,
      subscriptionCycleId: cycle.cycle_reference,
      isSubscriptionOrder: 1,
      internalNotes: `Paid online renewal for ${sub.subscriptionNumber} (${cycle.cycle_reference})`,
    };

    const createdOrder = ordersRepo.create(orderData, orderItems);

    // 2. Inventory deduction
    try {
      inventoryRepo.adjustStock(
        sub.productId,
        sub.variantId || null,
        -sub.quantity,
        "SALE",
        createdOrder.orderNumber,
        `Subscription paid renewal (${sub.subscriptionNumber} - ${cycle.cycle_reference})`,
        "Payment Gateway"
      );
    } catch {}

    // 3. Update cycle
    db.prepare(`
      UPDATE subscription_cycles
      SET order_id = ?, order_number = ?, status = 'ORDER_GENERATED',
          payment_status = 'PAID', payment_reference = ?, processed_date = ?, updated_at = ?
      WHERE id = ?
    `).run(createdOrder.id, createdOrder.orderNumber, paymentDetails.razorpayPaymentId, now, now, cycle.id);

    // 4. Advance subscription schedule & return to ACTIVE
    const nextDate = new Date(Date.parse(sub.nextDeliveryDate) + sub.frequencyDays * 86400000).toISOString();

    db.prepare(`
      UPDATE customer_subscriptions
      SET status = 'ACTIVE',
          cycle_count = cycle_count + 1,
          last_order_date = ?,
          next_delivery_date = ?,
          failure_reason = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(now, nextDate, now, sub.id);

    const histId = "shist_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    db.prepare(`
      INSERT INTO subscription_history (
        id, subscription_id, from_status, to_status, action, actor, note, created_at
      ) VALUES (?, ?, 'PAYMENT_PENDING', 'ACTIVE', 'PAYMENT_COMPLETED', 'CUSTOMER', ?, ?)
    `).run(
      histId,
      sub.id,
      `Payment verified (${paymentDetails.razorpayPaymentId}). Order ${createdOrder.orderNumber} generated. Next delivery: ${nextDate.slice(0, 10)}.`,
      now
    );

    return {
      subscription: this.getById(sub.id),
      order: createdOrder,
    };
  },
};
