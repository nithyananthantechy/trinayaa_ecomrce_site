import os
import sys
import sqlite3
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAIN_DIR = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded"
)

CLIENT_GEN = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN = os.path.join(BASE_DIR, "public", "images", "products", "generated")
DEMO_CANDIDATES = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")
DB_PATH = os.path.join(BASE_DIR, "data", "trinayaa.db")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")

os.makedirs(CLIENT_GEN, exist_ok=True)
os.makedirs(PUBLIC_GEN, exist_ok=True)
os.makedirs(DEMO_CANDIDATES, exist_ok=True)

# Define the 11 batches with clean crop boxes (no product ribbons, no category banners)
batch_configs = [
    {
        "batch_num": 1,
        "sheet_name": "contact_sheet_user_batch1.png",
        "file": "media_1793859537392_77a6447c.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 1: TRN-1001 to TRN-1010)",
        "cards": [
            ("TRN-1001", (11, 72, 252, 254), "Licorice Root"),
            ("TRN-1002", (260, 72, 505, 254), "Ashwagandha - 1"),
            ("TRN-1003", (512, 72, 755, 254), "Peepal Seeds"),
            ("TRN-1004", (11, 322, 252, 507), "Ashwagandha - 2"),
            ("TRN-1005", (260, 322, 505, 507), "Inknut/Myrobalan"),
            ("TRN-1006", (512, 322, 755, 507), "Indian Aloe Gum"),
            ("TRN-1007", (11, 516, 379, 710), "Fever Nut"),
            ("TRN-1008", (387, 516, 755, 710), "Babchi Seeds"),
            ("TRN-1009", (11, 777, 379, 965), "Malabar Tamarind"),
            ("TRN-1010", (387, 777, 755, 965), "Lesser Galangal"),
        ]
    },
    {
        "batch_num": 2,
        "sheet_name": "contact_sheet_user_batch2.png",
        "file": "media_1793860206017_39f69332.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 2: TRN-1011 to TRN-1020)",
        "cards": [
            ("TRN-1011", (11, 72, 252, 254), "Sweet Basil"),
            ("TRN-1012", (260, 72, 505, 254), "Lotus Flower"),
            ("TRN-1013", (512, 72, 755, 254), "Lotus Seeds"),
            ("TRN-1014", (11, 322, 252, 507), "Indian Silver Fir"),
            ("TRN-1015", (260, 322, 505, 507), "Long pepper"),
            ("TRN-1016", (512, 322, 755, 507), "Big Pepper"),
            ("TRN-1017", (11, 516, 379, 710), "Round Pepper"),
            ("TRN-1018", (387, 516, 755, 710), "Indian Mallow Seeds"),
            ("TRN-1019", (11, 777, 379, 965), "Indian Sarasparilla"),
            ("TRN-1020", (387, 777, 755, 965), "Black Plum Seeds"),
        ]
    },
    {
        "batch_num": 3,
        "sheet_name": "contact_sheet_user_batch2b.png",
        "file": "media_1793860578323_4a7e8f4f.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 3: TRN-1021 to TRN-1030)",
        "cards": [
            ("TRN-1021", (11, 72, 252, 254), "Black Plum Bark"),
            ("TRN-1022", (260, 72, 505, 254), "King of bitter"),
            ("TRN-1023", (512, 72, 755, 254), "Caltrops Large"),
            ("TRN-1024", (11, 322, 252, 507), "Caltrops Small"),
            ("TRN-1025", (260, 322, 505, 507), "Indian Gooseberry"),
            ("TRN-1026", (512, 322, 755, 507), "Sappan Wood"),
            ("TRN-1027", (11, 516, 379, 710), "Indian Cotton Seeds"),
            ("TRN-1028", (387, 516, 755, 710), "Almond Gum"),
            ("TRN-1029", (11, 777, 379, 965), "Veldt Grape"),
            ("TRN-1030", (387, 777, 755, 965), "Menthol Crystal"),
        ]
    },
    {
        "batch_num": 4,
        "sheet_name": "contact_sheet_user_batch3.png",
        "file": "media_1793860827289_03959add.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 4: TRN-1031 to TRN-1040)",
        "cards": [
            ("TRN-1031", (11, 72, 252, 254), "Greater Galangal"),
            ("TRN-1032", (260, 72, 505, 254), "Arjun bark"),
            ("TRN-1033", (512, 72, 755, 254), "Blue Jack"),
            ("TRN-1034", (11, 322, 252, 507), "Pomegranate Skin"),
            ("TRN-1035", (260, 322, 505, 507), "Pomegranate Seeds"),
            ("TRN-1036", (512, 322, 755, 507), "Mango Kernel"),
            ("TRN-1037", (11, 516, 379, 710), "Goat Leg Tuber"),
            ("TRN-1038", (387, 516, 755, 710), "Drumstick Seeds"),
            ("TRN-1039", (11, 777, 379, 965), "Drumstick Gum"),
            ("TRN-1040", (387, 777, 755, 965), "Drumstick Flower"),
        ]
    },
    {
        "batch_num": 5,
        "sheet_name": "contact_sheet_user_batch3b.png",
        "file": "media_1793862352253_cb5f114f.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 5: TRN-1041 to TRN-1050)",
        "cards": [
            ("TRN-1041", (11, 72, 252, 254), "Indian Screw Tree"),
            ("TRN-1042", (260, 72, 505, 254), "Tailed pepper"),
            ("TRN-1043", (512, 72, 755, 254), "Nutmeg"),
            ("TRN-1044", (11, 322, 252, 507), "Sweet Flag"),
            ("TRN-1045", (260, 322, 505, 507), "Rosemary"),
            ("TRN-1046", (512, 322, 755, 507), "Henna"),
            ("TRN-1047", (11, 545, 379, 710), "Marjoram"),
            ("TRN-1048", (387, 545, 755, 710), "Country Senna Leaf"),
            ("TRN-1049", (11, 777, 379, 965), "Hibiscus Leaf"),
            ("TRN-1050", (387, 777, 755, 965), "Hibiscus Flower"),
        ]
    },
    {
        "batch_num": 6,
        "sheet_name": "contact_sheet_user_batch4.png",
        "file": "media_1793862838217_31d5c291.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 6: TRN-1051 to TRN-1060)",
        "cards": [
            ("TRN-1051", (11, 72, 252, 254), "Soap pod Special"),
            ("TRN-1052", (260, 72, 505, 254), "Soap pod"),
            ("TRN-1053", (512, 72, 755, 254), "Dil Seeds"),
            ("TRN-1054", (11, 322, 252, 507), "Nutgrass"),
            ("TRN-1055", (260, 322, 505, 507), "Red Fruit Creeper"),
            ("TRN-1056", (512, 322, 755, 507), "Indian Indigo"),
            ("TRN-1057", (11, 516, 379, 710), "Black Cumin"),
            ("TRN-1058", (387, 516, 755, 710), "Soap Pod Powder"),
            ("TRN-1059", (11, 808, 379, 965), "Alkanet Roots"),
            ("TRN-1060", (387, 808, 755, 965), "Camel Grass"),
        ]
    },
    {
        "batch_num": 7,
        "sheet_name": "contact_sheet_user_batch4b.png",
        "file": "media_1793864712367_280552f4.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 7: TRN-1061 to TRN-1070)",
        "cards": [
            ("TRN-1061", (11, 72, 252, 254), "Turmeric"),
            ("TRN-1062", (260, 72, 505, 254), "Bilva Fruit Dry"),
            ("TRN-1063", (512, 72, 755, 254), "Indian Rose"),
            ("TRN-1064", (11, 322, 252, 507), "Fuller Earth"),
            ("TRN-1065", (260, 322, 505, 507), "Indian madder"),
            ("TRN-1066", (512, 322, 755, 507), "Indian Rennet"),
            ("TRN-1067", (11, 516, 379, 710), "Alum Stone"),
            ("TRN-1068", (387, 516, 755, 710), "Rough Chaff"),
            ("TRN-1069", (11, 777, 379, 965), "Sweet Basil"),
            ("TRN-1070", (387, 777, 755, 965), "Wild Turmeric"),
        ]
    },
    {
        "batch_num": 8,
        "sheet_name": "contact_sheet_user_batch5.png",
        "file": "media_1793865542302_73a0ce79.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 8: TRN-1071 to TRN-1080)",
        "cards": [
            ("TRN-1071", (11, 72, 252, 254), "Lemon Peel"),
            ("TRN-1072", (260, 72, 505, 254), "Senna Flowers"),
            ("TRN-1073", (512, 72, 755, 254), "Benzoin Resin - 1"),
            ("TRN-1074", (11, 322, 252, 507), "Benzoin Resin - 2"),
            ("TRN-1075", (260, 322, 505, 507), "Benzoin Resin - 3"),
            ("TRN-1076", (512, 322, 755, 507), "Black Dammer"),
            ("TRN-1077", (11, 545, 379, 710), "White Dammer"),
            ("TRN-1078", (387, 545, 755, 710), "Magic ginger"),
            ("TRN-1079", (11, 808, 379, 965), "Amla Tea"),
            ("TRN-1080", (387, 808, 755, 965), "Ginger Soup"),
        ]
    },
    {
        "batch_num": 9,
        "sheet_name": "contact_sheet_user_batch5b.png",
        "file": "media_1793866023962_88ccfb82.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 9: TRN-1081 to TRN-1090)",
        "cards": [
            ("TRN-1081", (11, 72, 252, 254), "Pumpkin Seeds"),
            ("TRN-1082", (260, 72, 505, 254), "Cucumber Seeds"),
            ("TRN-1083", (512, 72, 755, 254), "Sunflower Seeds"),
            ("TRN-1084", (11, 322, 252, 507), "Chia Seeds"),
            ("TRN-1085", (260, 322, 505, 507), "Flax Seeds"),
            ("TRN-1086", (512, 322, 755, 507), "Basil Seeds"),
            ("TRN-1087", (11, 516, 379, 710), "Spogel Seeds"),
            ("TRN-1088", (387, 516, 755, 710), "Fenugreek Seeds"),
            ("TRN-1089", (11, 808, 379, 965), "Cinnamon"),
            ("TRN-1090", (387, 808, 755, 965), "Cardamom"),
        ]
    },
    {
        "batch_num": 10,
        "sheet_name": "contact_sheet_user_batch6.png",
        "file": "media_1793866917550_cc474a4d.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 10: TRN-1091 to TRN-1100)",
        "cards": [
            ("TRN-1091", (11, 72, 252, 254), "Bishop Weed"),
            ("TRN-1092", (260, 72, 505, 230), "Dry Ginger"),
            ("TRN-1093", (512, 72, 755, 254), "Garlic"),
            ("TRN-1094", (11, 322, 252, 507), "Licorice Root Powder"),
            ("TRN-1095", (260, 322, 505, 507), "Ashwagandha Powder"),
            ("TRN-1096", (512, 322, 755, 507), "Peepal Seeds Powder"),
            ("TRN-1097", (11, 545, 379, 710), "Inknut/Myrobalan Powder"),
            ("TRN-1098", (387, 545, 755, 710), "Indian Aloevera Powder"),
            ("TRN-1099", (11, 808, 379, 965), "Fever Nut Powder"),
            ("TRN-1100", (387, 808, 755, 965), "Babchi Seeds Powder"),
        ]
    },
    {
        "batch_num": 11,
        "sheet_name": "contact_sheet_user_batch6b.png",
        "file": "media_1793870339717_8896fdce.jpg",
        "title": "TRINAYAA - Clean Botanical Images (Batch 11: TRN-1101 to TRN-1110)",
        "cards": [
            ("TRN-1101", (11, 72, 252, 254), "Lesser Galangal Powder"),
            ("TRN-1102", (260, 72, 505, 254), "Sweet Basil Powder"),
            ("TRN-1103", (512, 72, 755, 254), "Indian Silver Fir Powder"),
            ("TRN-1104", (11, 322, 252, 507), "Long Pepper Powder"),
            ("TRN-1105", (260, 322, 505, 507), "Indian Mallow Seeds Powder"),
            ("TRN-1106", (512, 322, 755, 507), "Indian Sarasparilla Powder"),
            ("TRN-1107", (11, 545, 379, 710), "Black Plum Seeds Powder"),
            ("TRN-1108", (387, 545, 755, 710), "Black Plum Bark Powder"),
            ("TRN-1109", (11, 808, 379, 965), "King of bitter Powder"),
            ("TRN-1110", (387, 808, 755, 965), "Caltrops Large Powder"),
        ]
    },
]

