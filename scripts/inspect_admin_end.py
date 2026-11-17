with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(len(lines) - 40, len(lines)):
    print(f"{j+1}: {lines[j]}", end='')
