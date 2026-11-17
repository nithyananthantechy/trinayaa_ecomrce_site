with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'create(data:' in line or 'create(order:' in line or 'create(' in line:
        if i > 1500 and i < 2200:
            print(f"--- Line {i+1} ---")
            for j in range(i, min(len(lines), i + 60)):
                print(f"{j+1}: {lines[j]}", end='')
            break
