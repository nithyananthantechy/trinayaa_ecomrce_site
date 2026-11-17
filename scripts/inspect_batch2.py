import csv
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('data/product_image_manifest.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    print("--- BATCH 2 PRODUCTS (TRN-1011 TO TRN-1030) ---")
    for row in reader:
        sku = row['sku']
        num = int(sku.split('-')[1])
        if 1011 <= num <= 1030:
            print(f"[{sku}] {row['name_en']} ({row['name_ta']})")
            print(f"    Form: {row['product_form']} | Category: {row['category']}")
            print(f"    Prompt: {row['prompt'][:130]}...\n")

