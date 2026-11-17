with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
print("Tabs in AdminDashboard:")
for m in re.findall(r'value=[\'\"]([a-zA-Z0-9_-]+)[\'\"]', content):
    print(" -", m)

print("\nOccurrences of orders in AdminDashboard:")
for idx, line in enumerate(content.split('\n')):
    if 'orders' in line.lower() and ('table' in line.lower() or 'dialog' in line.lower() or 'modal' in line.lower() or 'tab' in line.lower()):
        print(f" {idx+1}: {line.strip()[:90]}")
