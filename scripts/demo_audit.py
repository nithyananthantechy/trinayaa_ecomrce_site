import sqlite3
import os
import csv
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")
CLIENT_PUB = os.path.join(BASE_DIR, "client", "public")
DOCS_DIR = os.path.join(BASE_DIR, "docs")
os.makedirs(DOCS_DIR, exist_ok=True)
AUDIT_CSV_PATH = os.path.join(DOCS_DIR, "DEMO_IMAGE_AUDIT.csv")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("""
SELECT 
    p.id, p.sku, p.nameEn, p.nameTa, 
    COALESCE(c.name, 'Uncategorized') as category_name, 
    p.sellingPrice, p.stock, p.primaryImage, p.gallery,
    p.productType
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
ORDER BY p.id ASC
""")
products = cursor.fetchall()

print(f"Total products fetched: {len(products)}")

# Category breakdown
categories = Counter(p[4] for p in products)
print("\n--- Categories in Database ---")
for cat, count in categories.items():
    print(f"  - {cat}: {count} products")

# Image URL analysis
image_counts = Counter(p[7] for p in products)
print(f"\nTotal products: {len(products)}")
print(f"Unique primaryImage values: {len(image_counts)}")

top_duplicated = [item for item in image_counts.items() if item[1] > 1]
print(f"Number of duplicated image URLs: {len(top_duplicated)}")
for url, count in top_duplicated:
    print(f"  Repeated {count} times: {url}")

# Audit table rows
audit_rows = []
missing_files = []
generated_available = []

for p in products:
    p_id, sku, name_en, name_ta, cat, price, stock, img_url, gallery, p_type = p
    
    clean_path = (img_url or "").lstrip("/").replace("\\", "/")
    disk_path = os.path.join(CLIENT_PUB, clean_path)
    file_exists = os.path.exists(disk_path) if clean_path else False
    if not file_exists:
        missing_files.append((sku, img_url))
        
    dup_count = image_counts.get(img_url, 0)
    is_duplicate = dup_count > 1
    
    gen_file = os.path.join(CLIENT_PUB, "images", "products", "generated", f"{sku}.webp")
    has_generated = os.path.exists(gen_file)
    if has_generated:
        generated_available.append(sku)
        
    audit_rows.append({
        "product_id": p_id,
        "sku": sku,
        "name_en": name_en,
        "name_ta": name_ta,
        "category": cat,
        "product_type": p_type,
        "selling_price": price,
        "stock": stock,
        "original_primary_image": img_url,
        "file_exists_on_disk": "YES" if file_exists else "NO",
        "duplicate_count": dup_count,
        "is_duplicate_mapping": "YES" if is_duplicate else "NO",
        "has_generated_botanical": "YES" if has_generated else "NO",
        "generated_botanical_path": f"/images/products/generated/{sku}.webp" if has_generated else ""
    })

fieldnames = list(audit_rows[0].keys())
with open(AUDIT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(audit_rows)

print(f"\nMissing image files: {len(missing_files)}")
print(f"Generated botanical images available in generated/: {len(generated_available)}")
print(f"Audit successfully written to: {AUDIT_CSV_PATH}")
