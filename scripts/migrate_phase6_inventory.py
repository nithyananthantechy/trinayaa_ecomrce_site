import sqlite3
import datetime
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "trinayaa.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    now = datetime.datetime.now().isoformat()

    print(f"Connecting to database at: {DB_PATH}")

    # 1. Create low_stock_alerts table for persistent deduplication
    c.execute("""
    CREATE TABLE IF NOT EXISTS low_stock_alerts (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL UNIQUE,
        sku TEXT NOT NULL,
        thresholdAtAlert INTEGER NOT NULL,
        stockAtAlert INTEGER NOT NULL,
        alertState TEXT NOT NULL, -- 'ALERTED' or 'CLEARED'
        lastAlertSentAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )
    """)
    print("✓ Created/verified table 'low_stock_alerts'")

    # 2. Add low_stock_threshold to site_content if not present
    c.execute("SELECT value FROM site_content WHERE key = 'low_stock_threshold'")
    row = c.fetchone()
    if not row:
        c.execute("""
        INSERT INTO site_content (key, value, updatedAt)
        VALUES ('low_stock_threshold', '10', ?)
        """, (now,))
        print("✓ Initialized 'low_stock_threshold' in site_content with default '10'")
    else:
        print(f"✓ 'low_stock_threshold' already present in site_content: {row[0]}")

    conn.commit()
    conn.close()
    print("✓ Phase 6 database migration completed successfully.")

if __name__ == "__main__":
    migrate()
