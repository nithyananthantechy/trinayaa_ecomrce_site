import sqlite3

conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()
c.execute("DELETE FROM products WHERE sku LIKE 'TRN-T5-%'")
c.execute("DELETE FROM campaigns WHERE code LIKE 'CODTEST%'")
conn.commit()
c.execute("SELECT COUNT(*) FROM products")
print("Total products in database:", c.fetchone()[0])
conn.close()
