import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "placeholders")
PUB_DIR = os.path.join(BASE_DIR, "public", "images", "products", "placeholders")
os.makedirs(CLIENT_DIR, exist_ok=True)
os.makedirs(PUB_DIR, exist_ok=True)

WIDTH, HEIGHT = 1024, 1024

# Category definitions
CATEGORIES = [
    {
        "id": "seeds",
        "title": "NATURAL SEEDS",
        "tamil": "இயற்கை விதைகள்",
        "subtitle": "Whole Sun-Dried Botanical Seeds",
        "badge": "100% RAW & UNPOLISHED",
        "symbol": "seeds"
    },
    {
        "id": "raw_powders",
        "title": "RAW POWDERS",
        "tamil": "மூலிகை பொடிகள்",
        "subtitle": "Stone-Ground Single Botanicals",
        "badge": "MICRO-PULVERIZED · PURE",
        "symbol": "powder"
    },
    {
        "id": "herbs",
        "title": "HERBS & ROOTS",
        "tamil": "பாரம்பரிய மூலிகைகள்",
        "subtitle": "Whole Wildcrafted Botanicals & Rhizomes",
        "badge": "SUN-CURED · WHOLE INGREDIENT",
        "symbol": "herb"
    },
    {
        "id": "health_care",
        "title": "HEALTH CARE",
        "tamil": "ஆரோக்கிய பராமரிப்பு",
        "subtitle": "Traditional Vitality & Rejuvenation",
        "badge": "AUTHENTIC SIDDHA & AYURVEDA",
        "symbol": "health"
    },
    {
        "id": "hair_care",
        "title": "HAIR CARE",
        "tamil": "கூந்தல் பராமரிப்பு",
        "subtitle": "Time-Honored Botanical Hair Remedies",
        "badge": "NOURISHING · HERBAL PURITY",
        "symbol": "hair"
    },
    {
        "id": "skin_care",
        "title": "SKIN CARE",
        "tamil": "சரும பராமரிப்பு",
        "subtitle": "Pure Radiance & Herbal Cleansing",
        "badge": "CHEMICAL FREE · BOTANICAL GLOW",
        "symbol": "skin"
    },
    {
        "id": "wellness_drinks",
        "title": "WELLNESS DRINKS",
        "tamil": "மூலிகை பானங்கள்",
        "subtitle": "Restorative Herbal Infusions & Teas",
        "badge": "AROMATIC · BALANCING",
        "symbol": "tea"
    },
    {
        "id": "spices_culinary",
        "title": "SPICES & CULINARY",
        "tamil": "சமையல் நறுமணப் பொருட்கள்",
        "subtitle": "High-Potency Aromatic Spices & Pepper",
        "badge": "SINGLE ORIGIN · POTENT",
        "symbol": "spice"
    },
    {
        "id": "aromatherapy_incense",
        "title": "AROMATHERAPY & RESINS",
        "tamil": "நறுமணப் பிசின்கள்",
        "subtitle": "Natural Resins, Gums & Fragrant Woods",
        "badge": "PURE OLEORESIN · UNBLEACHED",
        "symbol": "resin"
    },
    {
        "id": "botanical_generic",
        "title": "PURE BOTANICAL ARCHIVE",
        "tamil": "பாரம்பரிய மூலிகை ஆவணம்",
        "subtitle": "Verified Single-Origin Botanical Material",
        "badge": "TRINAYAA HERITAGE ARCHIVE",
        "symbol": "generic"
    }
]

# Color Palette: Warm luxury apothecary
BG_TOP = (252, 250, 246)
BG_BOTTOM = (244, 239, 231)
BORDER_DARK = (18, 61, 40)       # #123D28 deep forest green
BORDER_GOLD = (186, 150, 85)     # #BA9655 muted antique gold
TEXT_PRIMARY = (18, 61, 40)
TEXT_MUTED = (112, 118, 107)
ACCENT_GREEN = (31, 86, 56)      # #1F5638

def get_fonts():
    font_paths = [
        ("C:/Windows/Fonts/georgia.ttf", "C:/Windows/Fonts/georgiab.ttf"),
        ("C:/Windows/Fonts/times.ttf", "C:/Windows/Fonts/timesbd.ttf"),
        ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
    ]
    reg, bold = None, None
    for r, b in font_paths:
        if os.path.exists(r) and os.path.exists(b):
            reg, bold = r, b
            break
    if not reg:
        return None, None, None, None, None
    f_brand = ImageFont.truetype(bold, 32)
    f_title = ImageFont.truetype(bold, 50)
    f_sub = ImageFont.truetype(reg, 26)
    f_badge = ImageFont.truetype(bold, 19)
    f_small = ImageFont.truetype(reg, 18)
    return f_brand, f_title, f_sub, f_badge, f_small

