with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1730, min(len(lines), 1840)):
    if 'customers:' in lines[i] or 'settings:' in lines[i]:
        print(f"Next router at line {i+1}: {lines[i]}")
        for k in range(i - 10, i + 2):
            print(f"{k+1}: {lines[k]}", end='')
        break
