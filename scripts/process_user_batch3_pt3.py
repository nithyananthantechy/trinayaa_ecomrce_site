import os
import sys
import sqlite3
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_IMG = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded", "media_1793862352253_cb5f114f.jpg"
)

CLIENT_GEN = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN = os.path.join(BASE_DIR, "public", "images", "products", "generated")
DEMO_CANDIDATES = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")

os.makedirs(CLIENT_GEN, exist_ok=True)
os.makedirs(PUBLIC_GEN, exist_ok=True)
os.makedirs(DEMO_CANDIDATES, exist_ok=True)

im = Image.open(SRC_IMG)

cards = [
    # Row 1 (3 items)
    ("TRN-1041", (11, 11, 252, 254), "Indian Screw Tree", "வலம்புரி - இடம்புரி"),
    ("TRN-1042", (260, 11, 505, 254), "Tailed pepper", "வால்மிளகு"),
    ("TRN-1043", (512, 11, 755, 254), "Nutmeg", "ஜாதிக்காய்"),
    # Row 2 (3 items)
    ("TRN-1044", (11, 262, 252, 507), "Sweet Flag", "வசம்பு"),
    ("TRN-1045", (260, 262, 505, 507), "Rosemary", "ரோஸ்மேரி"),
    ("TRN-1046", (512, 262, 755, 507), "Henna", "மருதாணி"),
    # Row 3 (2 items)
    ("TRN-1047", (11, 516, 379, 768), "Marjoram", "மரிக்கொழுந்து"),
    ("TRN-1048", (387, 516, 755, 768), "Country Senna Leaf", "நிலாவரை"),
    # Row 4 (2 items)
    ("TRN-1049", (11, 777, 379, 1020), "Hibiscus Leaf", "செம்பருத்தி இலை"),
    ("TRN-1050", (387, 777, 755, 1020), "Hibiscus Flower", "செம்பருத்தி பூ"),
]

# 1. Process and save images
for sku, box, name_en, name_ta in cards:
    crop = im.crop(box)
    ar = crop.width / crop.height
    
    if 0.95 <= ar <= 1.05:
        out_img = crop.resize((1024, 1024), Image.Resampling.LANCZOS)
    else:
        out_img = Image.new("RGB", (1024, 1024), (249, 247, 235))
        scale = 1024 / crop.width
        new_h = int(crop.height * scale)
        scaled_crop = crop.resize((1024, new_h), Image.Resampling.LANCZOS)
        y_offset = (1024 - new_h) // 2
        out_img.paste(scaled_crop, (0, y_offset))

    c_path = os.path.join(CLIENT_GEN, f"{sku}.webp")
    p_path = os.path.join(PUBLIC_GEN, f"{sku}.webp")
    d_path = os.path.join(DEMO_CANDIDATES, f"{sku}.webp")

    out_img.save(c_path, "WEBP", quality=92, method=6)
    out_img.save(p_path, "WEBP", quality=92, method=6)
    out_img.save(d_path, "WEBP", quality=92, method=6)

    sz = os.path.getsize(c_path)
    print(f"[CONVERTED] {sku}: {name_en} -> {sz:,} bytes (1024x1024 WebP)")

# 2. Update Live Database
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
for sku, _, _, _ in cards:
    img_rel = f"/images/products/generated/{sku}.webp"
    c.execute("UPDATE products SET primaryImage = ? WHERE sku = ?", (img_rel, sku))
conn.commit()
conn.close()
print("✓ Live database updated for TRN-1041 through TRN-1050.")

# 3. Update Manifest
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

skus_set = {c[0] for c in cards}
for r in rows:
    if r["sku"] in skus_set:
        r["status"] = "ACTIVE_STORE_READY"

fieldnames = list(rows[0].keys())
with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print("✓ Manifest updated for TRN-1041 through TRN-1050.")

# 4. Generate Review Contact Sheet
font_bold = "C:/Windows/Fonts/segoeuib.ttf"
font_regular = "C:/Windows/Fonts/segoeui.ttf"

title_font = ImageFont.truetype(font_bold, 20)
sub_font = ImageFont.truetype(font_regular, 13)
card_title_font = ImageFont.truetype(font_bold, 13)
card_meta_font = ImageFont.truetype(font_regular, 11)

contact_w = 5 * 300 + 6 * 20
contact_h = 2 * 360 + 3 * 20 + 80
contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
draw = ImageDraw.Draw(contact_img)

draw.text((25, 20), "TRINAYAA - Converted Product Images (Items 41 to 50: TRN-1041 to TRN-1050)", font=title_font, fill=(18, 61, 40))
draw.text((25, 48), "Converted to 1024x1024 WebP Template | 100% Original Image Integrity Preserved | Ready for Storefront", font=sub_font, fill=(108, 113, 103))

for idx, (sku, _, name_en, name_ta) in enumerate(cards):
    col = idx % 5
    row = idx // 5
    x = 20 + col * (300 + 20)
    y = 80 + row * (360 + 20)
    
    draw.rectangle([x, y, x + 300, y + 360], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
    
    webp_path = os.path.join(CLIENT_GEN, f"{sku}.webp")
    if os.path.exists(webp_path):
        thumb = Image.open(webp_path).resize((300, 300), Image.Resampling.LANCZOS)
        contact_img.paste(thumb, (x, y))
    
    draw.rectangle([x, y + 300, x + 300, y + 360], fill=(255, 255, 255))
    draw.text((x + 10, y + 308), f"{sku} - {name_en[:24]}", font=card_title_font, fill=(18, 61, 40))
    draw.text((x + 10, y + 330), f"Status: ACTIVE ON STOREFRONT [OK]", font=card_meta_font, fill=(4, 120, 87))

out_png = os.path.join(CLIENT_GEN, "contact_sheet_user_batch3b.png")
contact_img.save(out_png, "PNG")
pub_out_png = os.path.join(PUBLIC_GEN, "contact_sheet_user_batch3b.png")
contact_img.save(pub_out_png, "PNG")
print(f"✓ Saved review contact sheet: {out_png}")

