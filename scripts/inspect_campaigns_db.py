import sqlite3

conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()
c.execute("SELECT id, name, code, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, isActive, usageLimit, usageCount, bannerText FROM campaigns")
rows = c.fetchall()
print(f"Total campaigns in DB: {len(rows)}")
for r in rows:
    print(r)
