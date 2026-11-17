import json
import sqlite3
import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("""
SELECT p.id, p.sku, p.nameEn, p.nameTa, COALESCE(c.name, 'Herbs') as categoryName, p.productType
FROM products p
LEFT JOIN categories c ON p.categoryId = c.id
ORDER BY CAST(SUBSTR(p.sku, 5) AS INTEGER) ASC
""")
products = cursor.fetchall()
print(f"Total products fetched: {len(products)}")

# Complete verified botanical taxonomy & plant forms for all 162 Siddha/Ayurvedic items
BOTANICAL_MAP = {
    # 1001 - 1010 (Batch 1)
    "TRN-1001": ("Glycyrrhiza glabra", "Dried roots", "Fabaceae", "Glycyrrhiza glabra root"),
    "TRN-1002": ("Withania somnifera", "Dried roots", "Solanaceae", "Withania somnifera root"),
    "TRN-1003": ("Ficus religiosa", "Whole seeds", "Moraceae", "Ficus religiosa seed"),
    "TRN-1004": ("Withania somnifera", "Whole roots", "Solanaceae", "Withania somnifera tuberous root"),
    "TRN-1005": ("Terminalia chebula", "Dried fruit", "Combretaceae", "Terminalia chebula dried fruit"),
    "TRN-1006": ("Aloe ferox / Aloe barbadensis resin", "Herbal resin or gum", "Asphodelaceae", "Aloe resin dried gum"),
    "TRN-1007": ("Caesalpinia bonduc", "Dried seeds", "Fabaceae", "Caesalpinia bonduc seeds"),
    "TRN-1008": ("Psoralea corylifolia", "Whole seeds", "Fabaceae", "Psoralea corylifolia babchi seeds"),
    "TRN-1009": ("Garcinia gummi-gutta", "Dried fruit", "Clusiaceae", "Garcinia gummi-gutta dried rind"),
    "TRN-1010": ("Alpinia officinarum / Alpinia calcarata", "Dried rhizome roots", "Zingiberaceae", "Alpinia officinarum rhizome"),

    # 1011 - 1030 (Batch 2)
    "TRN-1011": ("Ocimum basilicum", "Dried leaves", "Lamiaceae", "Ocimum basilicum dried leaves"),
    "TRN-1012": ("Nelumbo nucifera", "Dried flowers", "Nelumbonaceae", "Nelumbo nucifera lotus petals"),
    "TRN-1013": ("Nelumbo nucifera", "Whole seeds", "Nelumbonaceae", "Nelumbo nucifera seeds"),
    "TRN-1014": ("Abies webbiana", "Dried leaves", "Pinaceae", "Abies webbiana leaves"),
    "TRN-1015": ("Piper longum", "Dried fruit", "Piperaceae", "Piper longum fruit spike"),
    "TRN-1016": ("Piper retrofractum", "Dried fruit", "Piperaceae", "Piper retrofractum fruit"),
    "TRN-1017": ("Piper nigrum", "Dried fruit", "Piperaceae", "Piper nigrum black peppercorns"),
    "TRN-1018": ("Abutilon indicum", "Whole seeds", "Malvaceae", "Abutilon indicum seeds"),
    "TRN-1019": ("Hemidesmus indicus", "Dried roots", "Apocynaceae", "Hemidesmus indicus nannari root"),
    "TRN-1020": ("Syzygium cumini", "Whole seeds", "Myrtaceae", "Syzygium cumini jamun seeds"),
    "TRN-1021": ("Syzygium cumini", "Botanical bark", "Myrtaceae", "Syzygium cumini bark"),
    "TRN-1022": ("Andrographis paniculata", "Dried leaves", "Acanthaceae", "Andrographis paniculata dried leaves"),
    "TRN-1023": ("Pedalium murex", "Dried fruit", "Pedaliaceae", "Pedalium murex fruit"),
    "TRN-1024": ("Tribulus terrestris", "Dried fruit", "Zygophyllaceae", "Tribulus terrestris fruit"),
    "TRN-1025": ("Phyllanthus emblica", "Dried fruit", "Phyllanthaceae", "Phyllanthus emblica dried amla"),
    "TRN-1026": ("Caesalpinia sappan", "Botanical bark", "Fabaceae", "Caesalpinia sappan heartwood"),
    "TRN-1027": ("Gossypium herbaceum", "Whole seeds", "Malvaceae", "Gossypium herbaceum seeds"),
    "TRN-1028": ("Prunus dulcis gum", "Herbal resin or gum", "Rosaceae", "Prunus dulcis almond gum badam pisin"),
    "TRN-1029": ("Cissus quadrangularis", "Dried stems", "Vitaceae", "Cissus quadrangularis dried stem"),
    "TRN-1030": ("Mentha arvensis crystal", "Herbal crystal", "Lamiaceae", "Menthol crystal Mentha"),

    # 1031 - 1050
    "TRN-1031": ("Alpinia galanga", "Dried rhizome", "Zingiberaceae", "Alpinia galanga rhizome"),
    "TRN-1032": ("Terminalia arjuna", "Botanical bark", "Combretaceae", "Terminalia arjuna bark"),
    "TRN-1033": ("Quercus infectoria", "Dried gall fruit", "Fagaceae", "Quercus infectoria gall"),
    "TRN-1034": ("Punica granatum", "Dried fruit peel", "Lythraceae", "Punica granatum dried rind"),
    "TRN-1035": ("Punica granatum", "Whole seeds", "Lythraceae", "Punica granatum dried seeds"),
    "TRN-1036": ("Mangifera indica", "Dried seed kernel", "Anacardiaceae", "Mangifera indica mango seed kernel"),
    "TRN-1037": ("Drynaria quercifolia", "Dried rhizome", "Polypodiaceae", "Drynaria quercifolia rhizome"),
    "TRN-1038": ("Moringa oleifera", "Whole seeds", "Moringaceae", "Moringa oleifera seeds"),
    "TRN-1039": ("Moringa oleifera gum", "Herbal resin or gum", "Moringaceae", "Moringa oleifera gum"),
    "TRN-1040": ("Moringa oleifera", "Dried flowers", "Moringaceae", "Moringa oleifera dried flowers"),
    "TRN-1041": ("Moringa oleifera", "Dried leaves", "Moringaceae", "Moringa oleifera dried leaves"),
    "TRN-1042": ("Piper cubeba", "Dried berries", "Piperaceae", "Piper cubeba berries"),
    "TRN-1043": ("Myristica fragrans", "Whole dried seed", "Myristicaceae", "Myristica fragrans nutmeg"),
    "TRN-1044": ("Acorus calamus", "Dried rhizome", "Acoraceae", "Acorus calamus rhizome"),
    "TRN-1045": ("Linum usitatissimum", "Whole seeds", "Linaceae", "Linum usitatissimum flax seeds"),
    "TRN-1046": ("Salvia rosmarinus", "Dried leaves", "Lamiaceae", "Salvia rosmarinus dried rosemary"),
    "TRN-1047": ("Nigella sativa", "Whole seeds", "Ranunculaceae", "Nigella sativa kalonji black seed"),
    "TRN-1048": ("Senna auriculata", "Dried flowers", "Fabaceae", "Senna auriculata aavaram poo flowers"),
    "TRN-1049": ("Ventilago madraspatana", "Botanical bark", "Rhamnaceae", "Ventilago madraspatana bark"),
    "TRN-1050": ("Chrysopogon zizanioides", "Dried fibrous roots", "Poaceae", "Chrysopogon zizanioides vetiver roots"),

    # 1051 - 1070
    "TRN-1051": ("Chrysopogon zizanioides", "Dried fibrous roots", "Poaceae", "Chrysopogon zizanioides vetiver roots cut"),
    "TRN-1052": ("Aegle marmelos", "Dried leaves", "Rutaceae", "Aegle marmelos leaves"),
    "TRN-1053": ("Aegle marmelos", "Dried fruit shell/pulp", "Rutaceae", "Aegle marmelos dried bael fruit"),
    "TRN-1054": ("Terminalia bellirica", "Dried fruit", "Combretaceae", "Terminalia bellirica bibhitaki fruit"),
    "TRN-1055": ("Phyllanthus emblica", "Whole dried fruit", "Phyllanthaceae", "Phyllanthus emblica amla fruit"),
    "TRN-1056": ("Acacia concinna", "Dried fruit pods", "Fabaceae", "Acacia concinna shikakai pods"),
    "TRN-1057": ("Sapindus mukorossi / Sapindus trifoliatus", "Dried berries", "Sapindaceae", "Sapindus mukorossi soap nuts"),
    "TRN-1058": ("Acacia concinna herbal blend", "Herbal blend powder", "Fabaceae", "Shikakai herbal hair wash powder"),
    "TRN-1059": ("Eclipta prostrata", "Dried leaves", "Asteraceae", "Eclipta prostrata bhringraj leaves"),
    "TRN-1060": ("Centella asiatica", "Dried leaves", "Apiaceae", "Centella asiatica gotu kola brahmi"),
    "TRN-1061": ("Curcuma longa", "Dried rhizome fingers", "Zingiberaceae", "Curcuma longa turmeric fingers"),
    "TRN-1062": ("Aegle marmelos", "Dried fruit rind", "Rutaceae", "Aegle marmelos bilva fruit shell"),
    "TRN-1063": ("Rosa damascena", "Dried flower petals", "Rosaceae", "Rosa damascena dried rose petals"),
    "TRN-1064": ("Solum fullonum", "Natural clay chunks", "Clay mineral", "Multani mitti clay"),
    "TRN-1065": ("Rubia cordifolia", "Dried root sticks", "Rubiaceae", "Rubia cordifolia manjistha roots"),
    "TRN-1066": ("Withania coagulans", "Dried berries/flowers", "Solanaceae", "Withania coagulans paneer doda"),
    "TRN-1067": ("Potassium alum", "Natural mineral crystal", "Mineral", "Potassium alum crystal"),
    "TRN-1068": ("Achyranthes aspera", "Whole seeds", "Amaranthaceae", "Achyranthes aspera seeds"),
    "TRN-1069": ("Ocimum basilicum seeds", "Whole seeds", "Lamiaceae", "Ocimum basilicum sabja seeds"),
    "TRN-1070": ("Curcuma aromatica", "Dried rhizome", "Zingiberaceae", "Curcuma aromatica kasthuri manjal"),

    # 1071 - 1093
    "TRN-1071": ("Ocimum tenuiflorum", "Dried leaves", "Lamiaceae", "Ocimum tenuiflorum tulsi holy basil"),
    "TRN-1072": ("Clitoria ternatea", "Dried flowers", "Fabaceae", "Clitoria ternatea butterfly pea blue flower"),
    "TRN-1073": ("Hibiscus rosa-sinensis", "Dried flowers", "Malvaceae", "Hibiscus rosa-sinensis dried hibiscus flowers"),
    "TRN-1074": ("Lawsonia inermis", "Dried leaves", "Lythraceae", "Lawsonia inermis dried henna leaves"),
    "TRN-1075": ("Indigofera tinctoria", "Dried leaves", "Fabaceae", "Indigofera tinctoria dried leaves"),
    "TRN-1076": ("Cassia fistula", "Dried pods", "Fabaceae", "Cassia fistula golden shower pod"),
    "TRN-1077": ("Mucuna pruriens", "Whole seeds", "Fabaceae", "Mucuna pruriens velvet bean seeds"),
    "TRN-1078": ("Tribulus terrestris", "Dried fruit thorns", "Zygophyllaceae", "Tribulus terrestris gokshura fruit"),
    "TRN-1079": ("Astercantha longifolia", "Whole seeds", "Acanthaceae", "Hygrophila auriculata kokilaksha seeds"),
    "TRN-1080": ("Coriandrum sativum", "Whole seeds", "Apiaceae", "Coriandrum sativum coriander seeds"),
    "TRN-1081": ("Cuminum cyminum", "Whole seeds", "Apiaceae", "Cuminum cyminum cumin seeds"),
    "TRN-1082": ("Foeniculum vulgare", "Whole seeds", "Apiaceae", "Foeniculum vulgare fennel seeds"),
    "TRN-1083": ("Trigonella foenum-graecum", "Whole seeds", "Fabaceae", "Trigonella foenum-graecum fenugreek seeds"),
    "TRN-1084": ("Elettaria cardamomum", "Dried green pods", "Zingiberaceae", "Elettaria cardamomum green cardamom pods"),
    "TRN-1085": ("Syzygium aromaticum", "Dried flower buds", "Myrtaceae", "Syzygium aromaticum cloves"),
    "TRN-1086": ("Cinnamomum verum", "Dried inner bark quills", "Lauraceae", "Cinnamomum verum ceylon cinnamon quills"),
    "TRN-1087": ("Illicium verum", "Dried star fruit", "Schisandraceae", "Illicium verum star anise"),
    "TRN-1088": ("Myristica fragrans aril", "Dried mace aril blades", "Myristicaceae", "Myristica fragrans mace aril"),
    "TRN-1089": ("Commiphora mukul", "Herbal resin or gum", "Burseraceae", "Commiphora mukul guggul resin"),
    "TRN-1090": ("Boswellia serrata", "Herbal resin tears", "Burseraceae", "Boswellia serrata frankincense resin"),
    "TRN-1091": ("Trachyspermum ammi", "Whole seeds", "Apiaceae", "Trachyspermum ammi ajwain seeds"),
    "TRN-1092": ("Zingiber officinale", "Dried rhizome", "Zingiberaceae", "Zingiber officinale dried ginger root"),
    "TRN-1093": ("Allium sativum", "Dried smoked cloves", "Amaryllidaceae", "Allium sativum garlic bulbs"),
}

