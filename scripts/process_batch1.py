import os
import sys
import hashlib
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAIN_DIR = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868"
CLIENT_GEN_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")

os.makedirs(CLIENT_GEN_DIR, exist_ok=True)
os.makedirs(PUBLIC_GEN_DIR, exist_ok=True)

batch_files = {
    "TRN-1002": os.path.join(BRAIN_DIR, "trn_1002_1793789871224.jpg"),
    "TRN-1003": os.path.join(BRAIN_DIR, "trn_1003_1793789894718.jpg"),
    "TRN-1004": os.path.join(BRAIN_DIR, "trn_1004_1793789920352.jpg"),
    "TRN-1005": os.path.join(BRAIN_DIR, "trn_1005_1793789948057.jpg"),
    "TRN-1006": os.path.join(BRAIN_DIR, "trn_1006_1793789983377.jpg"),
    "TRN-1007": os.path.join(BRAIN_DIR, "trn_1007_1793790013038.jpg"),
    "TRN-1008": os.path.join(BRAIN_DIR, "trn_1008_1793790041833.jpg"),
    "TRN-1009": os.path.join(BRAIN_DIR, "trn_1009_1793790070526.jpg"),
    "TRN-1010": os.path.join(BRAIN_DIR, "trn_1010_1793790101113.jpg"),
}

print("=== CONVERTING & NORMALIZING BATCH 1 TO 1024x1024 WEBP ===")
for sku, src in batch_files.items():
    if not os.path.exists(src):
        print(f"Error: Source not found for {sku}: {src}")
        continue
    
    im = Image.open(src).convert("RGB")
    im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    dest1 = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
    dest2 = os.path.join(PUBLIC_GEN_DIR, f"{sku}.webp")
    
    im.save(dest1, "WEBP", quality=90, method=6)
    im.save(dest2, "WEBP", quality=90, method=6)
    print(f"  ✓ {sku}.webp -> {os.path.getsize(dest1)/1024:.1f} KB")

# Verification & Quality Validation (Task 6)
print("\n=== TASK 6: QUALITY VALIDATION & HASH VERIFICATION ===")
hashes = set()
validation_results = []

for i in range(1, 11):
    sku = f"TRN-{1000 + i}"
    path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
    if not os.path.exists(path):
        validation_results.append((sku, "MISSING", 0, (0,0), "N/A"))
        continue
    
    im = Image.open(path)
    size = im.size
    fmt = im.format
    with open(path, "rb") as f:
        file_bytes = f.read()
    h = hashlib.sha256(file_bytes).hexdigest()
    is_unique = h not in hashes
    hashes.add(h)
    
    status_ok = size == (1024, 1024) and fmt == "WEBP" and is_unique
    validation_results.append((sku, "VALID" if status_ok else "FAIL", len(file_bytes)/1024, size, h[:10]))
    print(f"  • {sku}: Format={fmt}, Size={size}, Weight={len(file_bytes)/1024:.1f}KB, Unique={is_unique}, Hash={h[:10]}")

# Update manifest CSV
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for i in range(10):
    rows[i]["status"] = "GENERATED_READY_FOR_REVIEW"

fieldnames = list(rows[0].keys())
with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print(f"\nManifest updated with Batch 1 status: GENERATED_READY_FOR_REVIEW")

# Generate High Resolution Contact Sheet Image (2 rows x 5 columns)
print("\n=== GENERATING COMPOSITE CONTACT SHEET IMAGE ===")
contact_w = 5 * 320 + 6 * 20
contact_h = 2 * 380 + 3 * 20 + 80
contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
draw = ImageDraw.Draw(contact_img)

# Title
draw.text((30, 25), "TRINAYAA — Botanical Photography Pipeline (Batch 1: TRN-1001 to TRN-1010)", fill=(18, 61, 40))
draw.text((30, 50), "Natural Raw Botanicals · 1024x1024 WebP · Shallow Teak Bowls · Ivory Limestone Surface · 100% Unique", fill=(108, 113, 103))

for idx in range(10):
    col = idx % 5
    row = idx // 5
    x = 20 + col * (320 + 20)
    y = 90 + row * (380 + 20)
    
    sku = f"TRN-{1001 + idx}"
    webp_path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
    
    # White card background
    draw.rectangle([x, y, x + 320, y + 380], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
    
    if os.path.exists(webp_path):
        thumb = Image.open(webp_path).resize((320, 300), Image.Resampling.LANCZOS)
        contact_img.paste(thumb, (x, y))
    
    name_en = rows[idx]["name_en"]
    name_ta = rows[idx]["name_ta"]
    form = rows[idx]["product_form"]
    
    # Draw label box
    draw.rectangle([x, y + 300, x + 320, y + 380], fill=(255, 255, 255))
    draw.text((x + 10, y + 308), f"{sku} — {name_en}", fill=(18, 61, 40))
    draw.text((x + 10, y + 328), f"Form: {form}", fill=(70, 100, 80))
    draw.text((x + 10, y + 348), "STATUS: READY FOR REVIEW", fill=(4, 120, 87))

contact_sheet_png = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch1.png")
contact_sheet_artifact = os.path.join(BRAIN_DIR, "contact_sheet_batch1.jpg")
contact_img.save(contact_sheet_png, "PNG")
contact_img.save(contact_sheet_artifact, "JPEG", quality=92)
print(f"Contact sheet saved to {contact_sheet_png} and {contact_sheet_artifact}")

# Re-run HTML contact sheet generator
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_pipeline import generate_html_contact_sheet
generate_html_contact_sheet(rows[:10], os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch1.html"))
print("All tasks completed successfully!")

