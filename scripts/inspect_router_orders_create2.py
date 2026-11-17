with open('server/routers.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'orders: router({' in line:
        for j in range(i, min(len(lines), i + 200)):
            if 'create:' in lines[j] or 'createOrder' in lines[j]:
                print(f"Line {j+1}: {lines[j]}")
                for k in range(j, min(len(lines), j + 60)):
                    print(f"{k+1}: {lines[k]}", end='')
                break
        break
