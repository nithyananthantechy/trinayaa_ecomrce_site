with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'exportCsv:' in line:
        print(f"--- Line {i+1} ---")
        for j in range(max(0, i - 10), min(len(lines), i + 20)):
            print(f"{j+1}: {lines[j]}", end='')
        break
