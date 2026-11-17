with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'inventoryrepo.adjuststock' in line.lower() or 'adjuststock(' in line.lower():
        print(f"--- Line {i+1} ---")
        for j in range(max(0, i - 5), min(len(lines), i + 15)):
            print(f"{j+1}: {lines[j]}", end='')
