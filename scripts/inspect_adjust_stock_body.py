with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(2708, min(len(lines), 2770)):
    print(f"{j+1}: {lines[j]}", end='')
