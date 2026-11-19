import sqlite3
import os

DB_PATH = "./data/trinayaa.db"

def migrate():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 1. Add subscription columns to orders table if missing
    cur.execute("PRAGMA table_info(orders)")
    order_cols = [row[1] for row in cur.fetchall()]
    
    if "subscriptionId" not in order_cols:
        print("Adding subscriptionId to orders table...")
        cur.execute("ALTER TABLE orders ADD COLUMN subscriptionId TEXT")
    if "subscriptionCycleId" not in order_cols:
        print("Adding subscriptionCycleId to orders table...")
        cur.execute("ALTER TABLE orders ADD COLUMN subscriptionCycleId TEXT")
    if "isSubscriptionOrder" not in order_cols:
        print("Adding isSubscriptionOrder to orders table...")
        cur.execute("ALTER TABLE orders ADD COLUMN isSubscriptionOrder INTEGER NOT NULL DEFAULT 0")

    # 2. Add isSubscriptionEligible to products table if missing
    cur.execute("PRAGMA table_info(products)")
    prod_cols = [row[1] for row in cur.fetchall()]
    if "isSubscriptionEligible" not in prod_cols:
        print("Adding isSubscriptionEligible to products table...")
        cur.execute("ALTER TABLE products ADD COLUMN isSubscriptionEligible INTEGER NOT NULL DEFAULT 1")

    # 3. Create customer_subscriptions table
    cur.execute("""
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
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sub_customer ON customer_subscriptions(customer_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sub_number ON customer_subscriptions(subscription_number)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sub_status ON customer_subscriptions(status)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sub_next_delivery ON customer_subscriptions(next_delivery_date)")

    # 4. Create subscription_cycles table
    cur.execute("""
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
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cycle_sub ON subscription_cycles(subscription_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cycle_ref ON subscription_cycles(cycle_reference)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_cycle_status ON subscription_cycles(status)")

    # 5. Create subscription_history table
    cur.execute("""
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
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sub_hist_sub ON subscription_history(subscription_id)")

    conn.commit()
    conn.close()
    print("Phase 7 Subscriptions migration applied successfully!")

if __name__ == "__main__":
    migrate()
