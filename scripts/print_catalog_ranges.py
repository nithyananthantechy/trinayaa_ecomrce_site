import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
with open('data/raw_catalog_162.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for step in [0, 30, 60, 90, 120, 140]:
    print(f"\n=== Range {step+1} to {min(len(items), step+10)} ===")
    for it in items[step:step+10]:
        print(f"  [{it['sku']}] {it['name_en']} ({it['name_ta']}) - {it['product_type']}")

