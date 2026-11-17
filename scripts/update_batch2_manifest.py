import csv
import sys
sys.stdout.reconfigure(encoding='utf-8')

MANIFEST_PATH = "data/product_image_manifest.csv"

# Precise botanical descriptions matching authentic Tamil and English nomenclature
batch2_details = {
    "TRN-1011": {
        "form": "Dried leaves",
        "desc": "naturally sun-cured whole dried sweet basil leaves (Ocimum basilicum) with dark green-bronze herbal veins and organic crinkled texture"
    },
    "TRN-1012": {
        "form": "Dried flowers",
        "desc": "whole sun-dried sacred pink lotus flower blossoms and delicate dried lotus petals (Nelumbo nucifera) with rich natural botanical hues"
    },
    "TRN-1013": {
        "form": "Whole seeds",
        "desc": "whole sun-dried sacred lotus seeds (Nelumbo nucifera / raw makhana seeds) with smooth round greyish-brown seed coats"
    },
    "TRN-1014": {
        "form": "Dried leaves",
        "desc": "sun-cured fragrant needle-like dried foliage and slender leaves of Indian Silver Fir (Abies webbiana / Talisapatra)"
    },
    "TRN-1015": {
        "form": "Dried fruit",
        "desc": "slender cylindrical sun-dried fruiting spikes of Long Pepper (Piper longum / Arisi Thippili) with dark pebbled organic surface"
    },
    "TRN-1016": {
        "form": "Dried fruit",
        "desc": "thick elongated dark dried fruiting spikes of Big Elephant Long Pepper (Piper retrofractum / Yaanai Thippili) with rough textured exterior"
    },
    "TRN-1017": {
        "form": "Dried fruit",
        "desc": "whole round sun-dried black peppercorns (Piper nigrum / Urundai Thippili) with deep wrinkled aromatic black seed coats"
    },
    "TRN-1018": {
        "form": "Whole seeds",
        "desc": "whole dark heart-shaped Indian Mallow seeds (Abutilon indicum / Thuthi Vithai) with authentic organic seed coat texture"
    },
    "TRN-1019": {
        "form": "Dried roots",
        "desc": "sun-dried aromatic root pieces of Indian Sarsaparilla (Hemidesmus indicus / Nannari) with dark brown wrinkled bark and sweet woody core"
    },
    "TRN-1020": {
        "form": "Whole seeds",
        "desc": "oval dried black plum / Jamun seeds (Syzygium cumini / Naval Kottai) with matte brown-grey organic seed coats"
    },
    "TRN-1021": {
        "form": "Botanical bark",
        "desc": "rugged naturally curved strips of dried Black Plum tree bark (Syzygium cumini / Naval Pattai) with coarse fibrous reddish-grey wood grain"
    },
    "TRN-1022": {
        "form": "Dried leaves",
        "desc": "sun-dried chopped aerial stems and small dried green leaves of King of Bitters (Andrographis paniculata / Nilavembu)"
    },
    "TRN-1023": {
        "form": "Dried fruit",
        "desc": "spiny four-angled dried fruit pods of Large Caltrops (Pedalium murex / Periya Nerunjil) with sharp natural spines"
    },
    "TRN-1024": {
        "form": "Dried fruit",
        "desc": "small hard star-shaped spiny dried fruits of Small Caltrops (Tribulus terrestris / Siriya Nerunjil) with distinct sharp thorns"
    },
    "TRN-1025": {
        "form": "Dried fruit",
        "desc": "sun-dried dark brown wrinkled Amla fruit wedges and whole dried Indian Gooseberry segments (Phyllanthus emblica / Nelli Vathal)"
    },
    "TRN-1026": {
        "form": "Botanical bark",
        "desc": "vibrant crimson-rose heartwood shavings and fragrant wood slivers of Sappan Wood (Caesalpinia sappan / Pathimugam)"
    },
    "TRN-1027": {
        "form": "Whole seeds",
        "desc": "oval natural black-brown raw Indian Cotton seeds (Gossypium herbaceum / Paruthi Vithai) with subtle natural downy fuzz"
    },
    "TRN-1028": {
        "form": "Herbal resin or gum",
        "desc": "translucent crystalline golden-amber tears and raw organic resin chunks of natural Almond Gum (Badam Pisin / Prunus dulcis resin)"
    },
    "TRN-1029": {
        "form": "Dried roots",
        "desc": "sun-dried four-angled jointed stem sections of Veldt Grape (Cissus quadrangularis / Pirandai) with fibrous winged edges"
    },
    "TRN-1030": {
        "form": "Herbal resin or gum",
        "desc": "pure glistening translucent crystalline needle shards of natural botanical Menthol Crystals (Mentha arvensis / Pudhina Uppu)"
    },
}

with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

updated_count = 0
for row in rows:
    sku = row["sku"]
    if sku in batch2_details:
        info = batch2_details[sku]
        row["product_form"] = info["form"]
        row["prompt"] = (
            f"Professional commercial studio product photography of authentic {row['name_en']} ({info['desc']}). "
            f"Elegantly arranged in a shallow handcrafted rustic teak wooden bowl resting on a clean, warm ivory limestone tabletop, "
            f"with a few delicate raw botanical pieces naturally scattered beside it. "
            f"Soft natural morning side lighting, subtle soft shadows, hyper-realistic macro tactile texture, 8k resolution, crisp depth of field. "
            f"Clean minimal luxury apothecary aesthetic, square 1:1 ratio. "
            f"Pure natural botanical ingredients only, absolutely no packaging, no pouches, no plastic, no labels, no text, no letters, no logos, no watermarks."
        )
        row["status"] = "PENDING_GENERATION"
        updated_count += 1

fieldnames = list(rows[0].keys())
with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Updated {updated_count} Batch 2 products in {MANIFEST_PATH} with precise botanical morphology!")

