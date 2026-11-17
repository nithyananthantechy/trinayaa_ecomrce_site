import os
import sys
import csv
import sqlite3

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")
GEN_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")

os.makedirs(GEN_DIR, exist_ok=True)
os.makedirs(PUBLIC_GEN_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

query = """
SELECT 
    p.id,
    p.sku,
    p.nameEn,
    p.nameTa,
    COALESCE(c.name, 'Botanical') as category,
    COALESCE(p.shortDesc, p.fullDesc, '') as description,
    p.productType,
    COALESCE(p.primaryImage, '') as existing_image,
    COALESCE(p.gallery, '[]') as gallery
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
ORDER BY CAST(SUBSTR(p.sku, 5) AS INTEGER);
"""

c.execute(query)
rows = c.fetchall()

print(f"Total products extracted: {len(rows)}")

# Classification rules based on Tamil & English botanical terms
def classify_product_form(name_en, name_ta, product_type, desc):
    ne = name_en.lower()
    nt = (name_ta or "").lower()
    pt = (product_type or "").lower()
    d = desc.lower()
    combined = f"{ne} {nt} {pt} {d}"

    # 1. Powders (Root powder, Leaf powder, or general powder)
    if any(k in combined for k in ["powder", "பொடி", "churna", "choornam"]):
        if any(k in combined for k in ["leaf", "இலை", "neem", "moringa", "tulsi", "senna", "brahmi", "bhringraj", "curry leaf"]):
            return "Leaf powder"
        elif any(k in combined for k in ["root", "வேர்", "ashwagandha", "licorice", "athimadhuram", "ginger", "sukku", "turmeric", "manjal", "sarsaparilla", "nannari"]):
            return "Root powder"
        return "Botanical powder"

    # 2. Resins and Gums
    if any(k in combined for k in ["gum", "resin", "பிசின்", "gond", "frankincense", "myrrh", "aloe gum", "almond gum", "kondagogu"]):
        return "Herbal resin or gum"

    # 3. Whole seeds
    if any(k in combined for k in ["seed", "seeds", "விதை", "அரிசி", "grain", "chia", "flax", "basil seed", "kalonji", "fenugreek", "mustard", "sesame"]):
        return "Whole seeds"

    # 4. Dried Flowers and Petals
    if any(k in combined for k in ["flower", "flowers", "petal", "petals", "பூ", "rose", "hibiscus", "lotus flower", "chamomile", "marigold", "aal"]):
        return "Dried flowers"

    # 5. Dried Leaves
    if any(k in combined for k in ["leaf", "leaves", "இலை", "senna", "basil", "fir", "thalisapathiri"]):
        return "Dried leaves"

    # 6. Dried Roots & Rhizomes
    if any(k in combined for k in ["root", "roots", "rhizome", "வேர்", "கிழங்கு", "galangal", "ashwagandha", "licorice", "vetiver", "calamus", "vasambu", "costus"]):
        return "Dried roots"

    # 7. Botanical Bark
    if any(k in combined for k in ["bark", "பட்டை", "cinnamon", "arjun", "sappan wood", "wood", "மரப்பட்டை"]):
        return "Botanical bark"

    # 8. Dried Fruit and Pods
    if any(k in combined for k in ["fruit", "berry", "nut", "காய்", "பழம்", "myrobalan", "inknut", "kadukkai", "gooseberry", "amla", "tamarind", "pepper", "thippili", "nutmeg", "mace", "cardamom"]):
        return "Dried fruit"

    # 9. Fallback / Review
    return "Other verified botanical material"


# Prompt Generator adhering strictly to visual instructions
def generate_prompt(name_en, name_ta, form, category):
    # Form-specific descriptive phrasing
    form_details = {
        "Whole seeds": "crisp whole natural seeds with authentic seed coat texture and rich organic hues",
        "Dried roots": "sun-dried raw root pieces and gnarly organic botanical roots with earthy natural fibrous texture",
        "Root powder": "finely ground pure micro-pulverized golden-tan botanical root powder with soft organic texture",
        "Leaf powder": "finely ground rich earthy green botanical leaf powder with smooth organic powdered consistency",
        "Botanical powder": "pure finely ground authentic herbal botanical powder with natural organic hue",
        "Dried leaves": "naturally sun-cured whole dried herbal botanical leaves with distinct organic veins and rustic edges",
        "Dried flowers": "whole sun-dried aromatic botanical blossoms and delicate dried flower petals with vibrant natural coloration",
        "Herbal resin or gum": "translucent crystalline amber tears of pure wild-harvested natural botanical resin and tree gum",
        "Dried fruit": "sun-cured whole dried organic botanical fruit and seed pods with wrinkled natural exterior",
        "Botanical bark": "naturally peeled fragrant botanical bark strips and aromatic herbal wood curls with rich grain",
        "Other verified botanical material": "pure unadulterated raw botanical herb harvest with authentic organic texture",
    }
    
    specific_desc = form_details.get(form, "pure authentic botanical specimen with natural texture")

    prompt = (
        f"Professional commercial studio product photography of authentic {name_en} ({specific_desc}). "
        f"Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, "
        f"with a few delicate raw botanical pieces naturally scattered beside it. "
        f"Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, 8k resolution, crisp depth of field. "
        f"Clean minimal luxury apothecary aesthetic, square 1:1 ratio. "
        f"Pure natural botanical ingredients only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
    )
    return prompt

manifest_records = []
form_counts = {}

for row in rows:
    prod_id, sku, name_en, name_ta, category, desc, prod_type, existing_img, gallery = row
    
    form = classify_product_form(name_en, name_ta, prod_type, desc)
    form_counts[form] = form_counts.get(form, 0) + 1
    
    new_img = f"/images/products/generated/{sku}.webp"
    prompt = generate_prompt(name_en, name_ta, form, category)
    status = "PENDING_GENERATION"

    # Check for review requirement if name is generic
    if "unknown" in name_en.lower() or name_en.strip() == "":
        status = "NEEDS_REVIEW"

    record = {
        "product_id": prod_id,
        "sku": sku,
        "name_en": name_en,
        "name_ta": name_ta or "",
        "category": category,
        "description": desc.replace("\n", " ").strip()[:200],
        "product_form": form,
        "existing_image": existing_img,
        "new_image": new_img,
        "prompt": prompt,
        "status": status,
    }
    manifest_records.append(record)

# Write to CSV
fieldnames = [
    "product_id",
    "sku",
    "name_en",
    "name_ta",
    "category",
    "description",
    "product_form",
    "existing_image",
    "new_image",
    "prompt",
    "status"
]

with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(manifest_records)

print(f"\nManifest successfully written to: {MANIFEST_PATH}")
print(f"Total records in manifest: {len(manifest_records)}")
print("\nProduct Form Breakdown:")
for f, cnt in sorted(form_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  • {f}: {cnt} products")

