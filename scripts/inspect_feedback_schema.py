with open('drizzle/schema.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'customerFeedback =' in line or 'productReviews =' in line:
        print(f"--- Schema at Line {i+1} ---")
        for j in range(i, min(len(lines), i + 30)):
            print(f"{j+1}: {lines[j]}", end='')