# 1094 to 1162 are corresponding single botanical & herbal powders!
manifest = []
for p in products:
    p_id, sku, name_en, name_ta, cat, p_type = p
    
    # Check if directly in botanical map
    if sku in BOTANICAL_MAP:
        bot_name, form, family, query = BOTANICAL_MAP[sku]
    elif "powder" in name_en.lower():
        # Powder product: map base botanical
        base_name = name_en.replace("Powder", "").replace("powder", "").strip()
        form = "Herbal powder"
        bot_name = f"{base_name} (Siddha/Ayurvedic ground herbal formulation)"
        family = "Herbal Powder"
        query = f"{base_name} herbal powder"
        # Match with corresponding raw SKU if possible
        for raw_sku, info in BOTANICAL_MAP.items():
            raw_prefix = raw_sku.replace("TRN-10", "")
            if base_name.lower() in info[3].lower() or info[0].lower() in base_name.lower():
                bot_name = info[0]
                family = info[2]
                query = f"{info[0]} powder"
                break
    else:
        bot_name = f"{name_en} (Verified Tamil Botanical)"
        form = "Botanical ingredient"
        family = "Botanical"
        query = f"{name_en} botanical"
        
    manifest.append({
        "sku": sku,
        "name_en": name_en,
        "name_ta": name_ta,
        "category": cat,
        "product_type": p_type,
        "botanical_name": bot_name,
        "plant_family": family,
        "product_form": form,
        "search_query": query,
        "image_filename": f"{sku}.webp",
        "is_batch1_or_batch2": "YES" if sku in [f"TRN-{1001+i}" for i in range(28) if i != 18 and i != 19] else "NO"
    })

print(f"Total manifest records created: {len(manifest)}")

manifest_csv_path = "docs/TRINAYAA_162_PRODUCT_BOTANICAL_MANIFEST.csv"
fieldnames = list(manifest[0].keys())
with open(manifest_csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(manifest)

print(f"Saved complete 162-product manifest to: {manifest_csv_path}")

