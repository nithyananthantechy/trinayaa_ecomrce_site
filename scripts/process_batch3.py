import os
import sys
import hashlib
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_GEN_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")
DEMO_CANDIDATES_DIR = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")

os.makedirs(CLIENT_GEN_DIR, exist_ok=True)
os.makedirs(PUBLIC_GEN_DIR, exist_ok=True)
os.makedirs(DEMO_CANDIDATES_DIR, exist_ok=True)

BATCH3_PROMPTS = {
    "TRN-1031": {
        "name_en": "Greater Galangal",
        "name_ta": "பேரரத்தை",
        "botanical": "Alpinia galanga",
        "form": "Dried roots",
        "prompt": "Professional commercial studio product photography of authentic Greater Galangal (Alpinia galanga, பேரரத்தை, sun-dried raw knobby rhizome pieces and sliced aromatic botanical roots with earthy natural fibrous texture and distinct ringed marks). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few delicate raw botanical root pieces naturally scattered beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical root only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1032": {
        "name_en": "Arjun Bark",
        "name_ta": "மருதம்பட்டை",
        "botanical": "Terminalia arjuna",
        "form": "Botanical bark",
        "prompt": "Professional commercial studio product photography of authentic Arjun Bark (Terminalia arjuna, மருதம்பட்டை, naturally dried thick curved pieces of fibrous greyish-red inner tree bark with rugged organic texture and layered woody grain). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few rustic bark shavings scattered beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical bark only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1033": {
        "name_en": "Blue Jack / Oak Gall",
        "name_ta": "மாசிக்காய்",
        "botanical": "Quercus infectoria",
        "form": "Dried nutgalls",
        "prompt": "Professional commercial studio product photography of authentic Blue Jack Oak Galls (Quercus infectoria, Majuphal, மாசிக்காய், hard spherical dried botanical nutgalls with distinctive nodular, bumpy surface and pale olive-tan to greyish-brown woody texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried galls scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical nutgalls only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1034": {
        "name_en": "Pomegranate Skin",
        "name_ta": "மாதுளை தோல்",
        "botanical": "Punica granatum",
        "form": "Dried peel / rind",
        "prompt": "Professional commercial studio product photography of authentic Pomegranate Peel (Punica granatum, மாதுளை தோல், sun-dried leathery yellow-ochre to reddish-brown pomegranate rind pieces and curled peel fragments with natural dried texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few delicate dried rind pieces scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried botanical peel only, absolutely no whole fruit, no juice, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1035": {
        "name_en": "Pomegranate Seeds",
        "name_ta": "மாதுளை விதை",
        "botanical": "Punica granatum",
        "form": "Dried seeds",
        "prompt": "Professional commercial studio product photography of authentic Pomegranate Seeds (Punica granatum, Anardana, மாதுளை விதை, naturally sun-dried whole hard organic pomegranate seeds with deep reddish-brown and tan dried seed coat texture, dry culinary botanical seeds). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dry seeds scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure dry botanical seeds only, absolutely no fresh wet arils, no juice, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1036": {
        "name_en": "Mango Kernel",
        "name_ta": "மாம்பருப்பு",
        "botanical": "Mangifera indica",
        "form": "Dried kernel slices",
        "prompt": "Professional commercial studio product photography of authentic Mango Kernel (Mangifera indica, மாம்பருப்பு, sun-dried flat oval creamy-tan and pale buff inner seed kernel pieces with smooth matte organic texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried kernel slices scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical kernel only, absolutely no fresh fruit pulp, no outer stone shells, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1037": {
        "name_en": "Goat Leg Tuber",
        "name_ta": "முடவாட்டுக்கால் கிழங்கு",
        "botanical": "Drynaria quercifolia",
        "form": "Dried furry rhizome",
        "prompt": "Professional commercial studio product photography of authentic Goat Leg Tuber (Drynaria quercifolia, Mudavattukkal Kilangu, Oak-leaf fern rhizome, thick knobby creeping botanical rhizome sections covered in characteristic dense golden-brown silky fibrous scales with earthy organic appearance). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few textured rhizome pieces scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical rhizome only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1038": {
        "name_en": "Drumstick Seeds",
        "name_ta": "முருங்கை விதை",
        "botanical": "Moringa oleifera",
        "form": "Whole seeds",
        "prompt": "Professional commercial studio product photography of authentic Drumstick Seeds (Moringa oleifera seeds, முருங்கை விதை, distinctive round dark brownish-black dried seeds each featuring three delicate whitish-papery membranous wings). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few winged seeds scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical seeds only, absolutely no green pods, no leaves, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1039": {
        "name_en": "Drumstick Gum",
        "name_ta": "முருங்கை பிசின்",
        "botanical": "Moringa oleifera",
        "form": "Herbal resin / gum",
        "prompt": "Professional commercial studio product photography of authentic natural Drumstick Gum (Moringa oleifera gum, Murungai Pisin, raw organic natural tree gum exudate pieces, featuring irregular translucent amber, golden-honey, and light reddish-brown crystalline resin tears and tears of raw botanical gum). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few natural resin crystal tears scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical resin only, absolutely no green leaves, no pods, no seeds, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1040": {
        "name_en": "Drumstick Flower",
        "name_ta": "முருங்கை பூ",
        "botanical": "Moringa oleifera",
        "form": "Dried flowers",
        "prompt": "Professional commercial studio product photography of authentic Drumstick Flowers (Moringa oleifera blossoms, முருங்கை பூ, sun-dried delicate yellowish-white and pale cream moringa dried flowers and petals with natural botanical texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few delicate dried petals scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried blossoms only, absolutely no fresh green leaves, no pods, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1041": {
        "name_en": "Indian Screw Tree",
        "name_ta": "வலம்புரி - இடம்புரி",
        "botanical": "Helicteres isora",
        "form": "Twisted pods",
        "prompt": "Professional commercial studio product photography of authentic Indian Screw Tree Pods (Helicteres isora, Valampuri Idampuri, Marorphali, dried botanical fruits with distinct spiral twisted cylindrical screw shape, greyish-brown woody texture and intertwined helical cords). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few spiral twisted pods scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical pods only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1042": {
        "name_en": "Tailed Pepper / Cubeb",
        "name_ta": "வால்மிளகு",
        "botanical": "Piper cubeba",
        "form": "Peppercorn with tail",
        "prompt": "Professional commercial studio product photography of authentic Tailed Pepper / Cubeb (Piper cubeba, வால்மிளகு, globular dark brownish-black wrinkled dried peppercorns, each with its distinctive small attached slender curved stalk or tail). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few tailed peppercorns scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural botanical peppercorns only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1043": {
        "name_en": "Nutmeg",
        "name_ta": "ஜாதிக்காய்",
        "botanical": "Myristica fragrans",
        "form": "Whole dried nut",
        "prompt": "Professional commercial studio product photography of authentic whole Nutmeg (Myristica fragrans, ஜாதிக்காய், hard oval egg-shaped dark brown dried nutmeg kernels with subtle natural wrinkled furrowing, reticulated network surface and rich aromatic woody sheen). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few whole nutmegs scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural whole nutmegs only, absolutely no red mace, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1044": {
        "name_en": "Sweet Flag / Calamus",
        "name_ta": "வசம்பு",
        "botanical": "Acorus calamus",
        "form": "Dried rhizome pieces",
        "prompt": "Professional commercial studio product photography of authentic Sweet Flag (Acorus calamus, Vasambu, வசம்பு, sun-dried cylindrical cut pieces of aromatic calamus rhizome with knobby ringed nodes, zigzag leaf scars, and pale buff-tan interior). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few cut rhizome segments scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried rhizome only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1045": {
        "name_en": "Rosemary",
        "name_ta": "ரோஸ்மேரி",
        "botanical": "Salvia rosmarinus",
        "form": "Dried needle leaves",
        "prompt": "Professional commercial studio product photography of authentic dried Rosemary (Salvia rosmarinus, ரோஸ்மேரி, dried dark green-grey needle-like aromatic culinary and herbal leaves with crisp natural texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried rosemary needles scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried herb leaves only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1046": {
        "name_en": "Henna Leaves",
        "name_ta": "மருதாணி",
        "botanical": "Lawsonia inermis",
        "form": "Dried leaves",
        "prompt": "Professional commercial studio product photography of authentic dried Henna Leaves (Lawsonia inermis, மருதாணி, sun-cured whole dried oval-lanceolate pale olive-green to muted sage henna leaves with natural crisp leaf veins and edges). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried whole leaves scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried whole leaves only, absolutely no green powder, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1047": {
        "name_en": "Marjoram",
        "name_ta": "மரிக்கொழுந்து",
        "botanical": "Origanum majorana / Artemisia pallens",
        "form": "Dried herbal sprigs",
        "prompt": "Professional commercial studio product photography of authentic dried Marjoram / Davana (மரிக்கொழுந்து, sun-dried aromatic silvery grey-green herbal sprigs, tiny fuzzy leaves and delicate dried herbal clusters with organic botanical texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried sprigs scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried herb sprigs only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1048": {
        "name_en": "Country Senna Leaf",
        "name_ta": "நிலாவரை",
        "botanical": "Senna alexandrina",
        "form": "Dried leaves",
        "prompt": "Professional commercial studio product photography of authentic Country Senna Leaves (Senna alexandrina, Nilavarai, நிலாவரை, naturally sun-dried whole pale yellowish-green lanceolate senna leaflets with visible delicate veins and intact dry edges). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried senna leaflets scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried leaflets only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1049": {
        "name_en": "Hibiscus Leaf",
        "name_ta": "செம்பருத்தி இலை",
        "botanical": "Hibiscus rosa-sinensis",
        "form": "Dried leaves",
        "prompt": "Professional commercial studio product photography of authentic dried Hibiscus Leaves (Hibiscus rosa-sinensis leaves, செம்பருத்தி இலை, sun-dried whole dark green serrated botanical leaves with distinct organic veins, wrinkled edges and natural earthy herbal appearance). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried leaves scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried leaves only, absolutely no flowers, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    },
    "TRN-1050": {
        "name_en": "Hibiscus Flower",
        "name_ta": "செம்பருத்தி பூ",
        "botanical": "Hibiscus rosa-sinensis",
        "form": "Dried flowers",
        "prompt": "Professional commercial studio product photography of authentic dried Hibiscus Flowers (Hibiscus rosa-sinensis blossoms, செம்பருத்தி பூ, sun-dried whole deep crimson-burgundy to purplish-red hibiscus calyces and curled dried petals with rich organic coloration and delicate wrinkled botanical texture). Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, with a few dried flower petals scattered naturally beside it. Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, crisp depth of field. Clean minimal luxury apothecary aesthetic, square 1:1 ratio. Pure natural dried blossoms only, absolutely no fresh green leaves, no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    }
}

def normalize_and_save(src_path, sku):
    """Normalize raw image to 1024x1024 WebP and save to all 3 target destinations."""
    with Image.open(src_path) as im:
        if im.mode != "RGB":
            im = im.convert("RGB")
        im_resized = im.resize((1024, 1024), Image.Resampling.LANCZOS)
        
        c_path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
        p_path = os.path.join(PUBLIC_GEN_DIR, f"{sku}.webp")
        d_path = os.path.join(DEMO_CANDIDATES_DIR, f"{sku}.webp")
        
        im_resized.save(c_path, "WEBP", quality=90, method=6)
        im_resized.save(p_path, "WEBP", quality=90, method=6)
        im_resized.save(d_path, "WEBP", quality=90, method=6)
        
        hasher = hashlib.sha256()
        with open(c_path, "rb") as f:
            hasher.update(f.read())
        h = hasher.hexdigest()
        size_bytes = os.path.getsize(c_path)
        print(f"✓ {sku}: 1024x1024 WebP saved ({size_bytes} bytes, sha256={h[:16]}...)")
        return c_path, h

def build_contact_sheet_batch3():
    """Generates PNG and HTML contact sheets for Batch 3 (TRN-1031 to TRN-1050) with high quality typography."""
    contact_w = 5 * 320 + 6 * 20
    contact_h = 4 * 380 + 5 * 20 + 80
    contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
    draw = ImageDraw.Draw(contact_img)

    # Load high quality Windows TrueType fonts
    font_path = "C:/Windows/Fonts/segoeui.ttf"
    font_bold_path = "C:/Windows/Fonts/segoeuib.ttf"
    try:
        title_font = ImageFont.truetype(font_bold_path, 22)
        subtitle_font = ImageFont.truetype(font_path, 13)
        card_title_font = ImageFont.truetype(font_bold_path, 13)
        card_meta_font = ImageFont.truetype(font_path, 11)
        card_status_font = ImageFont.truetype(font_bold_path, 11)
        placeholder_title_font = ImageFont.truetype(font_bold_path, 14)
        placeholder_sub_font = ImageFont.truetype(font_path, 12)
    except Exception:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        card_title_font = ImageFont.load_default()
        card_meta_font = ImageFont.load_default()
        card_status_font = ImageFont.load_default()
        placeholder_title_font = ImageFont.load_default()
        placeholder_sub_font = ImageFont.load_default()

    draw.text((30, 22), "TRINAYAA - Botanical Photography Pipeline (Batch 3: TRN-1031 to TRN-1050)", font=title_font, fill=(18, 61, 40))
    draw.text((30, 50), "Natural Raw Botanicals | 1024x1024 WebP | Shallow Teak Bowls | Ivory Limestone Surface", font=subtitle_font, fill=(108, 113, 103))

    cards_html = []
    
    for idx in range(20):
        col = idx % 5
        row = idx // 5
        x = 20 + col * (320 + 20)
        y = 90 + row * (380 + 20)
        
        sku = f"TRN-{1031 + idx}"
        webp_path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
        meta = BATCH3_PROMPTS.get(sku, {})
        name_en = meta.get("name_en", sku)
        name_ta = meta.get("name_ta", "")
        form = meta.get("form", "Botanical")
        
        # White card background
        draw.rectangle([x, y, x + 320, y + 380], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
        
        if os.path.exists(webp_path):
            thumb = Image.open(webp_path).resize((320, 300), Image.Resampling.LANCZOS)
            contact_img.paste(thumb, (x, y))
            status_text = "READY FOR REVIEW [OK]"
            status_color = (4, 120, 87)
            card_status_html = '<div style="color: #047857; font-weight: 600; font-size: 11px;">STATUS: READY FOR REVIEW [OK]</div>'
        else:
            draw.rectangle([x, y, x + 320, y + 300], fill=(245, 242, 237))
            draw.text((x + 60, y + 120), "PENDING MODEL QUOTA", font=placeholder_title_font, fill=(180, 100, 30))
            draw.text((x + 70, y + 145), f"Target: {sku}.webp", font=placeholder_sub_font, fill=(130, 125, 115))
            draw.text((x + 55, y + 165), "Reset at 3:03 PM IST", font=placeholder_sub_font, fill=(160, 110, 50))
            status_text = "QUOTA LIMIT (Reset ~3:03 PM)"
            status_color = (180, 83, 9)
            card_status_html = '<div style="color: #b45309; font-weight: 600; font-size: 11px;">STATUS: QUOTA LIMIT (Reset ~3:03 PM)</div>'

        # Label box
        draw.rectangle([x, y + 300, x + 320, y + 380], fill=(255, 255, 255))
        draw.text((x + 12, y + 308), f"{sku} - {name_en[:22]}", font=card_title_font, fill=(18, 61, 40))
        draw.text((x + 12, y + 328), f"Form: {form[:30]}", font=card_meta_font, fill=(70, 100, 80))
        draw.text((x + 12, y + 348), f"STATUS: {status_text}", font=card_status_font, fill=status_color)

        cards_html.append(f"""
        <div class="card">
            <img src="{sku}.webp" alt="{sku} - {name_en}" loading="lazy" />
            <div class="card-info">
                <div class="sku-row"><span class="sku">{sku}</span><span class="ta">{name_ta}</span></div>
                <div class="name">{name_en}</div>
                <div class="form">{form} · {meta.get('botanical', '')}</div>
                {card_status_html}
            </div>
        </div>
        """)

    png_path = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch3.png")
    contact_img.save(png_path, "PNG")
    print(f"[OK] Saved contact sheet PNG: {png_path}")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TRINAYAA Botanical Photography - Batch 3 (TRN-1031 to TRN-1050)</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf8f5; color: #123d28; margin: 0; padding: 32px 40px; }}
  header {{ margin-bottom: 24px; border-bottom: 1px solid #e5e0d8; padding-bottom: 16px; }}
  h1 {{ font-size: 22px; font-weight: 700; margin: 0 0 4px 0; color: #123d28; }}
  p {{ margin: 0; font-size: 13px; color: #6c7167; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }}
  .card {{ background: #fff; border: 1px solid #e5e0d8; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }}
  .card img {{ width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: #f5f2ed; }}
  .card-info {{ padding: 12px 14px; font-size: 12px; }}
  .sku-row {{ display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }}
  .sku {{ font-weight: 700; font-size: 13px; color: #123d28; }}
  .ta {{ color: #78716c; font-size: 11px; }}
  .name {{ font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1c1917; }}
  .form {{ color: #57534e; margin-bottom: 8px; font-size: 11px; }}
</style>
</head>
<body>
<header>
  <h1>TRINAYAA Botanical Photography - Batch 3 Review (TRN-1031 to TRN-1050)</h1>
  <p>Natural Raw Botanicals | 1024x1024 WebP | Shallow Teak Bowls | Ivory Limestone Surface | Commercial Apothecary Aesthetic</p>
</header>
<div class="grid">
{''.join(cards_html)}
</div>
</body>
</html>
"""
    html_path = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch3.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[OK] Saved contact sheet HTML: {html_path}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "contact_sheet":
        build_contact_sheet_batch3()
    elif len(sys.argv) > 2 and sys.argv[1] == "save":
        normalize_and_save(sys.argv[2], sys.argv[3])
    else:
        print("Usage: python process_batch3.py [contact_sheet | save <src> <sku>]")

