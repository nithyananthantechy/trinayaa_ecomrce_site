import os
import sys
import argparse
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def render_tamil_gdi(text, font_size=32, color_rgb=(24, 45, 18), width=520, height=80):
    """Render Tamil text with Windows DirectWrite / GDI+ for 100% accurate Indic shaping."""
    try:
        import clr
        clr.AddReference('System.Drawing')
        import System
        from System.Drawing import Bitmap, Graphics, Font, SolidBrush, Color, StringFormat, StringAlignment, GraphicsUnit, FontStyle
        from System.Drawing.Text import TextRenderingHint
        from System.Drawing.Imaging import ImageFormat
        from System.IO import MemoryStream

        bmp = Bitmap(width, height)
        g = Graphics.FromImage(bmp)
        g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit

        font = Font('Nirmala UI', font_size, FontStyle.Bold, GraphicsUnit.Pixel)
        brush = SolidBrush(Color.FromArgb(255, color_rgb[0], color_rgb[1], color_rgb[2]))
        sf = StringFormat()
        sf.Alignment = StringAlignment.Center
        sf.LineAlignment = StringAlignment.Center

        from System.Drawing import RectangleF
        rect = RectangleF(0, 0, width, height)
        g.DrawString(text, font, brush, rect, sf)

        ms = MemoryStream()
        bmp.Save(ms, ImageFormat.Png)
        byte_arr = ms.ToArray()
        
        import io
        return Image.open(io.BytesIO(bytes(byte_arr)))
    except Exception as e:
        print(f"GDI fallback warning: {e}", file=sys.stderr)
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        font = None
        for font_candidate in ["C:/Windows/Fonts/Nirmala.ttc", "arial.ttf"]:
            try:
                font = ImageFont.truetype(font_candidate, font_size)
                break
            except Exception:
                continue
        if font is None:
            font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text(((width - tw) // 2, (height - th) // 2), text, font=font, fill=(*color_rgb, 255))
        return img

TEMPLATE_SPECS = {
    "leaf": {
        "file": "clean_template_leaf.png",
        "banner_box": (385, 545, 885, 615),
        "tamil_y": 625,
        "font_size_en": 34,
        "font_size_ta": 34,
    },
    "root": {
        "file": "clean_template_root.png",
        "banner_box": (220, 430, 800, 530),
        "tamil_y": 545,
        "font_size_en": 32,
        "font_size_ta": 32,
    },
    "seed_dark": {
        "file": "clean_template_seed_dark.png",
        "banner_box": (170, 530, 880, 645),
        "tamil_y": 660,
        "font_size_en": 30,
        "font_size_ta": 32,
    },
    "seed_gold": {
        "file": "clean_template_seed_gold.png",
        "banner_box": (170, 530, 880, 645),
        "tamil_y": 660,
        "font_size_en": 30,
        "font_size_ta": 32,
    },
    "floral": {
        "file": "clean_template_floral.png",
        "banner_box": (165, 360, 855, 470),
        "tamil_y": 485,
        "font_size_en": 30,
        "font_size_ta": 32,
    },
    "powder_beige": {
        "file": "clean_template_powder_beige.png",
        "banner_box": (200, 375, 825, 475),
        "tamil_y": 495,
        "font_size_en": 28,
        "font_size_ta": 30,
    },
    "powder_gold": {
        "file": "clean_template_powder_gold.png",
        "banner_box": (200, 375, 825, 475),
        "tamil_y": 495,
        "font_size_en": 28,
        "font_size_ta": 30,
    },
}

def resolve_template_key(bowl_type_or_key):
    """Normalize bowl_type or template_key to one of the 7 supported templates."""
    k = (bowl_type_or_key or "").lower().strip()
    if k in TEMPLATE_SPECS:
        return k
    if k in ("brown", "root", "bark", "wood"):
        return "root"
    if k in ("black", "seed", "seed_dark"):
        return "seed_dark"
    if k in ("gold", "yellow", "amber", "resin", "gum", "seed_gold"):
        return "seed_gold"
    if k in ("red", "hibiscus", "rose", "floral", "flower"):
        return "floral"
    if k in ("powder_gold", "turmeric", "manjal"):
        return "powder_gold"
    if k in ("powder", "powder_beige", "beige", "mortar"):
        return "powder_beige"
    return "leaf"

def compose_trinayaa_packaging(name_en, name_ta, bowl_type="leaf", out_path=None):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_key = resolve_template_key(bowl_type)
    spec = TEMPLATE_SPECS[template_key]
    template_path = os.path.join(base_dir, "client", "public", "images", "products", "templates", spec["file"])

    if not os.path.exists(template_path):
        # Fallback to leaf template
        template_path = os.path.join(base_dir, "client", "public", "images", "products", "templates", "clean_template_leaf.png")
        spec = TEMPLATE_SPECS["leaf"]

    # Open clean master image
    im = Image.open(template_path).convert("RGB")
    draw = ImageDraw.Draw(im)
    w, h = im.size

    # 1. English Product Name inside banner
    clean_en = name_en.strip().upper()
    font_size_en = spec["font_size_en"]
    if len(clean_en) > 26:
        font_size_en = max(18, font_size_en - 8)
    elif len(clean_en) > 20:
        font_size_en = max(22, font_size_en - 4)

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

    bbox_banner = spec["banner_box"]
    bb = draw.textbbox((0, 0), clean_en, font=font_en)
    tw_en = bb[2] - bb[0]
    th_en = bb[3] - bb[1]
    tx_en = (bbox_banner[0] + bbox_banner[2] - tw_en) // 2
    ty_en = (bbox_banner[1] + bbox_banner[3] - th_en) // 2 - 2
    draw.text((tx_en, ty_en), clean_en, font=font_en, fill=(255, 255, 255))

    # 2. Tamil Product Name with native GDI+ typography
    clean_ta = (name_ta or "").strip()
    if clean_ta:
        font_size_ta = spec["font_size_ta"]
        if len(clean_ta) > 22:
            font_size_ta = max(20, font_size_ta - 6)
        ta_img = render_tamil_gdi(clean_ta, font_size=font_size_ta, color_rgb=(24, 45, 18), width=520, height=80)
        im.paste(ta_img, ((w - 520) // 2, spec["tamil_y"]), ta_img)

    if out_path:
        os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
        im.save(out_path, quality=95)

    return im

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--en", "--name", dest="en", required=True)
    parser.add_argument("--ta", "--tamil", dest="ta", default="")
    parser.add_argument("--bowl", "--type", dest="bowl", default="leaf")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    compose_trinayaa_packaging(args.en, args.ta, args.bowl, args.out)
    print(f"Generated packaging visual saved to {args.out}")
