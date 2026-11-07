import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. Check if adminNotes column exists in users
c.execute("PRAGMA table_info(users)")
cols = [col[1] for col in c.fetchall()]

if "adminNotes" not in cols:
    print("Adding adminNotes column to users table...")
    c.execute("ALTER TABLE users ADD COLUMN adminNotes TEXT;")
    print("✓ Added adminNotes to users.")
else:
    print("adminNotes column already exists in users.")

# 2. Create customer_audit_logs table
c.execute("""
CREATE TABLE IF NOT EXISTS customer_audit_logs (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
""")
c.execute("CREATE INDEX IF NOT EXISTS idx_customer_audit_cust ON customer_audit_logs(customer_id);")
print("✓ customer_audit_logs table and index verified.")

conn.commit()
conn.close()
print("Migration completed successfully.")