f_brand, f_title, f_sub, f_badge, f_small = get_fonts()

def draw_symbol(draw, symbol_type, cx, cy):
    # Draw refined minimalist botanical geometric icon
    color = BORDER_DARK
    gold = BORDER_GOLD
    
    # Outer circular seal
    draw.ellipse([cx - 110, cy - 110, cx + 110, cy + 110], outline=gold, width=2)
    draw.ellipse([cx - 102, cy - 102, cx + 102, cy + 102], outline=color, width=1)
    
    if symbol_type in ["herb", "health", "hair", "skin", "generic"]:
        # Elegant leaf motif
        draw.arc([cx - 40, cy - 70, cx + 60, cy + 70], start=180, end=360, fill=color, width=4)
        draw.arc([cx - 60, cy - 70, cx + 40, cy + 70], start=0, end=180, fill=color, width=4)
        draw.line([cx, cy - 65, cx, cy + 65], fill=gold, width=3)
        # Leaf veins
        draw.line([cx, cy - 30, cx + 25, cy - 45], fill=gold, width=2)
        draw.line([cx, cy - 30, cx - 25, cy - 45], fill=gold, width=2)
        draw.line([cx, cy + 10, cx + 30, cy - 5], fill=gold, width=2)
        draw.line([cx, cy + 10, cx - 30, cy - 5], fill=gold, width=2)
    elif symbol_type == "seeds":
        # Group of 3 botanical seeds
        for angle in [0, 120, 240]:
            rad = math.radians(angle)
            sx = cx + int(35 * math.cos(rad))
            sy = cy + int(35 * math.sin(rad))
            draw.ellipse([sx - 22, sy - 30, sx + 22, sy + 30], outline=color, fill=(240, 235, 222), width=3)
            draw.line([sx, sy - 20, sx, sy + 20], fill=gold, width=2)
    elif symbol_type == "powder":
        # Apothecary mortar / bowl with pestle
        draw.arc([cx - 55, cy - 25, cx + 55, cy + 55], start=0, end=180, fill=color, width=5)
        draw.line([cx - 55, cy + 15, cx + 55, cy + 15], fill=gold, width=3)
        draw.line([cx - 20, cy - 45, cx + 25, cy + 25], fill=color, width=5)
        # Grains/powder dots
        for dx, dy in [(-20, -10), (0, -15), (20, -10), (-10, 0), (15, 2)]:
            draw.ellipse([cx + dx - 3, cy + dy - 3, cx + dx + 3, cy + dy + 3], fill=gold)
    elif symbol_type == "tea":
        # Botanical cup with aroma steam
        draw.arc([cx - 45, cy - 15, cx + 45, cy + 45], start=0, end=180, fill=color, width=4)
        draw.line([cx - 45, cy + 15, cx + 45, cy + 15], fill=color, width=3)
        draw.arc([cx + 35, cy + 15, cx + 65, cy + 35], start=270, end=90, fill=color, width=3)
        # Rising steam
        draw.line([cx - 15, cy - 25, cx - 15, cy - 45], fill=gold, width=2)
        draw.line([cx, cy - 30, cx, cy - 55], fill=gold, width=2)
        draw.line([cx + 15, cy - 25, cx + 15, cy - 45], fill=gold, width=2)
    elif symbol_type == "spice":
        # Star anise / spice geometric burst
        for i in range(8):
            rad = math.radians(i * 45)
            ex = cx + int(50 * math.cos(rad))
            ey = cy + int(50 * math.sin(rad))
            draw.line([cx, cy, ex, ey], fill=color, width=3)
            draw.ellipse([ex - 7, ey - 7, ex + 7, ey + 7], fill=gold)
    elif symbol_type == "resin":
        # Crystalline diamond facet
        pts = [(cx, cy - 55), (cx + 45, cy), (cx, cy + 55), (cx - 45, cy)]
        draw.polygon(pts, outline=color, fill=(243, 238, 225), width=3)
        draw.line([cx, cy - 55, cx, cy + 55], fill=gold, width=2)
        draw.line([cx - 45, cy, cx + 45, cy], fill=gold, width=2)

