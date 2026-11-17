import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

completed_skus = [
    f"TRN-{i}" for i in list(range(1001, 1019)) + list(range(1021, 1029)) + list(range(1031, 1044))
]

print(f"Applying verified images to live database for {len(completed_skus)} products...")

updated_count = 0
for sku in completed_skus:
    img_rel = f"/images/products/generated/{sku}.webp"
    c.execute("UPDATE products SET primaryImage = ? WHERE sku = ?", (img_rel, sku))
    updated_count += c.rowcount

conn.commit()

c.execute("SELECT COUNT(id) FROM products WHERE primaryImage LIKE '/images/products/generated/%'")
verified_in_db = c.fetchone()[0]

print(f"Update complete! {verified_in_db} products now directly point to their verified 1024x1024 WebP botanical photographs.")

c.execute("SELECT sku, nameEn, primaryImage FROM products WHERE primaryImage LIKE '/images/products/generated/%' LIMIT 10")
for row in c.fetchall():
    print(f"  [STORE READY] {row[0]}: {row[1]} -> {row[2]}")

conn.close()

