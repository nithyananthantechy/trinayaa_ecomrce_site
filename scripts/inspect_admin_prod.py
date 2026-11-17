with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'activeTab === "products"' in l:
        print(f'Products tab starts at line {i+1}')
    if 'activeTab === "settings"' in l:
        print(f'Settings tab starts at line {i+1}')

