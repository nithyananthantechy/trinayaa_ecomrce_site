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
        
        if bowl_type in ("gold", "yellow"):
            # Golden turmeric / fenugreek seeds / mustard
            arr[green_pixels, 0] = np.clip(intensity * 1.50, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 1.15, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.35, 0, 255)
        elif bowl_type in ("brown", "root"):
            # Earthy brown root / powder (Ashwagandha, Licorice, Triphala)
            arr[green_pixels, 0] = np.clip(intensity * 1.25, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.85, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.55, 0, 255)
        elif bowl_type in ("black", "seed"):
            # Black kalonji / chia / black sesame
            arr[green_pixels, 0] = np.clip(intensity * 0.45, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.48, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.50, 0, 255)
        elif bowl_type in ("red", "hibiscus"):
            # Red herbal petals / bark (Hibiscus, Rose, Cinnamon)
            arr[green_pixels, 0] = np.clip(intensity * 1.55, 0, 255)
            arr[green_pixels, 1] = np.clip(intensity * 0.45, 0, 255)
            arr[green_pixels, 2] = np.clip(intensity * 0.45, 0, 255)

    im = Image.fromarray(arr.astype(np.uint8))
    draw = ImageDraw.Draw(im)

    # 2. Draw crisp deep green banner (x: 385 to 885, y: 545 to 615)
    banner_box = (385, 545, 885, 615)
    draw.rounded_rectangle(banner_box, radius=8, fill=(30, 57, 14))

    # 3. Dynamic font sizing for English product name
    clean_en = name_en.strip().upper()
    font_size_en = 36
    if len(clean_en) > 26:
        font_size_en = 24
    elif len(clean_en) > 20:
        font_size_en = 28
    elif len(clean_en) > 15:
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
    th_en = bbox_en[3] - bbox_en[0]
    tx_en = (banner_box[0] + banner_box[2] - tw_en) // 2
    ty_en = (banner_box[1] + banner_box[3] - th_en) // 2 - 2
    draw.text((tx_en, ty_en), clean_en, font=font_en, fill=(255, 255, 255))

    # 4. Seamlessly wipe out the entire old Tamil text area
    # In master image, original Tamil text was at y=660..695.
    # We cleanly fill the full space from y=616 to y=718 between banner and seals (102px high).
    # Using seamless gradient matching the exact natural kraft paper tones.
    y_start = 616
    y_end = 718
    for y in range(y_start, y_end + 1):
        ratio = (y - y_start) / float(y_end - y_start)
        r = int(254 * (1.0 - ratio) + 250 * ratio)
        g = int(250 * (1.0 - ratio) + 245 * ratio)
        b = int(238 * (1.0 - ratio) + 232 * ratio)
        draw.line([(370, y), (900, y)], fill=(r, g, b))

    # 5. Draw clean new Tamil name centered
    if name_ta and name_ta.strip():
        clean_ta = name_ta.strip()
        font_size_ta = 34
        if len(clean_ta) > 24:
            font_size_ta = 24
        elif len(clean_ta) > 18:
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
        ty_ta = (y_start + y_end - th_ta) // 2 - 2
        draw.text((tx_ta, ty_ta), clean_ta, font=font_ta, fill=(24, 45, 18))

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
