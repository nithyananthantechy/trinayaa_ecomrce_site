import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()
c.execute("SELECT sku, nameEn, nameTa, primaryImage FROM products WHERE primaryImage NOT LIKE '/images/products/generated/%'")
rows = c.fetchall()
print(f"Remaining count: {len(rows)}")
for r in rows:
    print(r)
conn.close()

