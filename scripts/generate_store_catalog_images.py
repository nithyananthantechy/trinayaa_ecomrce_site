import os
import sys
import sqlite3
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

# Ensure we import compose_template
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from server.compose_template import compose_trinayaa_packaging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")
OUTPUT_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "packaged")
GRID1_PATH = os.path.join(BASE_DIR, "client", "public", "images", "products", "Trinayaa Herbal Product Collection Grid-1.png")
GRID5_PATH = os.path.join(BASE_DIR, "client", "public", "images", "products", "Trinayaa Herbal Seed Product Catalog-4.png")
GRID_POWDERS_PATH = os.path.join(BASE_DIR, "client", "public", "images", "products", "TRINAYAA Herbal Seeds and Powders Catalogue Grid.png")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Helper to determine best template key based on product properties
def determine_template_key(name_en, name_ta, product_type, category_id):
    ne = name_en.lower()
    nt = (name_ta or "").lower()
    pt = (product_type or "").lower()
    cat = (category_id or "").lower()
    combined = f"{ne} {nt} {pt} {cat}"

    # 1. Golden / Turmeric powders
    if any(k in combined for k in ["turmeric", "manjal", "மஞ்சள்", "kasturi", "ginger powder", "sukku powder"]):
        return "powder_gold"

    # 2. Red florals and petals
    if any(k in combined for k in ["rose", "hibiscus", "செம்பருத்தி", "ரோஜா", "lotus flower", "தாமரை பூ", "pomegranate"]):
        return "floral"

    # 3. All other herbal / root / leaf powders
    if pt == "powder" or any(k in combined for k in ["powder", "பொடி", "choornam", "churna"]):
        return "powder_beige"

    # 4. Seeds
    if pt == "seed" or any(k in combined for k in ["seed", "விதை", "seeds", "அரிசி", "grain"]):
        # Dark seeds
        if any(k in combined for k in ["black", "கரு", "chia", "pepper", "மிளகு", "babchi", "mallow", "cotton", "பருத்தி"]):
            return "seed_dark"
        return "seed_gold"

    # 5. Gums and tree resins
    if any(k in combined for k in ["gum", "resin", "பிசின்", "பவளம்"]):
        return "seed_gold"

    # 6. Woods, barks, roots, whole rhizomes
    if any(k in combined for k in [
        "wood", "root", "bark", "வேர்", "பட்டை", "மரம்", "ashwagandha", "அமுக்கரா", "licorice", "அதிமதுரம்",
        "galangal", "சித்தரத்தை", "cinnamon", "ginger", "சுக்கு", "sarasparilla", "நன்னாரி", "tamarind",
        "குடம்புளி", "sappan", "பதிமுகம்", "inknut", "கடுக்காய்", "fever nut", "கழற்சிக்காய்", "pepper", "திப்பிலி"
    ]):
        return "root"

    # 7. Herbs, leaves, greens
    if pt == "herb" or any(k in combined for k in ["leaf", "leaves", "இலை", "herb", "tulsi", "neem", "moringa", "curry", "basil", "senna", "முருங்கை"]):
        return "leaf"

    # Default fallback based on product type
    if pt == "powder":
        return "powder_beige"
    elif pt == "seed":
        return "seed_gold"
    elif pt == "herb":
        return "leaf"
    return "root"

