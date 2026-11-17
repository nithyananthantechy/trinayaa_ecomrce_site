with open('drizzle/schema.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import re
print("Tables in schema.ts:")
for m in re.findall(r'export const (\w+) = (?:sqliteTable|mysqlTable|pgTable)\([\'\"]([^\'\"]+)[\'\"]', content):
    print(" -", m[0], "->", m[1])
