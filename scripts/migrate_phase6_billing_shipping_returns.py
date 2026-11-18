import sqlite3
import os

db_path = './data/trinayaa.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Inspect existing columns in orders
cursor.execute("PRAGMA table_info(orders)")
existing_cols = {r[1] for r in cursor.fetchall()}

new_columns = [
    ("billingAddress", "TEXT"),
    ("billingName", "TEXT"),
    ("billingPhone", "TEXT"),
    ("billingEmail", "TEXT"),
    ("recipientName", "TEXT"),
    ("recipientPhone", "TEXT"),
    ("recipientEmail", "TEXT"),
    ("isSameAddress", "INTEGER DEFAULT 1"),
    ("isGiftOrder", "INTEGER DEFAULT 0"),
    ("giftMessage", "TEXT"),
    ("deliveryInstructions", "TEXT"),
]

for col_name, col_type in new_columns:
    if col_name not in existing_cols:
        print(f"Adding column {col_name} to orders...")
        cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}")

# Backfill legacy rows in orders
cursor.execute("""
    UPDATE orders
    SET
        billingAddress = COALESCE(billingAddress, shippingAddress),
        billingName = COALESCE(billingName, customerName),
        billingPhone = COALESCE(billingPhone, customerPhone),
        billingEmail = COALESCE(billingEmail, customerEmail),
        recipientName = COALESCE(recipientName, customerName),
        recipientPhone = COALESCE(recipientPhone, customerPhone),
        recipientEmail = COALESCE(recipientEmail, customerEmail),
        isSameAddress = COALESCE(isSameAddress, 1),
        isGiftOrder = COALESCE(isGiftOrder, 0)
    WHERE billingAddress IS NULL OR billingName IS NULL OR recipientName IS NULL
""")
print(f"Backfilled legacy orders rows.")

# 2. Create order_returns table
cursor.execute("""
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
  quantity_received INTEGER DEFAULT 0,
  quantity_inspected INTEGER DEFAULT 0,
  item_price REAL NOT NULL,
  refund_amount REAL NOT NULL,
  return_reason TEXT NOT NULL,
  description TEXT NOT NULL,
  supporting_image TEXT,
  pickup_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  stock_disposition TEXT DEFAULT 'NONE',
  restocked_quantity INTEGER DEFAULT 0,
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
)
""")

cursor.execute("CREATE INDEX IF NOT EXISTS idx_returns_order ON order_returns(order_id)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_returns_order_number ON order_returns(order_number)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_returns_customer ON order_returns(customer_id)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_returns_number ON order_returns(return_number)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_returns_status ON order_returns(status)")

# 3. Create order_return_history table
cursor.execute("""
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
)
""")

cursor.execute("CREATE INDEX IF NOT EXISTS idx_return_history_ret ON order_return_history(return_id)")

conn.commit()
conn.close()
print("Migration for Phase 6 completed successfully.")
