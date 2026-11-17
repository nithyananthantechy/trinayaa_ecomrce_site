with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(897, min(len(lines), 950)):
    print(f"{j+1}: {lines[j]}", end='')
