import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "trinayaa.db")

print(f"Connecting to database: {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. Create auth_otps table
c.execute("""
CREATE TABLE IF NOT EXISTS auth_otps (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'LOGIN',
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified_at TEXT,
    created_at TEXT NOT NULL
)
""")

c.execute("CREATE INDEX IF NOT EXISTS idx_auth_otps_phone ON auth_otps(phone)")
c.execute("CREATE INDEX IF NOT EXISTS idx_auth_otps_created ON auth_otps(created_at)")

# 2. Ensure customer_addresses columns are intact
c.execute("CREATE INDEX IF NOT EXISTS idx_customer_addresses_user ON customer_addresses(userId)")
c.execute("CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(userId, isDefault)")

# 3. Ensure users table phone index exists for quick lookup
c.execute("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)")

conn.commit()
print("Phase 2 database tables and indexes verified successfully.")

# Print schema
cols = [col[1] for col in c.execute("PRAGMA table_info(auth_otps)").fetchall()]
print(f"auth_otps columns: {cols}")
conn.close()
