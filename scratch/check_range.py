import csv

with open('docs/TRINAYAA_162_PRODUCT_BOTANICAL_MANIFEST.csv', encoding='utf-8') as f:
    for r in csv.DictReader(f):
        sku_num = int(r['sku'].split('-')[1])
        if 1040 <= sku_num <= 1094:
            print(f"{r['sku']}: EN='{r['name_en']}' | TA='{r['name_ta']}' | BOT='{r['botanical_name']}' | SEARCH='{r['search_query']}'")

