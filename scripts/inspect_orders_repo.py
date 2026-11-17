with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'ordersRepo =' in line:
        print(f"--- ordersRepo found at line {i+1} ---")
        for j in range(i, min(len(lines), i + 100)):
            print(f"{j+1}: {lines[j]}", end='')
        break
