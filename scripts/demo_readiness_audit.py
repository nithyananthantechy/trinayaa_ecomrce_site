import os
import sys
import sqlite3
import csv
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")
CLIENT_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")

report = []
errors = []

# 1. Database Check
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT COUNT(*) FROM products")
total_products = c.fetchone()[0]
report.append(f"1. Total Products in Database: {total_products}")

c.execute("SELECT COUNT(*) FROM products WHERE primaryImage LIKE '/images/products/generated/TRN-%.webp'")
valid_images_db = c.fetchone()[0]
report.append(f"   Products with generated WebP image in DB: {valid_images_db} / {total_products}")
if valid_images_db != 162:
    errors.append(f"DB mismatch: only {valid_images_db} have valid generated images")

# Check for any null or broken primaryImage
c.execute("SELECT id, sku, nameEn, primaryImage FROM products WHERE primaryImage IS NULL OR primaryImage = ''")
empty_images = c.fetchall()
if empty_images:
    errors.append(f"Empty primary images found: {len(empty_images)}")
else:
    report.append("   All 162 products have non-empty primaryImage.")

conn.close()

# 2. Filesystem Check (Client & Public)
client_files = 0
public_files = 0
dimension_issues = 0
size_issues = 0

for i in range(1001, 1163):
    sku = f"TRN-{i}"
    c_file = os.path.join(CLIENT_DIR, f"{sku}.webp")
    p_file = os.path.join(PUBLIC_DIR, f"{sku}.webp")
    
    if os.path.exists(c_file):
        client_files += 1
        sz = os.path.getsize(c_file)
        if sz < 5000:
            errors.append(f"{sku}.webp unusually small ({sz} bytes)")
        try:
            with Image.open(c_file) as img:
                if img.size != (1024, 1024):
                    dimension_issues += 1
                    errors.append(f"{sku}.webp has dimensions {img.size}, expected (1024, 1024)")
        except Exception as e:
            errors.append(f"Error opening {c_file}: {e}")
    else:
        errors.append(f"Missing in client: {sku}.webp")

    if os.path.exists(p_file):
        public_files += 1
    else:
        errors.append(f"Missing in public: {sku}.webp")

report.append(f"2. Filesystem Check:")
report.append(f"   Client folder files: {client_files} / 162")
report.append(f"   Public folder files: {public_files} / 162")
report.append(f"   Dimension check: {162 - dimension_issues} / 162 are exactly 1024x1024")

# 3. Manifest Check
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))
manifest_ready = sum(1 for r in rows if r.get("status") == "ACTIVE_STORE_READY")
report.append(f"3. Manifest Check:")
report.append(f"   Total rows in manifest: {len(rows)}")
report.append(f"   Status ACTIVE_STORE_READY: {manifest_ready} / {len(rows)}")
if manifest_ready != 162:
    errors.append(f"Manifest mismatch: {manifest_ready} ready vs 162 expected")

# 4. Whitelist Check in productImage.ts
ts_path = os.path.join(BASE_DIR, "client", "src", "lib", "productImage.ts")
with open(ts_path, "r", encoding="utf-8") as f:
    ts_text = f.read()

import re
ts_skus = re.findall(r'"(TRN-\d{4})"', ts_text)
report.append(f"4. TypeScript Whitelist Check:")
report.append(f"   SKUs in VERIFIED_BOTANICAL_SKUS: {len(ts_skus)} / 162")
if len(ts_skus) != 162:
    errors.append(f"Whitelist mismatch: {len(ts_skus)} in list vs 162 expected")

# Summary
print("==================================================")
print("       TRINAYAA DEMO READINESS AUDIT REPORT        ")
print("==================================================")
for line in report:
    print(line)

print("\n--- ISSUES FOUND ---")
if errors:
    for e in errors:
        print("❌", e)
else:
    print("✅ ZERO ISSUES FOUND! ALL 162 PRODUCTS ARE DEMO READY!")
print("==================================================")

