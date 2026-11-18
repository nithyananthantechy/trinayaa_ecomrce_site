import os
import re

files_to_check = []
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root or 'backups' in root:
        continue
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            files_to_check.append(os.path.join(root, f))

matches = []
for p in files_to_check:
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        if re.search(r'festival|coupon', content, re.I):
            matches.append(p)

print(f"Total matching files: {len(matches)}")
for m in matches[:30]:
    print(" -", m)
