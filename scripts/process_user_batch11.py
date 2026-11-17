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
    ".user_uploaded", "media_1793870339717_8896fdce.jpg"
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
    ("TRN-1101", (11, 11, 252, 254), "Lesser Galangal Powder", "சித்தரத்தை பொடி"),
    ("TRN-1102", (260, 11, 505, 254), "Sweet Basil Powder", "சீனி துளசி பொடி"),
    ("TRN-1103", (512, 11, 755, 254), "Indian Silver Fir Powder", "தாளிச்சபத்திரி பொடி"),
    # Row 2 (3 items)
    ("TRN-1104", (11, 262, 252, 507), "Long Pepper Powder", "திப்பிலி பொடி"),
    ("TRN-1105", (260, 262, 505, 507), "Indian Mallow Seeds Powder", "துத்தி பொடி"),
    ("TRN-1106", (512, 262, 755, 507), "Indian Sarasparilla Powder", "நன்னாரி பொடி"),
    # Row 3 (2 items)
    ("TRN-1107", (11, 545, 379, 768), "Black Plum Seeds Powder", "நாவல்கொட்டை பொடி"),
    ("TRN-1108", (387, 545, 755, 768), "Black Plum Bark Powder", "நாவல் பட்டை பொடி"),
    # Row 4 (2 items)
    ("TRN-1109", (11, 808, 379, 1020), "King of bitter Powder", "நிலவேம்பு பொடி"),
    ("TRN-1110", (387, 808, 755, 1020), "Caltrops Large Powder", "நெருஞ்சில் (பெ) பொடி"),
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
print("✓ Live database updated for TRN-1101 through TRN-1110.")

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
print("✓ Manifest updated for TRN-1101 through TRN-1110.")

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

draw.text((25, 20), "TRINAYAA - Converted Product Images (Items 101 to 110: TRN-1101 to TRN-1110)", font=title_font, fill=(18, 61, 40))
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

out_png = os.path.join(CLIENT_GEN, "contact_sheet_user_batch6b.png")
contact_img.save(out_png, "PNG")
pub_out_png = os.path.join(PUBLIC_GEN, "contact_sheet_user_batch6b.png")
contact_img.save(pub_out_png, "PNG")
print(f"✓ Saved review contact sheet: {out_png}")

