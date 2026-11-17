import os, glob

matches = []
for root, dirs, files in os.walk('client/src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fp:
                for idx, line in enumerate(fp):
                    if 'stock' in line.lower() and not 'admin' in path.lower():
                        matches.append(f"{path}:{idx+1}: {line.strip()[:80]}")

print(f"Total public frontend matches for stock: {len(matches)}")
for m in matches[:30]:
    print(m)
