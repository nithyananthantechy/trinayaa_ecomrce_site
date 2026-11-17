with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(0, 40):
    print(f"{j+1}: {lines[j]}", end='')
