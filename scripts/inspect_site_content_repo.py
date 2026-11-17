with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'siteContentRepo =' in line:
        print(f"--- Line {i+1} ---")
        for j in range(i, min(len(lines), i + 45)):
            print(f"{j+1}: {lines[j]}", end='')
        break
