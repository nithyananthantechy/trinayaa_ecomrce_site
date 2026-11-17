with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'trpc.admin.products.list.useQuery' in line or 'trpc.products.list.useQuery' in line:
        print(f"--- Line {i+1} ---")
        for j in range(max(0, i - 5), min(len(lines), i + 20)):
            print(f"{j+1}: {lines[j]}", end='')
        break
