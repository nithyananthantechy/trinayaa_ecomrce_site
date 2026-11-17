import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# Inspect AdminDashboard tabs
with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print("--- Tabs in AdminDashboard ---")
for m in re.finditer(r'<TabsTrigger\s+value="([^"]+)"', text):
    print("Tab:", m.group(1))

# Check Customer tab content in AdminDashboard
print("\n--- Customers Section ---")
cust_idx = text.find('value="customers"')
if cust_idx != -1:
    print(text[cust_idx:cust_idx+800])

# Check Store Content tab in AdminDashboard
print("\n--- Store Content Section ---")
content_idx = text.find('value="content"')
if content_idx != -1:
    print(text[content_idx:content_idx+800])

