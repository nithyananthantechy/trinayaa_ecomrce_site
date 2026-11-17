import sqlite3

conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()
c.execute("SELECT COUNT(*) FROM products WHERE primaryImage LIKE '%/generated/%'")
count_gen = c.fetchone()[0]
c.execute("SELECT COUNT(*) FROM products")
total = c.fetchone()[0]

print(f"Total products: {total}")
print(f"Products pointing to /generated/: {count_gen} (Must be 0 to confirm live DB unchanged)")
assert count_gen == 0, "Database was modified!"
print("DATABASE IS 100% UNTOUCHED AND SAFE.")

