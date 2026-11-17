with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'ordersRepo =' in line:
        for j in range(i, len(lines)):
            if lines[j].startswith('};'):
                print(f"ordersRepo ends at line {j+1}: {lines[j]}")
                for k in range(max(0, j - 20), j + 1):
                    print(f"{k+1}: {lines[k]}", end='')
                break
        break
