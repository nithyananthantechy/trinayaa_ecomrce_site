with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '{/* Sidebar */}' in l:
        print(f"Sidebar start line: {i+1}")
    if '{/* Top Header */}' in l:
        print(f"Header start line: {i+1}")
    if '{/* Tab Content */}' in l:
        print(f"Tab content start line: {i+1}")
