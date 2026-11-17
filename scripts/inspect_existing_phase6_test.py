with open('server/phase6.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()
import re
print("Suites/describes in phase6.test.ts:")
for m in re.findall(r'describe\([\'\"]([^\'\"]+)[\'\"]', content):
    print(" -", m)
