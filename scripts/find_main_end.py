with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '</main>' in l:
        print(f"</main> line: {i+1}")
