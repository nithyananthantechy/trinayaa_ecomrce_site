with open('server/db.ts', 'r', encoding='utf-8') as f:
    db_content = f.read()
with open('server/routers.ts', 'r', encoding='utf-8') as f:
    routers_content = f.read()

import re
print("Matches in db.ts for stock:")
for line in db_content.split('\n'):
    if 'stock' in line.lower() and ('update' in line.lower() or 'deduct' in line.lower() or 'decrement' in line.lower() or 'restore' in line.lower()):
        print(" ", line[:100])

print("\nMatches in routers.ts for stock:")
for line in routers_content.split('\n'):
    if 'stock' in line.lower() and ('deduct' in line.lower() or 'update' in line.lower() or 'restore' in line.lower()):
        print(" ", line[:100])
