with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'updateStock(id: string' in line or 'updateStock(productId: string' in line:
        print(f"--- Line {i+1} ---")
        for j in range(i, min(len(lines), i + 25)):
            print(f"{j+1}: {lines[j]}", end='')
