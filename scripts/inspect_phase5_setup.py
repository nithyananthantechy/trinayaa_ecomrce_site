import sqlite3
import os

conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print("Database tables:", tables)

for t in ["settings", "site_content", "store_config", "configurations"]:
    if t in tables:
        c.execute(f"PRAGMA table_info({t})")
        print(f"Table {t} schema:", [col[1] for col in c.fetchall()])
        c.execute(f"SELECT * FROM {t} LIMIT 5")
        print(f"Table {t} sample rows:", c.fetchall())

c.execute("PRAGMA table_info(products)")
prod_cols = [col[1] for col in c.fetchall()]
print("Products columns:", prod_cols)

conn.close()
