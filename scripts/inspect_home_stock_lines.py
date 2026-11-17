with open('client/src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx in [45, 46, 47, 48, 49, 1254, 1255, 1256, 1257, 1258]:
    if idx < len(lines):
        print(f"{idx+1}: {lines[idx]}", end='')
