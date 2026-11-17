with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'products:' in line:
        print(f"Line {i+1}: {line.strip()}")
        for j in range(i, min(len(lines), i + 20)):
            print(f"  {lines[j].strip()}")
