with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'orders: router({' in line and i > 1200:
        for j in range(i, min(len(lines), i + 100)):
            if lines[j].strip() == '}),':
                print(f"admin.orders ends at line {j+1}")
                for k in range(j - 10, j + 2):
                    print(f"{k+1}: {lines[k]}", end='')
                break
        break
