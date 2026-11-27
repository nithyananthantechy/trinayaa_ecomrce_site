import csv

with open('docs/TRINAYAA_162_PRODUCT_BOTANICAL_MANIFEST.csv', mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows in manifest: {len(rows)}")

shifted_rows = []
for i, r in enumerate(rows):
    sku = r['sku']
    name_en = r['name_en']
    name_ta = r['name_ta']
    bot = r['botanical_name']
    search_q = r['search_query']
    
    # Check obvious mismatches between English name and botanical name/search query
    # E.g. name contains "Seeds" or "Chia" or "Resin" or "Peel" or "Garlic"
    print(f"[{sku}] {name_en} ({name_ta}) -> Botanical: {bot} | Search: {search_q}")