# Dedicated exact photoshoot crops for key catalog products
# These are loaded from original photoshoot grids
EXACT_PHOTOSHOOT_MAP = {
    # SKU or lower name keywords
    "amla_photoshoot": {
        "keywords": ["indian goosberry", "indian gooseberry", "nellikai", "amla (nellikai)", "நெல்லி வத்தல்"],
        "grid": GRID1_PATH,
        # Grid 1: col 3, row 2 (x: 3*256+10..4*256-5, y: 2*341+5..3*341-5)
        "box": (3 * 256 + 10, 2 * 341 + 5, 4 * 256 - 5, 3 * 341 - 5),
    },
    "hibiscus_photoshoot": {
        "keywords": ["hibiscus flower", "செம்பருத்தி பூ"],
        "grid": GRID1_PATH,
        "box": (1 * 256 + 18, 2 * 341 + 5, 2 * 256 - 5, 3 * 341 - 5),
    },
    "curry_photoshoot": {
        "keywords": ["curry leaves", "curry leaf", "கறிவேப்பிலை"],
        "grid": GRID1_PATH,
        "box": (2 * 256 + 10, 2 * 341 + 5, 3 * 256 - 5, 3 * 341 - 5),
    },
    "fenugreek_photoshoot": {
        "keywords": ["fenugreek", "வெந்தயம்"],
        "grid": GRID1_PATH,
        "box": (2 * 256 + 10, 5, 3 * 256 - 5, 341 - 5),
    },
    "black_seed_photoshoot": {
        "keywords": ["black seed", "kalonji", "கருஞ்சீரகம்"],
        "grid": GRID1_PATH,
        "box": (1 * 256 + 10, 5, 2 * 256 - 5, 341 - 5),
    },
    "flax_photoshoot": {
        "keywords": ["flax seed", "ஆளி விதை"],
        "grid": GRID1_PATH,
        "box": (3 * 256 + 10, 5, 4 * 256 - 5, 341 - 5),
    },
    "chia_photoshoot": {
        "keywords": ["chia seed", "சியா விதை"],
        "grid": GRID1_PATH,
        "box": (4 * 256 + 10, 5, 5 * 256 - 5, 341 - 5),
    },
    "pumpkin_photoshoot": {
        "keywords": ["pumpkin seed", "பூசணி விதை"],
        "grid": GRID1_PATH,
        "box": (5 * 256 + 10, 5, 6 * 256 - 5, 341 - 5),
    },
    "sunflower_photoshoot": {
        "keywords": ["sunflower seed", "சூரியகாந்தி விதை"],
        "grid": GRID1_PATH,
        "box": (0 * 256 + 10, 341 + 5, 1 * 256 - 5, 2 * 341 - 5),
    },
    "white_sesame_photoshoot": {
        "keywords": ["sesame seed (white)", "white sesame", "எள்ளு (வெள்ளை)", "எள்ளு வெள்ளை"],
        "grid": GRID1_PATH,
        "box": (1 * 256 + 10, 341 + 5, 2 * 256 - 5, 2 * 341 - 5),
    },
    "black_sesame_photoshoot": {
        "keywords": ["sesame seed (black)", "black sesame", "எள்ளு (கருப்பு)", "எள்ளு கருப்பு"],
        "grid": GRID1_PATH,
        "box": (2 * 256 + 10, 341 + 5, 3 * 256 - 5, 2 * 341 - 5),
    },
    "kambu_photoshoot": {
        "keywords": ["millet", "kambu", "கம்பு"],
        "grid": GRID1_PATH,
        "box": (3 * 256 + 10, 341 + 5, 4 * 256 - 5, 2 * 341 - 5),
    },
    "horse_gram_photoshoot": {
        "keywords": ["horse gram", "கொள்ளு"],
        "grid": GRID1_PATH,
        "box": (4 * 256 + 10, 341 + 5, 5 * 256 - 5, 2 * 341 - 5),
    },
    "green_gram_photoshoot": {
        "keywords": ["green gram", "பச்சை பயறு"],
        "grid": GRID1_PATH,
        "box": (5 * 256 + 10, 341 + 5, 6 * 256 - 5, 2 * 341 - 5),
    },
}

print("Connecting to database...")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT id, sku, nameEn, nameTa, productType, categoryId FROM products ORDER BY id")
products = c.fetchall()
print(f"Loaded {len(products)} products from database.")

updated_count = 0
grid_cache = {}

for pid, sku, name_en, name_ta, product_type, cat_id in products:
    slug_key = sku.lower()
    clean_en = (name_en or "").strip()
    clean_ta = (name_ta or "").strip()
    lower_en = clean_en.lower()
    lower_ta = clean_ta.lower()

    out_filename = f"{slug_key}.jpg"
    out_filepath = os.path.join(OUTPUT_DIR, out_filename)

    # Check if exact photoshoot match exists
    exact_match = None
    for pkey, pinfo in EXACT_PHOTOSHOOT_MAP.items():
        if any(kw in lower_en or kw in lower_ta for kw in pinfo["keywords"]):
            # Whole ingredients only for raw photoshoots (unless specified)
            if "powder" in lower_en and "powder" not in pkey:
                continue
            exact_match = pinfo
            break

    if exact_match:
        gpath = exact_match["grid"]
        if gpath not in grid_cache:
            grid_cache[gpath] = Image.open(gpath)
        crop = grid_cache[gpath].crop(exact_match["box"]).resize((1024, 1024), Image.Resampling.LANCZOS)
        crop.save(out_filepath, quality=95)
        print(f"[{sku}] {clean_en} -> Matched Authentic Photoshoot ({pkey})")
    else:
        # Determine botanical template key
        tmpl_key = determine_template_key(clean_en, clean_ta, product_type, cat_id)
        compose_trinayaa_packaging(clean_en, clean_ta, bowl_type=tmpl_key, out_path=out_filepath)
        print(f"[{sku}] {clean_en} ({clean_ta}) -> Template: {tmpl_key}")

    img_web_path = f"/images/products/packaged/{out_filename}"
    c.execute("UPDATE products SET primaryImage = ? WHERE id = ?", (img_web_path, pid))
    updated_count += 1

conn.commit()
conn.close()
print(f"\nSuccessfully generated and linked {updated_count} product images across all 7 botanical templates!")
