with open('server/notifications.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import re
print("Types/interfaces in notifications.ts:")
for m in re.findall(r'(?:type|interface)\s+([a-zA-Z0-9_]+)', content):
    print(" -", m)

print("\nMethods on notificationsService:")
for m in re.findall(r'([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{', content):
    print(" -", m)
