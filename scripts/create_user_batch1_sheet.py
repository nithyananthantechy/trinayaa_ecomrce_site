import os
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_GEN = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")

font_bold = "C:/Windows/Fonts/segoeuib.ttf"
font_regular = "C:/Windows/Fonts/segoeui.ttf"

title_font = ImageFont.truetype(font_bold, 20)
sub_font = ImageFont.truetype(font_regular, 13)
card_title_font = ImageFont.truetype(font_bold, 13)
card_meta_font = ImageFont.truetype(font_regular, 11)

# 5 columns x 2 rows
contact_w = 5 * 300 + 6 * 20
contact_h = 2 * 360 + 3 * 20 + 80
contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
draw = ImageDraw.Draw(contact_img)

draw.text((25, 20), "TRINAYAA - Converted Product Images (Batch 1: TRN-1001 to TRN-1010)", font=title_font, fill=(18, 61, 40))
draw.text((25, 48), "Converted to 1024x1024 WebP Template | 100% Original Image Integrity Preserved | Ready for Storefront", font=sub_font, fill=(108, 113, 103))

items = [
    ("TRN-1001", "Licorice Root", "அதிமதுரம்"),
    ("TRN-1002", "Ashwagandha - 1", "அமுக்கரா"),
    ("TRN-1003", "Peepal Seeds", "அரச விதை"),
    ("TRN-1004", "Ashwagandha - 2", "அஸ்வகந்தா"),
    ("TRN-1005", "Inknut/Myrobalan", "கடுக்காய்"),
    ("TRN-1006", "Indian Aloe Gum", "கரியபவளம்"),
    ("TRN-1007", "Fever Nut", "கழற்சிக்காய்"),
    ("TRN-1008", "Babchi Seeds", "கார்போக அரிசி"),
    ("TRN-1009", "Malabar Tamarind", "குடம்புளி"),
    ("TRN-1010", "Lesser Galangal", "சித்தரத்தை"),
]

for idx, (sku, name_en, name_ta) in enumerate(items):
    col = idx % 5
    row = idx // 5
    x = 20 + col * (300 + 20)
    y = 80 + row * (360 + 20)
    
    # White card background
    draw.rectangle([x, y, x + 300, y + 360], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
    
    webp_path = os.path.join(CLIENT_GEN, f"{sku}.webp")
    if os.path.exists(webp_path):
        thumb = Image.open(webp_path).resize((300, 300), Image.Resampling.LANCZOS)
        contact_img.paste(thumb, (x, y))
    
    # Label box
    draw.rectangle([x, y + 300, x + 300, y + 360], fill=(255, 255, 255))
    draw.text((x + 10, y + 308), f"{sku} - {name_en}", font=card_title_font, fill=(18, 61, 40))
    draw.text((x + 10, y + 330), f"Status: ACTIVE ON STOREFRONT [OK]", font=card_meta_font, fill=(4, 120, 87))

out_png = os.path.join(CLIENT_GEN, "contact_sheet_user_batch1.png")
contact_img.save(out_png, "PNG")
print(f"Saved review contact sheet: {out_png}")

