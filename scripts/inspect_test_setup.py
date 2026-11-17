with open('server/phase5_cod_controls.test.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(0, 45):
    print(f"{j+1}: {lines[j]}", end='')
