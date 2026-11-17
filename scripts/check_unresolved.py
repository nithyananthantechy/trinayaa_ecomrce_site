import json

with open('docs/WIKIMEDIA_SOURCING_AUDIT.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

unresolved = [v for v in data.values() if v.get('status') == 'NEEDS_BOTANICAL_CONFIRMATION' or not v.get('file_exists')]
print(f"Total needing confirmation: {len(unresolved)}")
for it in unresolved:
    print(f"  [{it['sku']}] {it['name_en']}")

