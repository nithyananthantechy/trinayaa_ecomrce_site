import re

with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

match = re.search(r'return\s*\(\s*<div className=["\']min-h-screen.*?<main className=["\']p-6["\']>', text, re.DOTALL)
if match:
    print(match.group(0))
else:
    print("No match found")
