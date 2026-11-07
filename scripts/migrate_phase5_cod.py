import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. Add isCodAvailable to products
c.execute("PRAGMA table_info(products)")
cols = [col[1] for col in c.fetchall()]

if "isCodAvailable" not in cols:
    print("Adding isCodAvailable column to products table...")
    c.execute("ALTER TABLE products ADD COLUMN isCodAvailable INTEGER NOT NULL DEFAULT 1;")
    print("✓ Added isCodAvailable column with DEFAULT 1.")
else:
    print("isCodAvailable column already exists in products.")

# Ensure all existing products have isCodAvailable set to 1 if NULL
c.execute("UPDATE products SET isCodAvailable = 1 WHERE isCodAvailable IS NULL")

# 2. Check site_content for minimum_cod_order_value
c.execute("SELECT value FROM site_content WHERE key = 'minimum_cod_order_value'")
row = c.fetchone()
if not row:
    print("Initializing minimum_cod_order_value to 150 in site_content...")
    c.execute(
        "INSERT INTO site_content (key, value, updatedAt) VALUES ('minimum_cod_order_value', '150', datetime('now'))"
    )
    print("✓ minimum_cod_order_value initialized to 150.")
else:
    print(f"minimum_cod_order_value already set to: {row[0]}")

conn.commit()

# Verify counts
c.execute("SELECT COUNT(*), SUM(isCodAvailable) FROM products")
total_prods, cod_prods = c.fetchone()
print(f"✓ Products audit: {cod_prods}/{total_prods} products have COD enabled by default.")

conn.close()
print("Migration completed successfully.")
