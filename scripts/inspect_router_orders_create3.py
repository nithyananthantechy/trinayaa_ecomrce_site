with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(1040, min(len(lines), 1120)):
    print(f"{j+1}: {lines[j]}", end='')
