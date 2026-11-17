import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server", "db.ts")

with open(db_path, "r", encoding="utf-8") as f:
    content = f.read()

# Locate usersRepo
marker = "  listCustomers(limit = 100, offset = 0) {"
if marker not in content:
    print("Error: marker not found in server/db.ts")
    exit(1)

phase4_methods = """  listCustomers(limit = 100, offset = 0) {
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
      SELECT w.*, p.sku, p.nameEn, p.nameTa, p.price, p.primaryImage
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
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

    return rows.join("\\n");
  }"""

# Replace the original listCustomers with phase4_methods
# Find the exact original listCustomers block
orig_start = content.find("  listCustomers(limit = 100, offset = 0) {")
orig_end = content.find("  }\n};", orig_start)
if orig_end == -1:
    orig_end = content.find("  }\r\n};", orig_start)

if orig_end == -1:
    print("Could not find end of usersRepo")
    exit(1)

new_content = content[:orig_start] + phase4_methods + "\n" + content[orig_end:]

with open(db_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("✓ Successfully patched server/db.ts with Phase 4 Customer 360 repository methods.")
