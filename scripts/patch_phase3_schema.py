import os

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "drizzle", "schema.ts")

phase3_code = """

// ==========================================
// 15. SUPPORT TICKETS & HELPDESK
// ==========================================
export const supportTickets = mysqlTable("support_tickets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 64 }).notNull().unique(), // e.g. TRN-SUP-2026-00001
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }),
  orderId: varchar("order_id", { length: 64 }),
  orderNumber: varchar("order_number", { length: 64 }),
  category: varchar("category", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 32 }).default("Normal").notNull(), // 'Low' | 'Normal' | 'High' | 'Urgent'
  status: varchar("status", { length: 32 }).default("Open").notNull(), // 'Open' | 'In Progress' | 'Waiting for Customer' | 'Resolved' | 'Closed'
  assignedAdminId: varchar("assigned_admin_id", { length: 64 }),
  assignedAdminName: varchar("assigned_admin_name", { length: 255 }),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

export const supportTicketMessages = mysqlTable("support_ticket_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ticketId: varchar("ticket_id", { length: 64 }).notNull(),
  senderType: varchar("sender_type", { length: 32 }).notNull(), // 'CUSTOMER' | 'ADMIN' | 'SYSTEM'
  senderId: varchar("sender_id", { length: 64 }).notNull(),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  message: text("message").notNull(),
  attachmentReference: text("attachment_reference"),
  createdAt: text("created_at").notNull(),
});

export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type InsertSupportTicketMessage = typeof supportTicketMessages.$inferInsert;

export const supportTicketAuditLogs = mysqlTable("support_ticket_audit_logs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ticketId: varchar("ticket_id", { length: 64 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  performedBy: varchar("performed_by", { length: 128 }).notNull(),
  details: text("details"),
  createdAt: text("created_at").notNull(),
});

export type SupportTicketAuditLog = typeof supportTicketAuditLogs.$inferSelect;

// ==========================================
// 16. CUSTOMER FEEDBACK
// ==========================================
export const customerFeedback = mysqlTable("customer_feedback", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }),
  category: varchar("category", { length: 64 }).notNull(),
  rating: int("rating").notNull(), // 1 to 5
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  orderId: varchar("order_id", { length: 64 }),
  orderNumber: varchar("order_number", { length: 64 }),
  productId: varchar("product_id", { length: 64 }),
  adminResponse: text("admin_response"),
  adminRespondedAt: text("admin_responded_at"),
  status: varchar("status", { length: 32 }).default("NEW").notNull(), // 'NEW' | 'REVIEWED' | 'RESOLVED' | 'ARCHIVED'
  internalNotes: text("internal_notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = typeof customerFeedback.$inferInsert;

// ==========================================
// 17. PRODUCT REVIEWS
// ==========================================
export const productReviews = mysqlTable("product_reviews", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  rating: int("rating").notNull(), // 1 to 5
  title: varchar("title", { length: 255 }).notNull(),
  review: text("review").notNull(),
  isVerifiedPurchase: int("is_verified_purchase").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("PENDING").notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

// ==========================================
// 18. WISHLIST & SAVE FOR LATER
// ==========================================
export const wishlistItems = mysqlTable("wishlist_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  createdAt: text("created_at").notNull(),
});

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;
"""

with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    content = f.read()

if "export const supportTickets" not in content:
    with open(SCHEMA_PATH, "a", encoding="utf-8") as f:
        f.write(phase3_code)
    print("Added Phase 3 schemas to drizzle/schema.ts")
else:
    print("Phase 3 schemas already present in drizzle/schema.ts")
