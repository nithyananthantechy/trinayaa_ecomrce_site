import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def compose_trinayaa_packaging(name_en, name_ta, bowl_type, out_path):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    master_path = os.path.join(base_dir, "client", "public", "images", "products", "Trinayaa Moringa Leaf Pouch-3.png")

    if not os.path.exists(master_path):
        raise FileNotFoundError(f"Master pouch image not found at {master_path}")

    im = Image.open(master_path).convert("RGB")
    arr = np.array(im, dtype=np.float32)

    # 1. Bowl content tinting based on botanical type
    bowl_mask = np.zeros(arr.shape[:2], dtype=bool)
    bowl_mask[800:1150, 600:1050] = True
    green_pixels = bowl_mask & (arr[:, :, 1] > arr[:, :, 0] + 5) & (arr[:, :, 1] > arr[:, :, 2] + 5)

    if np.sum(green_pixels) > 0 and bowl_type != "green":
        intensity = (arr[green_pixels, 0] + arr[green_pixels, 1] + arr[green_pixels, 2]) / 3.0
        
        if bowl_type == "gold" or bowl_type == "yellow":
            # Golden turmeric / fenugreek seeds
            arr[green_pixels, 0] = np.clip(intensity * 1.5, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 1.15, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.35, 0, 255)
        elif bowl_type == "brown" or bowl_type == "root":
            # Earthy brown root / powder (Ashwagandha, Licorice, Triphala)
            arr[green_pixels, 0] = np.clip(intensity * 1.25, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.85, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.55, 0, 255)
        elif bowl_type == "black" or bowl_type == "seed":
            # Black kalonji / chia / black sesame
            arr[green_pixels, 0] = np.clip(intensity * 0.45, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.48, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.50, 0, 255)
        elif bowl_type == "red" or bowl_type == "hibiscus":
            # Red herbal petals / bark (Hibiscus, Rose, Cinnamon)
            arr[green_pixels, 0] = np.clip(intensity * 1.55, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.45, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.45, 0, 255)

    im = Image.fromarray(arr.astype(np.uint8))
    draw = ImageDraw.Draw(im)

    # 2. Draw crisp deep green banner
    banner_box = (388, 545, 882, 615)
    draw.rounded_rectangle(banner_box, radius=8, fill=(30, 57, 14))

    # 3. Dynamic font sizing for English product name
    clean_en = name_en.strip().upper()
    font_size_en = 38
    if len(clean_en) > 22:
        font_size_en = 28
    elif len(clean_en) > 16:
        font_size_en = 32

    font_en = None
    for font_candidate in [
        "C:/Windows/Fonts/georgiab.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "arial.ttf"
    ]:
        try:
            font_en = ImageFont.truetype(font_candidate, font_size_en)
            break
        except Exception:
            continue

    if font_en is None:
        font_en = ImageFont.load_default()

    bbox_en = draw.textbbox((0, 0), clean_en, font=font_en)
    tw_en = bbox_en[2] - bbox_en[0]
    th_en = bbox_en[3] - bbox_en[1]
    tx_en = (banner_box[0] + banner_box[2] - tw_en) // 2
    ty_en = (banner_box[1] + banner_box[3] - th_en) // 2 - 3
    draw.text((tx_en, ty_en), clean_en, font=font_en, fill=(255, 255, 255))

    # 4. Clean and redraw Tamil name on kraft paper
    if name_ta and name_ta.strip():
        clean_ta = name_ta.strip()
        tamil_box = (388, 624, 882, 672)
        # Sample realistic kraft paper background
        draw.rectangle(tamil_box, fill=(244, 227, 207))

        font_size_ta = 32
        if len(clean_ta) > 22:
            font_size_ta = 24
        elif len(clean_ta) > 16:
            font_size_ta = 28

        font_ta = None
        for font_candidate in [
            "C:/Windows/Fonts/Nirmala.ttc",
            "C:/Windows/Fonts/Latha.ttf",
            "C:/Windows/Fonts/Vijaya.ttf",
            "C:/Windows/Fonts/arial.ttf"
        ]:
            try:
                font_ta = ImageFont.truetype(font_candidate, font_size_ta)
                break
            except Exception:
                continue

        if font_ta is None:
            font_ta = ImageFont.load_default()

        bbox_ta = draw.textbbox((0, 0), clean_ta, font=font_ta)
        tw_ta = bbox_ta[2] - bbox_ta[0]
        th_ta = bbox_ta[3] - bbox_ta[1]
        tx_ta = (banner_box[0] + banner_box[2] - tw_ta) // 2
        ty_ta = (tamil_box[1] + tamil_box[3] - th_ta) // 2 - 2
        draw.text((tx_ta, ty_ta), clean_ta, font=font_ta, fill=(30, 48, 20))

    # Ensure parent directory exists
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    im.save(out_path, format="JPEG", quality=95, optimize=True)
    print(f"SUCCESS:{out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compose authentic TRINAYAA product packaging")
    parser.add_argument("--name", default="ORGANIC HERBAL POWDER", help="English product name")
    parser.add_argument("--tamil", default="", help="Tamil product name")
    parser.add_argument("--type", default="green", help="Botanical bowl type: green, gold, brown, black, red")
    parser.add_argument("--out", required=True, help="Output file path")
    args = parser.parse_args()

    compose_trinayaa_packaging(args.name, args.tamil, args.type, args.out)
