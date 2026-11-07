import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double } from "drizzle-orm/mysql-core";

// ==========================================
// 1. USERS & CUSTOMER ACCOUNTS
// ==========================================
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  role: varchar("role", { length: 32 }).default("CUSTOMER").notNull(), // 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
  status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
  telegramId: varchar("telegramId", { length: 64 }),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==========================================
// 2. CUSTOMER ADDRESSES
// ==========================================
export const customerAddresses = mysqlTable("customer_addresses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  street: text("street").notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  pinCode: varchar("pinCode", { length: 16 }).notNull(),
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = typeof customerAddresses.$inferInsert;

// ==========================================
// 3. CATEGORIES
// ==========================================
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  isVisible: int("isVisible").default(1).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  parentId: varchar("parentId", { length: 64 }),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ==========================================
// 4. PRODUCTS
// ==========================================
export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sku: varchar("sku", { length: 64 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  nameTa: varchar("nameTa", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  shortDesc: text("shortDesc"),
  fullDesc: text("fullDesc"),
  categoryId: varchar("categoryId", { length: 64 }),
  productType: varchar("productType", { length: 64 }).default("Whole ingredient").notNull(),
  primaryImage: text("primaryImage"),
  gallery: text("gallery").default("[]"), // JSON string array of URLs
  sellingPrice: double("sellingPrice").notNull(),
  mrp: double("mrp").notNull(),
  discountPrice: double("discountPrice").notNull(),
  stock: int("stock").default(100).notNull(),
  stockAvailability: varchar("stockAvailability", { length: 64 }).default("In Stock").notNull(),
  status: varchar("status", { length: 32 }).default("Published").notNull(), // 'Published' | 'Draft' | 'Archived'
  featured: int("featured").default(0).notNull(),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  seoKeywords: text("seoKeywords"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ==========================================
// 5. PRODUCT VARIANTS & PACK SIZES
// ==========================================
export const productVariants = mysqlTable("product_variants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull(),
  packSize: varchar("packSize", { length: 64 }).notNull(),
  price: double("price").notNull(),
  mrp: double("mrp").notNull(),
  stock: int("stock").default(100).notNull(),
  sku: varchar("sku", { length: 64 }).notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

// ==========================================
// 5B. PRODUCT IMAGES
// ==========================================
export const productImages = mysqlTable("product_images", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull(),
  url: text("url").notNull(),
  altText: varchar("altText", { length: 255 }),
  isPrimary: int("isPrimary").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = typeof productImages.$inferInsert;

// ==========================================
// 5C. INVENTORY
// ==========================================
export const inventory = mysqlTable("inventory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("productId", { length: 64 }).notNull(),
  variantId: varchar("variantId", { length: 64 }),
  sku: varchar("sku", { length: 64 }).notNull(),
  stockQuantity: int("stockQuantity").default(100).notNull(),
  lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
  reorderQuantity: int("reorderQuantity").default(50).notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

// ==========================================
// 6. CART & CART ITEMS
// ==========================================
export const carts = mysqlTable("cart", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }),
  guestToken: varchar("guestToken", { length: 128 }),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const cartItems = mysqlTable("cart_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  cartId: varchar("cartId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }).notNull(),
  packSize: varchar("packSize", { length: 64 }).notNull(),
  unitPrice: double("unitPrice").notNull(),
  quantity: int("quantity").default(1).notNull(),
  createdAt: text("createdAt").notNull(),
});

export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;

// ==========================================
// 7. ORDERS & ORDER ITEMS
// ==========================================
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderNumber: varchar("orderNumber", { length: 64 }).notNull().unique(), // e.g. TRN-10482
  customerId: varchar("customerId", { length: 64 }),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 32 }).notNull(),
  shippingAddress: text("shippingAddress").notNull(), // JSON with street, city, state, pinCode
  subtotal: double("subtotal").notNull(),
  discountAmount: double("discountAmount").default(0).notNull(),
  shippingFee: double("shippingFee").default(0).notNull(),
  total: double("total").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 32 }).default("RAZORPAY").notNull(), // 'RAZORPAY' | 'COD' | 'UPI'
  paymentStatus: varchar("paymentStatus", { length: 32 }).default("PENDING").notNull(), // 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  razorpayOrderId: varchar("razorpayOrderId", { length: 128 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 128 }),
  orderStatus: varchar("orderStatus", { length: 32 }).default("Pending Payment").notNull(), // 'Pending Payment' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refund Initiated' | 'Refunded'
  internalNotes: text("internalNotes"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }),
  productNameEn: varchar("productNameEn", { length: 255 }).notNull(),
  productNameTa: varchar("productNameTa", { length: 255 }).notNull(),
  packSize: varchar("packSize", { length: 64 }).notNull(),
  price: double("price").notNull(),
  quantity: int("quantity").notNull(),
  subtotal: double("subtotal").notNull(),
  image: text("image"),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const orderStatusHistory = mysqlTable("order_status_history", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  note: text("note"),
  updatedBy: varchar("updatedBy", { length: 128 }).default("System").notNull(),
  createdAt: text("createdAt").notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

// ==========================================
// 8. PAYMENTS & TRANSACTIONS
// ==========================================
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("orderId", { length: 64 }).notNull(),
  paymentGateway: varchar("paymentGateway", { length: 64 }).default("RAZORPAY").notNull(),
  gatewayOrderId: varchar("gatewayOrderId", { length: 128 }).notNull(),
  gatewayPaymentId: varchar("gatewayPaymentId", { length: 128 }),
  gatewaySignature: text("gatewaySignature"),
  amount: double("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  status: varchar("status", { length: 32 }).default("PENDING").notNull(),
  rawResponse: text("rawResponse"),
  createdAt: text("createdAt").notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==========================================
// 9. FESTIVAL CAMPAIGNS & COUPONS
// ==========================================
export const campaigns = mysqlTable("campaigns", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(), // Coupon code
  discountType: varchar("discountType", { length: 32 }).default("PERCENTAGE").notNull(), // 'PERCENTAGE' | 'FIXED'
  discountValue: double("discountValue").notNull(),
  minOrderValue: double("minOrderValue").default(0).notNull(),
  maxDiscount: double("maxDiscount").default(1000).notNull(),
  startDate: text("startDate").notNull(),
  endDate: text("endDate").notNull(),
  isActive: int("isActive").default(1).notNull(),
  bannerText: text("bannerText"),
  bannerImage: text("bannerImage"),
  eligibleCategories: text("eligibleCategories").default("[]"), // JSON string array
  eligibleProducts: text("eligibleProducts").default("[]"), // JSON string array
  usageLimit: int("usageLimit").default(1000).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: text("createdAt").notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ==========================================
// 9B. COUPONS
// ==========================================
export const coupons = mysqlTable("coupons", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  campaignId: varchar("campaignId", { length: 64 }),
  discountType: varchar("discountType", { length: 32 }).default("PERCENTAGE").notNull(),
  discountValue: double("discountValue").notNull(),
  minOrderValue: double("minOrderValue").default(0).notNull(),
  maxDiscount: double("maxDiscount").default(1000).notNull(),
  startDate: text("startDate").notNull(),
  endDate: text("endDate").notNull(),
  usageLimit: int("usageLimit").default(1000).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: text("createdAt").notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

// ==========================================
// 10. SITE CONTENT & PROMOTIONAL BANNERS
// ==========================================
export const siteContent = mysqlTable("site_content", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type SiteContent = typeof siteContent.$inferSelect;

// ==========================================
// 11. TELEGRAM ADMIN ALLOWLIST & AUDIT LOGS
// ==========================================
export const telegramAllowedAdmins = mysqlTable("telegram_allowed_admins", {
  id: varchar("id", { length: 64 }).primaryKey(),
  telegramId: varchar("telegramId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 32 }).default("SUPER_ADMIN").notNull(),
  addedBy: varchar("addedBy", { length: 128 }).notNull(),
  createdAt: text("createdAt").notNull(),
});

export type TelegramAllowedAdmin = typeof telegramAllowedAdmins.$inferSelect;

export const telegramAuditLogs = mysqlTable("telegram_audit_logs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  telegramUserId: varchar("telegramUserId", { length: 64 }).notNull(),
  command: varchar("command", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: text("createdAt").notNull(),
});

export type TelegramAuditLog = typeof telegramAuditLogs.$inferSelect;

// ==========================================
// 12. B2B / BUSINESS BULK ENQUIRIES
// ==========================================
export const businessEnquiries = mysqlTable("business_enquiries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  enquiryNumber: varchar("enquiryNumber", { length: 32 }).notNull().unique(), // e.g. ENQ-10001
  contactName: varchar("contactName", { length: 255 }).notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  buyerType: varchar("buyerType", { length: 64 }).notNull(), // 'Retailer' | 'Wholesaler' | 'Distributor' | 'Manufacturer' | 'Other'
  deliveryCity: varchar("deliveryCity", { length: 128 }).notNull(),
  deliveryState: varchar("deliveryState", { length: 128 }).notNull(),
  requirements: text("requirements"),
  gstNumber: varchar("gstNumber", { length: 32 }),
  status: varchar("status", { length: 32 }).default("NEW").notNull(), // 'NEW' | 'CONTACTED' | 'QUOTATION_SENT' | 'NEGOTIATION' | 'CONVERTED' | 'CLOSED'
  assignedTo: varchar("assignedTo", { length: 128 }),
  internalNotes: text("internalNotes"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export type BusinessEnquiry = typeof businessEnquiries.$inferSelect;
export type InsertBusinessEnquiry = typeof businessEnquiries.$inferInsert;

export const businessEnquiryItems = mysqlTable("business_enquiry_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  enquiryId: varchar("enquiryId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }),
  sku: varchar("sku", { length: 64 }).notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: double("quantity").notNull(),
  unit: varchar("unit", { length: 32 }).default("kg").notNull(), // 'kg' | 'packs' | 'sacks'
  targetPrice: double("targetPrice"),
  createdAt: text("createdAt").notNull(),
});

export type BusinessEnquiryItem = typeof businessEnquiryItems.$inferSelect;
export type InsertBusinessEnquiryItem = typeof businessEnquiryItems.$inferInsert;

// ==========================================
// 14. AUTH OTPS (MOBILE OTP AUTHENTICATION)
// ==========================================
export const authOtps = mysqlTable("auth_otps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull(),
  otpHash: varchar("otp_hash", { length: 255 }).notNull(),
  purpose: varchar("purpose", { length: 32 }).default("LOGIN").notNull(),
  expiresAt: text("expires_at").notNull(),
  attempts: int("attempts").default(0).notNull(),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull(),
});

export type AuthOtp = typeof authOtps.$inferSelect;
export type InsertAuthOtp = typeof authOtps.$inferInsert;

