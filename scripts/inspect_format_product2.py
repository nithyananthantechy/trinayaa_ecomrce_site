with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(825, min(len(lines), 860)):
    print(f"{j+1}: {lines[j]}", end='')