for cat in CATEGORIES:
    # 1. Background gradient
    im = Image.new("RGB", (WIDTH, HEIGHT), BG_TOP)
    draw = ImageDraw.Draw(im)
    
    # Smooth subtle vertical gradient
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_TOP[0] * (1 - ratio) + BG_BOTTOM[0] * ratio)
        g = int(BG_TOP[1] * (1 - ratio) + BG_BOTTOM[1] * ratio)
        b = int(BG_TOP[2] * (1 - ratio) + BG_BOTTOM[2] * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
    
    # 2. Refined luxury apothecary frame
    margin_outer = 48
    draw.rectangle([margin_outer, margin_outer, WIDTH - margin_outer, HEIGHT - margin_outer], outline=BORDER_DARK, width=2)
    
    margin_inner = 58
    draw.rectangle([margin_inner, margin_inner, WIDTH - margin_inner, HEIGHT - margin_inner], outline=BORDER_GOLD, width=1)
    
    # Corner flourishes
    corner_size = 20
    for cx, cy in [
        (margin_inner, margin_inner),
        (WIDTH - margin_inner, margin_inner),
        (margin_inner, HEIGHT - margin_inner),
        (WIDTH - margin_inner, HEIGHT - margin_inner)
    ]:
        draw.rectangle([cx - 4, cy - 4, cx + 4, cy + 4], fill=BORDER_GOLD)

    # 3. Header: Brand mark
    brand_text = "T R I N A Y A A"
    bb = draw.textbbox((0, 0), brand_text, font=f_brand)
    bw = bb[2] - bb[0]
    draw.text(((WIDTH - bw) / 2, 130), brand_text, fill=BORDER_DARK, font=f_brand)
    
    brand_sub = "BOTANICAL APOTHECARY · ESTD. TAMIL NADU"
    bb_sub = draw.textbbox((0, 0), brand_sub, font=f_small)
    bsw = bb_sub[2] - bb_sub[0]
    draw.text(((WIDTH - bsw) / 2, 175), brand_sub, fill=TEXT_MUTED, font=f_small)
    
    # Horizontal divider with gold diamond center
    draw.line([320, 215, WIDTH - 320, 215], fill=BORDER_GOLD, width=1)
    draw.polygon([(WIDTH//2, 210), (WIDTH//2 + 5, 215), (WIDTH//2, 220), (WIDTH//2 - 5, 215)], fill=BORDER_GOLD)

    # 4. Central Botanical Symbol
    draw_symbol(draw, cat["symbol"], WIDTH // 2, 400)

    # 5. Category Titles
    cat_title = cat["title"]
    bb_title = draw.textbbox((0, 0), cat_title, font=f_title)
    tw = bb_title[2] - bb_title[0]
    draw.text(((WIDTH - tw) / 2, 570), cat_title, fill=TEXT_PRIMARY, font=f_title)
    
    subtitle = cat["subtitle"]
    bb_st = draw.textbbox((0, 0), subtitle, font=f_sub)
    sw = bb_st[2] - bb_st[0]
    draw.text(((WIDTH - sw) / 2, 638), subtitle, fill=TEXT_MUTED, font=f_sub)

    # 6. Pill Badge (Demo / Botanical Archive Indicator)
    badge_text = cat["badge"]
    bb_badge = draw.textbbox((0, 0), badge_text, font=f_badge)
    badgew = bb_badge[2] - bb_badge[0]
    pill_w = badgew + 48
    pill_h = 44
    pill_x1 = (WIDTH - pill_w) / 2
    pill_y1 = 720
    draw.rounded_rectangle([pill_x1, pill_y1, pill_x1 + pill_w, pill_y1 + pill_h], radius=22, fill=(238, 233, 220), outline=BORDER_GOLD, width=1)
    draw.text(((WIDTH - badgew) / 2, pill_y1 + 10), badge_text, fill=BORDER_DARK, font=f_badge)

    # 7. Footer note
    footer_text = "DEMONSTRATION CATALOGUE · OFFICIAL INGREDIENT PROFILE"
    bb_f = draw.textbbox((0, 0), footer_text, font=f_small)
    fw = bb_f[2] - bb_f[0]
    draw.text(((WIDTH - fw) / 2, 890), footer_text, fill=TEXT_MUTED, font=f_small)
    
    fn_webp = f"placeholder_{cat['id']}.webp"
    fn_png = f"placeholder_{cat['id']}.png"
    
    # Save WebP and PNG in both directories
    im.save(os.path.join(CLIENT_DIR, fn_webp), "WEBP", quality=92)
    im.save(os.path.join(CLIENT_DIR, fn_png), "PNG")
    im.save(os.path.join(PUB_DIR, fn_webp), "WEBP", quality=92)
    im.save(os.path.join(PUB_DIR, fn_png), "PNG")
    
    print(f"  ✓ Created: {fn_webp} & {fn_png}")

print(f"\nAll {len(CATEGORIES)} category placeholders successfully generated.")

