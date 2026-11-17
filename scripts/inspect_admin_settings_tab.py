with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'activeTab === "settings"' in line or 'Minimum Cash on Delivery' in line:
        print(f"--- Line {i+1} ---")
        for j in range(max(0, i - 5), min(len(lines), i + 45)):
            print(f"{j+1}: {lines[j]}", end='')
        break