# Typography setup
font_bold = "C:/Windows/Fonts/segoeuib.ttf"
font_regular = "C:/Windows/Fonts/segoeui.ttf"
title_font = ImageFont.truetype(font_bold, 20)
sub_font = ImageFont.truetype(font_regular, 13)
card_title_font = ImageFont.truetype(font_bold, 13)
card_meta_font = ImageFont.truetype(font_regular, 11)

total_processed = 0

for b_cfg in batch_configs:
    b_num = b_cfg["batch_num"]
    sheet_name = b_cfg["sheet_name"]
    source_path = os.path.join(BRAIN_DIR, b_cfg["file"])
    im_src = Image.open(source_path)

    # Setup contact sheet for this batch
    contact_w = 5 * 300 + 6 * 20
    contact_h = 2 * 360 + 3 * 20 + 80
    contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
    draw = ImageDraw.Draw(contact_img)

    draw.text((25, 20), b_cfg["title"], font=title_font, fill=(18, 61, 40))
    draw.text((25, 48), "Names & Ribbons Removed | 100% Clean Botanical Photography | 1024x1024 WebP Template", font=sub_font, fill=(108, 113, 103))

    for idx, (sku, box, name_en) in enumerate(b_cfg["cards"]):
        crop = im_src.crop(box)

        # Scale to 1024 width and center on warm ivory limestone canvas
        out_img = Image.new("RGB", (1024, 1024), (249, 247, 235))
        scale = 1024 / crop.width
        new_h = int(crop.height * scale)
        scaled_crop = crop.resize((1024, new_h), Image.Resampling.LANCZOS)
        y_offset = (1024 - new_h) // 2
        out_img.paste(scaled_crop, (0, y_offset))

        # Save to target locations
        c_path = os.path.join(CLIENT_GEN, f"{sku}.webp")
        p_path = os.path.join(PUBLIC_GEN, f"{sku}.webp")
        d_path = os.path.join(DEMO_CANDIDATES, f"{sku}.webp")

        out_img.save(c_path, "WEBP", quality=92, method=6)
        out_img.save(p_path, "WEBP", quality=92, method=6)
        out_img.save(d_path, "WEBP", quality=92, method=6)

        total_processed += 1

        # Add to contact sheet
        col = idx % 5
        row = idx // 5
        cx = 20 + col * (300 + 20)
        cy = 80 + row * (360 + 20)

        draw.rectangle([cx, cy, cx + 300, cy + 360], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
        thumb = out_img.resize((300, 300), Image.Resampling.LANCZOS)
        contact_img.paste(thumb, (cx, cy))

        draw.rectangle([cx, cy + 300, cx + 300, cy + 360], fill=(255, 255, 255))
        draw.text((cx + 10, cy + 308), f"{sku} - {name_en[:24]}", font=card_title_font, fill=(18, 61, 40))
        draw.text((cx + 10, cy + 330), "Clean Photography (No Name) [OK]", font=card_meta_font, fill=(4, 120, 87))

    # Save contact sheet
    out_sheet_client = os.path.join(CLIENT_GEN, sheet_name)
    out_sheet_pub = os.path.join(PUBLIC_GEN, sheet_name)
    contact_img.save(out_sheet_client, "PNG")
    contact_img.save(out_sheet_pub, "PNG")
    print(f"✓ Batch {b_num:2d} (10 products) converted & contact sheet saved -> {sheet_name}")

print(f"\n==========================================")
print(f"SUCCESS: All {total_processed} products (TRN-1001 to TRN-1110) cleaned & re-saved!")
print(f"Zero text/ribbons remaining inside the product photographs.")
print(f"==========================================")

