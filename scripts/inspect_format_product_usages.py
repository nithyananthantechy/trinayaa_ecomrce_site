with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'formatProduct(' in line:
        print(f"Line {i+1}: {lines[i].strip()}")
