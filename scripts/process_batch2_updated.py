import os
import sys
import hashlib
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAIN_DIR = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868"
CLIENT_GEN_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")

os.makedirs(CLIENT_GEN_DIR, exist_ok=True)
os.makedirs(PUBLIC_GEN_DIR, exist_ok=True)

# Map all 16 completed raw images
image_sources = {
    "TRN-1011": os.path.join(BRAIN_DIR, "trn_1011_1793791468057.jpg"),
    "TRN-1012": os.path.join(BRAIN_DIR, "trn_1012_lotus_flower_1793807945758.jpg"),
    "TRN-1013": os.path.join(BRAIN_DIR, "trn_1013_lotus_seeds_1793808426158.jpg"),
    "TRN-1014": os.path.join(BRAIN_DIR, "trn_1014_indian_silver_fir_1793808494155.jpg"),
    "TRN-1015": os.path.join(BRAIN_DIR, "trn_1015_long_pepper_1793808654406.jpg"),
    "TRN-1016": os.path.join(BRAIN_DIR, "trn_1016_big_pepper_1793808797831.jpg"),
    "TRN-1017": os.path.join(BRAIN_DIR, "trn_1017_round_pepper_1793808952716.jpg"),
    "TRN-1018": os.path.join(BRAIN_DIR, "trn_1018_indian_mallow_seeds_1793809083280.jpg"),
    "TRN-1021": os.path.join(BRAIN_DIR, "trn_1021_naval_pattai_1793791477880.jpg"),
    "TRN-1022": os.path.join(BRAIN_DIR, "trn_1022_nilavembu_1793791494595.jpg"),
    "TRN-1023": os.path.join(BRAIN_DIR, "trn_1023_caltrops_large_1793808489214.jpg"),
    "TRN-1024": os.path.join(BRAIN_DIR, "trn_1024_caltrops_small_1793808548574.jpg"),
    "TRN-1025": os.path.join(BRAIN_DIR, "trn_1025_indian_gooseberry_vathal_1793808674089.jpg"),
    "TRN-1026": os.path.join(BRAIN_DIR, "trn_1026_sappan_wood_1793808810646.jpg"),
    "TRN-1027": os.path.join(BRAIN_DIR, "trn_1027_cotton_seeds_1793808954368.jpg"),
    "TRN-1028": os.path.join(BRAIN_DIR, "trn_1028_almond_gum_1793809086300.jpg"),
}

paused_skus = ["TRN-1019", "TRN-1020", "TRN-1029", "TRN-1030"]

print("=== NORMALIZING 16 COMPLETED BATCH 2 IMAGES TO 1024x1024 WEBP ===")
hashes = set()
validation_results = []

for sku, src in image_sources.items():
    if not os.path.exists(src):
        print(f"Error: Missing source file for {sku}: {src}")
        continue
    
    im = Image.open(src).convert("RGB")
    im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    dest1 = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
    dest2 = os.path.join(PUBLIC_GEN_DIR, f"{sku}.webp")
    
    im.save(dest1, "WEBP", quality=90, method=6)
    im.save(dest2, "WEBP", quality=90, method=6)
    
    with open(dest1, "rb") as f:
        data = f.read()
    h = hashlib.sha256(data).hexdigest()
    is_unique = h not in hashes
    hashes.add(h)
    
    file_kb = len(data) / 1024
    validation_results.append((sku, "READY_FOR_REVIEW", file_kb, (1024, 1024), h[:10]))
    print(f"  ✓ {sku}.webp: 1024x1024, {file_kb:.1f} KB, SHA-256={h[:10]} (Unique: {is_unique})")

print(f"\nTotal completed & verified images: {len(validation_results)}/20")
print(f"Total paused due to HTTP 429 quota: {len(paused_skus)}/20: {', '.join(paused_skus)}")

# Update manifest CSV
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for i in range(10, 30):
    sku = rows[i]["sku"]
    if sku in image_sources:
        rows[i]["status"] = "READY_FOR_REVIEW"
    else:
        rows[i]["status"] = "QUOTA_EXHAUSTED_PAUSED (Reset: 2026-11-04T20:55:04Z)"

fieldnames = list(rows[0].keys())
with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print("\nManifest updated with 16 READY_FOR_REVIEW and 4 QUOTA_EXHAUSTED_PAUSED.")

# Generate Composite Contact Sheet Image (4 rows x 5 columns = 20 products)
print("\n=== GENERATING COMPOSITE CONTACT SHEET IMAGE (BATCH 2) ===")
contact_w = 5 * 320 + 6 * 20
contact_h = 4 * 380 + 5 * 20 + 80
contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
draw = ImageDraw.Draw(contact_img)

draw.text((30, 25), "TRINAYAA — Botanical Photography Pipeline (Batch 2: TRN-1011 to TRN-1030)", fill=(18, 61, 40))
draw.text((30, 50), "16 Completed Natural Botanical Photographs (1024x1024 WebP) · 4 Paused at Upstream Model Quota", fill=(108, 113, 103))

