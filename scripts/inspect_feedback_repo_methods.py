with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(3540, min(len(lines), 3650)):
    print(f"{j+1}: {lines[j]}", end='')
