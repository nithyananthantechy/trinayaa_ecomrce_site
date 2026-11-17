with open('server/telegram.ts', 'r', encoding='utf-8') as f:
    content = f.read()
import re
print('Has low_stock:', 'low_stock' in content.lower() or 'low stock' in content.lower())
print('Has shipping:', 'shipping' in content.lower())
print('Commands found:', re.findall(r'case\s+[\'\"](\/[a-zA-Z0-9_-]+)[\'\"]', content))

# search for function names
print('Function exports:', re.findall(r'export (?:async )?function ([a-zA-Z0-9_]+)', content))
