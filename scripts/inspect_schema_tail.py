with open('drizzle/schema.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(len(lines) - 30, len(lines)):
    print(f"{j+1}: {lines[j]}", end='')
