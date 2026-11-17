import os
import sys
import hashlib
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIENT_GEN_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")

os.makedirs(CLIENT_GEN_DIR, exist_ok=True)
os.makedirs(PUBLIC_GEN_DIR, exist_ok=True)

# 1. Verify preserved completed files
print("=== VERIFYING PRESERVED COMPLETED FILES ===")
completed_skus = ["TRN-1011", "TRN-1021", "TRN-1022"]
for sku in completed_skus:
    p = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
    if os.path.exists(p):
        im = Image.open(p)
        print(f"  ✓ {sku}.webp: format={im.format}, size={im.size}, bytes={os.path.getsize(p)}")
    else:
        print(f"  ❌ {sku}.webp: MISSING!")

# 2. Update Manifest
with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

for i in range(10, 30):
    sku = rows[i]["sku"]
    if sku in completed_skus:
        rows[i]["status"] = "READY_FOR_REVIEW"
    else:
        rows[i]["status"] = "QUOTA_EXHAUSTED_PENDING_WINDOW (Reset: 2026-11-04T15:55:04Z)"

fieldnames = list(rows[0].keys())
with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print("Manifest updated with exact quota status.")

# 3. Generate Contact Sheet Image
contact_w = 5 * 320 + 6 * 20
contact_h = 4 * 380 + 5 * 20 + 80
contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
draw = ImageDraw.Draw(contact_img)

draw.text((30, 25), "TRINAYAA — Botanical Photography Pipeline (Batch 2: TRN-1011 to TRN-1030)", fill=(18, 61, 40))
draw.text((30, 50), "Natural Raw Botanicals · 1024x1024 WebP · Shallow Teak Bowls · Ivory Limestone Surface", fill=(108, 113, 103))

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
    name_ta = manifest_row["name_ta"]
    form = manifest_row["product_form"]
    status = manifest_row["status"]
    
    if os.path.exists(webp_path):
        thumb = Image.open(webp_path).resize((320, 300), Image.Resampling.LANCZOS)
        contact_img.paste(thumb, (x, y))
    else:
        # Placeholder card for quota-paused items
        draw.rectangle([x, y, x + 320, y + 300], fill=(245, 242, 237))
        draw.text((x + 35, y + 110), "⏳ PENDING MODEL QUOTA", fill=(180, 100, 30))
        draw.text((x + 45, y + 135), "Prompt & Form Ready", fill=(130, 125, 115))
        draw.text((x + 35, y + 155), f"Target: {sku}.webp", fill=(150, 145, 135))
    
    # Label box
    draw.rectangle([x, y + 300, x + 320, y + 380], fill=(255, 255, 255))
    draw.text((x + 10, y + 308), f"{sku} — {name_en[:26]}", fill=(18, 61, 40))
    draw.text((x + 10, y + 328), f"Form: {form}", fill=(70, 100, 80))
    
    if "READY_FOR_REVIEW" in status:
        draw.text((x + 10, y + 348), "STATUS: READY FOR REVIEW ✓", fill=(4, 120, 87))
    else:
        draw.text((x + 10, y + 348), "STATUS: QUOTA LIMIT (~4h remaining)", fill=(180, 83, 9))

contact_sheet_png = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch2.png")
contact_img.save(contact_sheet_png, "PNG")
print(f"Updated contact sheet image: {contact_sheet_png}")

# 4. Generate HTML contact sheet
html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TRINAYAA — Botanical Photography Contact Sheet (Batch 2: TRN-1011 to TRN-1030)</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf8f5; color: #1b4332; margin: 0; padding: 40px; }
  h1 { font-family: Georgia, serif; font-size: 28px; margin-bottom: 8px; color: #123d28; }
  p.subtitle { color: #6c7167; font-size: 14px; margin-top: 0; margin-bottom: 30px; }
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
  <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#92400e">
    <strong>Provider Availability Notice:</strong> Upstream model returned HTTP 429 RESOURCE_EXHAUSTED. Quota reset window: ~4 hours remaining (Reset timestamp: 2026-11-04T15:55:04Z). 3 images successfully generated and preserved; 17 prompts staged and ready to resume.
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
        {"<img src='" + img_url + "' alt='" + name_en + "' />" if file_exists else "<div class='placeholder'>⏳ <strong>Quota Limit (~4h Remaining)</strong><br><small style='color:#a16207'>Prompt & Form Configured</small><br><span style='font-family:monospace;font-size:11px;margin-top:4px;display:inline-block'>" + sku + ".webp</span></div>"}
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
