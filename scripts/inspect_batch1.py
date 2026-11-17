import csv
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('data/product_image_manifest.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    print("--- FIRST 10 PRODUCTS IN TRINAYAA CATALOGUE ---")
    for i, row in enumerate(reader):
        if i >= 10:
            break
        print(f"{i+1:2d}. [{row['sku']}] {row['name_en']} ({row['name_ta']})")
        print(f"    Form: {row['product_form']} | Category: {row['category']}")
        print(f"    Prompt: {row['prompt'][:130]}...")

