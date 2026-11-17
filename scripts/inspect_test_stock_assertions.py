import os, glob

matches = []
for f in glob.glob('server/*.test.ts'):
    with open(f, 'r', encoding='utf-8') as fp:
        for idx, line in enumerate(fp):
            if 'product.stock' in line or 'p.stock' in line or 'products.list' in line:
                matches.append(f"{f}:{idx+1}: {line.strip()[:90]}")

print(f"Total test matches: {len(matches)}")
for m in matches:
    print(m)
