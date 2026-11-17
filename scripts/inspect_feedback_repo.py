with open('server/db.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'feedbackRepo =' in line or 'productReviewsRepo =' in line:
        print(f"--- Found at line {i+1} ---")
        for j in range(i, min(len(lines), i + 35)):
            print(f"{j+1}: {lines[j]}", end='')
