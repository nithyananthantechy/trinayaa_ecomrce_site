import sqlite3
from collections import Counter

conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()

c.execute('SELECT COUNT(*) FROM products;')
total = c.fetchone()[0]
print(f'Total products: {total}')

c.execute('SELECT primaryImage, COUNT(*) FROM products GROUP BY primaryImage HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC;')
duplicates = c.fetchall()
print(f'Distinct duplicate image assignments: {len(duplicates)}')
for img, cnt in duplicates[:10]:
    print(f'  {img}: used {cnt} times')

c.execute("SELECT COUNT(*) FROM products WHERE primaryImage IS NULL OR primaryImage = '';")
missing = c.fetchone()[0]
print(f'Missing primary images: {missing}')

c.execute('SELECT DISTINCT primaryImage FROM products;')
distinct_images = c.fetchall()
print(f'Total distinct primary images across {total} products: {len(distinct_images)}')

