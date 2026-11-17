with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'orders: router({' in line and i > 1200:
        print(f"--- Line {i+1} ---")
        for j in range(i, min(len(lines), i + 40)):
            print(f"{j+1}: {lines[j]}", end='')
        break
