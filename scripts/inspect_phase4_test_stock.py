with open('server/phase4.test.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(138, 155):
    print(f"{j+1}: {lines[j]}", end='')
