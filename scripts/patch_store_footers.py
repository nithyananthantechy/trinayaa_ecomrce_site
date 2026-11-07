import re
import os

files = ['About.tsx', 'Catalog.tsx', 'Contact.tsx', 'Home.tsx', 'ProductDetail.tsx']

for fname in files:
    path = os.path.join('client', 'src', 'pages', fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if StoreFooter is already imported
    if 'StoreFooter' not in content:
        # Add import StoreFooter from "@/components/StoreFooter";
        # Put it after the other component imports
        import_stmt = 'import StoreFooter from "@/components/StoreFooter";\n'
        # find last import
        matches = list(re.finditer(r'^import .*?;', content, re.MULTILINE))
        if matches:
            last_import = matches[-1]
            pos = last_import.end()
            content = content[:pos] + '\n' + import_stmt + content[pos:]
        else:
            content = import_stmt + content

    # Replace <footer className="site-footer">...</footer> with <StoreFooter />
    new_content, count = re.subn(r'<footer className=["\']site-footer["\'].*?</footer>', '<StoreFooter />', content, flags=re.DOTALL)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched footer in {fname} (replaced {count} footer)")
    else:
        print(f"Warning: No footer matched in {fname}")
