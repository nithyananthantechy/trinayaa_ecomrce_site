with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'failed to deduct stock' in line.lower() or 'deduct stock' in line.lower():
        start = max(0, i - 20)
        end = min(len(lines), i + 25)
        print(f"--- Around line {i+1} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j]}", end='')
