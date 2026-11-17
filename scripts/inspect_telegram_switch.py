with open('server/telegram.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(850, min(len(lines), 930)):
    print(f"{j+1}: {lines[j]}", end='')
