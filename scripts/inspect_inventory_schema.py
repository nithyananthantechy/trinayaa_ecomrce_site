with open('drizzle/schema.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'export const inventory =' in line:
        for j in range(i, min(len(lines), i + 25)):
            print(lines[j], end='')
        break
