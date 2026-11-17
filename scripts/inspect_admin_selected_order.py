with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'selectedOrder &&' in line or 'selectedOrder !==' in line or 'selectedOrder.orderNumber' in line:
        print(f"--- Line {i+1} ---")
        for j in range(i, min(len(lines), i + 40)):
            print(f"{j+1}: {lines[j]}", end='')
        break
