with open('server/telegram.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'export async function handleTelegramUpdate' in line or 'async function handleTelegramUpdate' in line:
        print(f"--- Line {i+1} ---")
        for j in range(i, min(len(lines), i + 60)):
            print(f"{j+1}: {lines[j]}", end='')
        break
