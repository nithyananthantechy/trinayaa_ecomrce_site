import sqlite3
import os

db_path = 'data/trinayaa.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Applying Phase 7 Rewards Schema Migrations...")

# 1. customer_reward_transactions
cursor.execute("""
CREATE TABLE IF NOT EXISTS customer_reward_transactions (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    transactionType TEXT NOT NULL,
    points INTEGER NOT NULL,
    referenceType TEXT,
    referenceId TEXT,
    description TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    createdBy TEXT
);
""")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_reward_tx_customer ON customer_reward_transactions(customerId);")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_reward_tx_ref ON customer_reward_transactions(referenceType, referenceId);")
print("Verified customer_reward_transactions table.")

# 2. customer_reward_redemptions
cursor.execute("""
CREATE TABLE IF NOT EXISTS customer_reward_redemptions (
    id TEXT PRIMARY KEY,
    customerId TEXT NOT NULL,
    rewardProductId TEXT NOT NULL,
    pointsSpent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    orderId TEXT,
    notes TEXT,
    adminNotes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    fulfilledAt TEXT
);
""")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer ON customer_reward_redemptions(customerId);")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON customer_reward_redemptions(status);")
print("Verified customer_reward_redemptions table.")

# 3. Add isRewardEligible to products if missing
cols = [col[1] for col in cursor.execute("PRAGMA table_info(products)").fetchall()]
if "isRewardEligible" not in cols:
    cursor.execute("ALTER TABLE products ADD COLUMN isRewardEligible INTEGER DEFAULT 1;")
    print("Added isRewardEligible column to products table.")
else:
    print("isRewardEligible column already exists in products.")

# 4. Insert default settings in site_content
now = "2026-11-07T19:25:00.000Z"
defaults = [
    ("feedback_reward_points", "50"),
    ("free_product_reward_threshold", "200"),
    ("rewards_enabled", "true")
]

for key, val in defaults:
    cursor.execute("SELECT value FROM site_content WHERE key = ?", (key,))
    existing = cursor.fetchone()
    if existing is None:
        cursor.execute("INSERT INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)", (key, val, now))
        print(f"Inserted default site_content: {key} = {val}")
    else:
        print(f"site_content setting {key} already present with value: {existing[0]}")

conn.commit()

# Verify products count
product_count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
print(f"Product count after migration: {product_count} (must be 162)")
conn.close()
print("Migration completed successfully.")
