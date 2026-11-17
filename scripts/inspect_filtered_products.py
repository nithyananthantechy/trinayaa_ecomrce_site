with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'filteredProducts' in line:
        print(f"--- Line {i+1} ---")
        for j in range(max(0, i - 5), min(len(lines), i + 30)):
            print(f"{j+1}: {lines[j]}", end='')
        break
