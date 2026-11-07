import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "server", "db.ts")

phase3_repos = """

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
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customer_feedback
      SET admin_response = ?, admin_responded_at = ?, internal_notes = ?, status = 'REVIEWED', updated_at = ?
      WHERE id = ?
    `).run(response, now, internalNotes || null, now, id);
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
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE product_reviews
      SET status = ?, admin_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(status, adminNotes || null, now, id);
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
    let cart = db.prepare("SELECT id FROM cart WHERE userId = ?").get(userId) as { id: string } | undefined;
    if (!cart) {
      const cartId = "crt_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
      const now = new Date().toISOString();
      db.prepare("INSERT INTO cart (id, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?)").run(cartId, userId, now, now);
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
      const cart = db.prepare("SELECT id FROM cart WHERE userId = ?").get(userId) as { id: string } | undefined;
      if (cart) {
        db.prepare("DELETE FROM cart_items WHERE cartId = ? AND productId = ?").run(cart.id, productId);
      }
    }
    return { success: true };
  },
};
"""

with open(DB_PATH, "r", encoding="utf-8") as f:
    content = f.read()

if "export const ticketsRepo" not in content:
    with open(DB_PATH, "a", encoding="utf-8") as f:
        f.write(phase3_repos)
    print("Added Phase 3 repositories to server/db.ts")
else:
    print("Phase 3 repositories already present in server/db.ts")
