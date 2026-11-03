import os
import sys
import sqlite3
from PIL import Image, ImageDraw, ImageFont
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
master_path = os.path.join(base_dir, "client", "public", "images", "products", "Trinayaa Moringa Leaf Pouch-3.png")

if not os.path.exists(master_path):
    print("Master image not found!")
    sys.exit(1)

master_img = Image.open(master_path).convert("RGB")
master_arr = np.array(master_img, dtype=np.float32)

# Bowl mask
bowl_mask = np.zeros(master_arr.shape[:2], dtype=bool)
bowl_mask[800:1150, 600:1050] = True
green_pixels = bowl_mask & (master_arr[:, :, 1] > master_arr[:, :, 0] + 5) & (master_arr[:, :, 2] + 5 < master_arr[:, :, 1])

# Fonts
font_ta_file = "C:/Windows/Fonts/Nirmala.ttc"
font_en_file = "C:/Windows/Fonts/georgiab.ttf"

def get_bowl_type(name_en):
    lower = name_en.lower()
    if any(k in lower for k in ["turmeric", "fenugreek", "mustard", "cumin", "yellow", "ginger"]):
        return "gold"
    elif any(k in lower for k in ["black", "kalonji", "sesame", "chia", "nigella"]):
        return "black"
    elif any(k in lower for k in ["hibiscus", "rose", "pomegranate", "red", "beet"]):
        return "red"
    elif any(k in lower for k in ["ashwagandha", "licorice", "triphala", "cinnamon", "peepal", "inknut", "root", "bark", "fever", "nut", "dry", "tamarind"]):
        return "brown"
    else:
        return "green"

def render_product_pouch(name_en, name_ta, bowl_type, out_path):
    arr = master_arr.copy()
    if np.sum(green_pixels) > 0 and bowl_type != "green":
        intensity = (arr[green_pixels, 0] + arr[green_pixels, 1] + arr[green_pixels, 2]) / 3.0
        if bowl_type in ("gold", "yellow"):
            arr[green_pixels, 0] = np.clip(intensity * 1.50, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 1.15, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.35, 0, 255)
        elif bowl_type in ("brown", "root"):
            arr[green_pixels, 0] = np.clip(intensity * 1.25, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.85, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.55, 0, 255)
        elif bowl_type in ("black", "seed"):
            arr[green_pixels, 0] = np.clip(intensity * 0.45, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.48, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.50, 0, 255)
        elif bowl_type in ("red", "hibiscus"):
            arr[green_pixels, 0] = np.clip(intensity * 1.55, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.45, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.45, 0, 255)

    im = Image.fromarray(arr.astype(np.uint8))
    draw = ImageDraw.Draw(im)

    # 1. Green banner
    banner_box = (385, 545, 885, 615)
    draw.rounded_rectangle(banner_box, radius=8, fill=(30, 57, 14))

    clean_en = name_en.strip().upper()
    font_size_en = 36
    if len(clean_en) > 26:
        font_size_en = 24
    elif len(clean_en) > 20:
        font_size_en = 28
    elif len(clean_en) > 15:
        font_size_en = 32

    font_en = ImageFont.truetype(font_en_file, font_size_en)
    bbox_en = draw.textbbox((0, 0), clean_en, font=font_en)
    tw_en = bbox_en[2] - bbox_en[0]
    th_en = bbox_en[3] - bbox_en[1]
    tx_en = (banner_box[0] + banner_box[2] - tw_en) // 2
    ty_en = (banner_box[1] + banner_box[3] - th_en) // 2 - 2
    draw.text((tx_en, ty_en), clean_en, font=font_en, fill=(255, 255, 255))

    # 2. Cover entire old Tamil zone seamlessly
    y_start = 616
    y_end = 718
    for y in range(y_start, y_end + 1):
        ratio = (y - y_start) / float(y_end - y_start)
        r = int(254 * (1.0 - ratio) + 250 * ratio)
        g = int(250 * (1.0 - ratio) + 245 * ratio)
        b = int(238 * (1.0 - ratio) + 232 * ratio)
        draw.line([(370, y), (900, y)], fill=(r, g, b))

    # 3. Draw clean new Tamil name centered
    if name_ta and name_ta.strip():
        clean_ta = name_ta.strip()
        font_size_ta = 34
        if len(clean_ta) > 24:
            font_size_ta = 24
        elif len(clean_ta) > 18:
            font_size_ta = 28

        font_ta = ImageFont.truetype(font_ta_file, font_size_ta)
        bbox_ta = draw.textbbox((0, 0), clean_ta, font=font_ta)
        tw_ta = bbox_ta[2] - bbox_ta[0]
        th_ta = bbox_ta[3] - bbox_ta[1]
        tx_ta = (banner_box[0] + banner_box[2] - tw_ta) // 2
        ty_ta = (y_start + y_end - th_ta) // 2 - 2
        draw.text((tx_ta, ty_ta), clean_ta, font=font_ta, fill=(24, 45, 18))

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    im.save(out_path, format="JPEG", quality=92, optimize=True)

# Connect to database and process all products
db_path = os.path.join(base_dir, "data", "trinayaa.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT id, sku, nameEn, nameTa FROM products ORDER BY id")
products = cursor.fetchall()

client_out_dir = os.path.join(base_dir, "client", "public", "images", "products", "packaged")
dist_out_dir = os.path.join(base_dir, "dist", "public", "images", "products", "packaged")
os.makedirs(client_out_dir, exist_ok=True)
os.makedirs(dist_out_dir, exist_ok=True)

print(f"Generating authentic matching branded packaging for {len(products)} products...")

updated_count = 0
for idx, (prod_id, sku, name_en, name_ta) in enumerate(products):
    file_basename = f"{sku.lower()}.jpg"
    client_file = os.path.join(client_out_dir, file_basename)
    dist_file = os.path.join(dist_out_dir, file_basename)
    public_url = f"/images/products/packaged/{file_basename}"

    bowl = get_bowl_type(name_en)
    render_product_pouch(name_en, name_ta or "", bowl, client_file)
    
    # Also copy to dist
    with open(client_file, "rb") as rf:
        with open(dist_file, "wb") as wf:
            wf.write(rf.read())

    # Update database record
    gallery_json = f'["{public_url}"]'
    cursor.execute("""
        UPDATE products 
        SET primaryImage = ?, gallery = ?
        WHERE id = ?
    """, (public_url, gallery_json, prod_id))
    
    updated_count += 1
    if (idx + 1) % 25 == 0 or (idx + 1) == len(products):
        print(f"Processed {idx + 1}/{len(products)} products...")

conn.commit()
conn.close()
print(f"DONE! Successfully generated and matched {updated_count} product images with accurate English and Tamil names!")
