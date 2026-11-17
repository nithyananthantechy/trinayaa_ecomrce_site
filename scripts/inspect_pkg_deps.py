with open('package.json', 'r', encoding='utf-8') as f:
    content = f.read()
import json
pkg = json.loads(content)
print("Dependencies:", list(pkg.get("dependencies", {}).keys()))
print("DevDependencies:", list(pkg.get("devDependencies", {}).keys()))
