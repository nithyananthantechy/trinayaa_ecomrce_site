with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'create: publicProcedure' in line and i > 900:
        print(f"--- line {i+1} ---")
        for j in range(i, min(len(lines), i + 80)):
            print(f"{j+1}: {lines[j]}", end='')
        break
