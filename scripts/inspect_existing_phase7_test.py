with open('server/phase7.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import re
print("Suites/describes in phase7.test.ts:")
for m in re.findall(r'describe\([\'\"]([^\'\"]+)[\'\"]', content):
    print(" -", m)

print("\nTests in phase7.test.ts:")
for m in re.findall(r'it\([\'\"]([^\'\"]+)[\'\"]', content):
    print("   *", m)
