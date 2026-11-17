import os
import sys
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_IMG = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded", "media_1793859537392_77a6447c.jpg"
)

CLIENT_GEN = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN = os.path.join(BASE_DIR, "public", "images", "products", "generated")
DEMO_CANDIDATES = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")

os.makedirs(CLIENT_GEN, exist_ok=True)
os.makedirs(PUBLIC_GEN, exist_ok=True)
os.makedirs(DEMO_CANDIDATES, exist_ok=True)

im = Image.open(SRC_IMG)

# 10 cards definitions with exact pixel coordinates
cards = [
    # Row 1 (3 items)
    ("TRN-1001", (11, 11, 252, 254), "Licorice Root", "அதிமதுரம்"),
    ("TRN-1002", (260, 11, 505, 254), "Ashwagandha - 1", "அமுக்கரா"),
    ("TRN-1003", (512, 11, 755, 254), "Peepal Seeds", "அரச விதை"),
    # Row 2 (3 items)
    ("TRN-1004", (11, 262, 252, 507), "Ashwagandha - 2", "அஸ்வகந்தா"),
    ("TRN-1005", (260, 262, 505, 507), "Inknut/Myrobalan", "கடுக்காய்"),
    ("TRN-1006", (512, 262, 755, 507), "Indian Aloe Gum", "கரியபவளம்"),
    # Row 3 (2 items)
    ("TRN-1007", (11, 516, 379, 768), "Fever Nut", "கழற்சிக்காய்"),
    ("TRN-1008", (387, 516, 755, 768), "Babchi Seeds", "கார்போக அரிசி"),
    # Row 4 (2 items)
    ("TRN-1009", (11, 777, 379, 1020), "Malabar Tamarind", "குடம்புளி"),
    ("TRN-1010", (387, 777, 755, 1020), "Lesser Galangal", "சித்தரத்தை"),
]

for idx, (sku, box, name_en, name_ta) in enumerate(cards):
    crop = im.crop(box)
    
    # Check aspect ratio
    ar = crop.width / crop.height
    if 0.95 <= ar <= 1.05:
        # Square crop (Cards 1 to 6)
        out_img = crop.resize((1024, 1024), Image.Resampling.LANCZOS)
    else:
        # Wide card (Cards 7 to 10) - Preserve 100% of the image on seamless ivory background
        out_img = Image.new("RGB", (1024, 1024), (249, 247, 235))
        scale = 1024 / crop.width
        new_h = int(crop.height * scale)
        scaled_crop = crop.resize((1024, new_h), Image.Resampling.LANCZOS)
        y_offset = (1024 - new_h) // 2
        out_img.paste(scaled_crop, (0, y_offset))

    # Save to all target locations in WebP format
    c_path = os.path.join(CLIENT_GEN, f"{sku}.webp")
    p_path = os.path.join(PUBLIC_GEN, f"{sku}.webp")
    d_path = os.path.join(DEMO_CANDIDATES, f"{sku}.webp")

    out_img.save(c_path, "WEBP", quality=92, method=6)
    out_img.save(p_path, "WEBP", quality=92, method=6)
    out_img.save(d_path, "WEBP", quality=92, method=6)

    sz = os.path.getsize(c_path)
    print(f"[CONVERTED] {sku}: {name_en} -> {sz:,} bytes (1024x1024 WebP)")

print("\nAll 10 user-provided product images processed & saved to 1024x1024 WebP format.")