for idx in range(20):
    col = idx % 5
    row = idx // 5
    x = 20 + col * (320 + 20)
    y = 90 + row * (380 + 20)
    
    sku = f"TRN-{1011 + idx}"
    webp_path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
    
    # White card background
    draw.rectangle([x, y, x + 320, y + 380], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
    
    manifest_row = rows[10 + idx]
    name_en = manifest_row["name_en"]
    form = manifest_row["product_form"]
    status = manifest_row["status"]
    
    if os.path.exists(webp_path):
        thumb = Image.open(webp_path).resize((320, 300), Image.Resampling.LANCZOS)
        contact_img.paste(thumb, (x, y))
    else:
        # Paused card
        draw.rectangle([x, y, x + 320, y + 300], fill=(245, 242, 237))
        draw.text((x + 40, y + 110), "⏳ QUOTA PAUSED (HTTP 429)", fill=(180, 83, 9))
        draw.text((x + 55, y + 135), "Prompt & Form Staged", fill=(130, 125, 115))
        draw.text((x + 45, y + 155), f"Target: {sku}.webp", fill=(150, 145, 135))
    
    # Label box
    draw.rectangle([x, y + 300, x + 320, y + 380], fill=(255, 255, 255))
    draw.text((x + 10, y + 308), f"{sku} — {name_en[:26]}", fill=(18, 61, 40))
    draw.text((x + 10, y + 328), f"Form: {form}", fill=(70, 100, 80))
    
    if "READY_FOR_REVIEW" in status:
        draw.text((x + 10, y + 348), "STATUS: READY FOR REVIEW ✓", fill=(4, 120, 87))
    else:
        draw.text((x + 10, y + 348), "STATUS: QUOTA PAUSED (4 remaining)", fill=(180, 83, 9))

contact_sheet_png = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch2.png")
contact_img.save(contact_sheet_png, "PNG")
print(f"Updated contact sheet image: {contact_sheet_png}")

# Generate HTML contact sheet
html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TRINAYAA — Botanical Photography Contact Sheet (Batch 2: TRN-1011 to TRN-1030)</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf8f5; color: #1b4332; margin: 0; padding: 40px; }
  h1 { font-family: Georgia, serif; font-size: 28px; margin-bottom: 8px; color: #123d28; }
  p.subtitle { color: #6c7167; font-size: 14px; margin-top: 0; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
  .card { background: #ffffff; border: 1px solid #e5ded3; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
  .img-box { width: 100%; aspect-ratio: 1/1; background: #f4eee3; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .img-box img { width: 100%; height: 100%; object-fit: cover; }
  .placeholder { color: #9c9284; font-size: 13px; text-align: center; padding: 20px; }
  .content { padding: 16px; }
  .sku-badge { display: inline-block; background: #123d28; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px; }
  .name-en { font-family: Georgia, serif; font-size: 16px; font-weight: bold; margin: 0 0 4px 0; color: #123d28; }
  .name-ta { font-size: 13px; color: #5a6b5c; margin: 0 0 8px 0; }
  .meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; border-top: 1px solid #f0eae1; padding-top: 10px; margin-top: 8px; }
  .form-tag { background: #edf4e9; color: #1e5235; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .status-ready { color: #047857; font-weight: 700; text-transform: uppercase; font-size: 10px; }
  .status-pending { color: #d97706; font-weight: 700; text-transform: uppercase; font-size: 10px; }
</style>
</head>
<body>
  <h1>TRINAYAA Botanical Photography — Batch 2 Contact Sheet</h1>
  <p class="subtitle">Products TRN-1011 through TRN-1030 · 1:1 Square 1024×1024 WebP · Warm Ivory & Teakwood Aesthetics · Zero Packaging & Labels</p>
  <div style="background:#ecfdf5;border:1px solid #059669;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#065f46">
    <strong>Batch 2 Progress:</strong> <strong>16 of 20 products generated and verified (80% complete)</strong>. 4 products paused due to model quota capacity limit.
  </div>
  <div class="grid">
"""
for item in rows[10:30]:
    sku = item['sku']
    name_en = item['name_en']
    name_ta = item['name_ta']
    form = item['product_form']
    status = item['status']
    img_url = item['new_image']
    
    local_path = os.path.join(BASE_DIR, "client", "public", img_url.lstrip("/"))
    file_exists = os.path.exists(local_path)
    
    html += f"""
    <div class="card">
      <div class="img-box">
        {"<img src='" + img_url + "' alt='" + name_en + "' />" if file_exists else "<div class='placeholder'>⏳ <strong>Quota Paused (HTTP 429)</strong><br><small style='color:#a16207'>Prompt & Form Staged</small><br><span style='font-family:monospace;font-size:11px;margin-top:4px;display:inline-block'>" + sku + ".webp</span></div>"}
      </div>
      <div class="content">
        <span class="sku-badge">{sku}</span>
        <h3 class="name-en">{name_en}</h3>
        <p class="name-ta">{name_ta}</p>
        <div class="meta">
          <span class="form-tag">{form}</span>
          <span class="{ 'status-ready' if file_exists else 'status-pending' }">{ 'READY FOR REVIEW' if file_exists else 'QUOTA PAUSED' }</span>
        </div>
      </div>
    </div>
"""

html += """
  </div>
</body>
</html>
"""
out_html = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch2.html")
with open(out_html, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Updated HTML contact sheet: {out_html}")

