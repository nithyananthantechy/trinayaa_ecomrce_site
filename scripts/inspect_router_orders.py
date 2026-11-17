with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'orders: router({' in line or 'orders = router({' in line or 'create: publicProcedure' in line:
        print(f"--- line {i+1} ---")
        for j in range(i, min(len(lines), i + 60)):
            print(f"{j+1}: {lines[j]}", end='')
        break
