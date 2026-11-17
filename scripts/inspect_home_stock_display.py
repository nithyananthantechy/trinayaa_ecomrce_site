with open('client/src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(910, 930):
    print(f"{j+1}: {lines[j]}", end='')
