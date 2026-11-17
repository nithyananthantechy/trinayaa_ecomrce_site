with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'products: router({' in line:
        print(f"--- Line {i+1} ---")
        for j in range(i, min(len(lines), i + 70)):
            print(f"{j+1}: {lines[j]}", end='')
        break
