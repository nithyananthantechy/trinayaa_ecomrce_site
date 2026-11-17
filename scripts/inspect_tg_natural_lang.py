with open('server/telegram.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(808, 860):
    print(f"{j+1}: {lines[j]}", end='')
