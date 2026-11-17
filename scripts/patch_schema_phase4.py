import os

schema_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "drizzle", "schema.ts")

with open(schema_path, "r", encoding="utf-8") as f:
    content = f.read()

addition = """

// ==========================================
// 19. CUSTOMER AUDIT LOGS (PHASE 4)
// ==========================================
export const customerAuditLogs = mysqlTable("customer_audit_logs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  customerId: varchar("customer_id", { length: 64 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  performedBy: varchar("performed_by", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: text("created_at").notNull(),
});

export type CustomerAuditLog = typeof customerAuditLogs.$inferSelect;
export type InsertCustomerAuditLog = typeof customerAuditLogs.$inferInsert;
"""

if "customerAuditLogs" not in content:
    with open(schema_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + addition + "\n")
    print("Added customerAuditLogs to schema.ts")
else:
    print("customerAuditLogs already present in schema.ts")
