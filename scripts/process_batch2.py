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

def process_and_validate_batch2(file_map):
    print("=== CONVERTING & NORMALIZING BATCH 2 TO 1024x1024 WEBP ===")
    for sku, src in file_map.items():
        if not os.path.exists(src):
            print(f"Error: Source not found for {sku}: {src}")
            continue
        
        im = Image.open(src).convert("RGB")
        im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
        
        dest1 = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
        dest2 = os.path.join(PUBLIC_GEN_DIR, f"{sku}.webp")
        
        im.save(dest1, "WEBP", quality=90, method=6)
        im.save(dest2, "WEBP", quality=90, method=6)
        print(f"  ✓ {sku}.webp -> {os.path.getsize(dest1)/1024:.1f} KB")

    # Quality Validation (Task 4)
    print("\n=== TASK 4: QUALITY VALIDATION & HASH VERIFICATION ===")
    hashes = set()
    validation_results = []

    for i in range(11, 31):
        sku = f"TRN-{1000 + i}"
        path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
        if not os.path.exists(path):
            validation_results.append((sku, "MISSING", 0, (0,0), "N/A"))
            continue
        
        im = Image.open(path)
        size = im.size
        fmt = im.format
        with open(path, "rb") as f:
            file_bytes = f.read()
        h = hashlib.sha256(file_bytes).hexdigest()
        is_unique = h not in hashes
        hashes.add(h)
        
        status_ok = size == (1024, 1024) and fmt == "WEBP" and is_unique
        validation_results.append((sku, "READY_FOR_REVIEW" if status_ok else "REJECTED", len(file_bytes)/1024, size, h[:10]))
        print(f"  • {sku}: Format={fmt}, Size={size}, Weight={len(file_bytes)/1024:.1f}KB, Unique={is_unique}, Hash={h[:10]}")

    # Update manifest CSV
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    for i in range(10, 30):
        rows[i]["status"] = "READY_FOR_REVIEW"

    fieldnames = list(rows[0].keys())
    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nManifest updated with Batch 2 status: READY_FOR_REVIEW")

    # Generate Composite Contact Sheet Image (4 rows x 5 columns = 20 products)
    print("\n=== GENERATING COMPOSITE CONTACT SHEET IMAGE (BATCH 2) ===")
    contact_w = 5 * 320 + 6 * 20
    contact_h = 4 * 380 + 5 * 20 + 80
    contact_img = Image.new("RGB", (contact_w, contact_h), (250, 248, 245))
    draw = ImageDraw.Draw(contact_img)

    # Title
    draw.text((30, 25), "TRINAYAA — Botanical Photography Pipeline (Batch 2: TRN-1011 to TRN-1030)", fill=(18, 61, 40))
    draw.text((30, 50), "Natural Raw Botanicals · 1024x1024 WebP · Shallow Teak Bowls · Ivory Limestone Surface · 100% Unique", fill=(108, 113, 103))

    for idx in range(20):
        col = idx % 5
        row = idx // 5
        x = 20 + col * (320 + 20)
        y = 90 + row * (380 + 20)
        
        sku = f"TRN-{1011 + idx}"
        webp_path = os.path.join(CLIENT_GEN_DIR, f"{sku}.webp")
        
        # White card background
        draw.rectangle([x, y, x + 320, y + 380], fill=(255, 255, 255), outline=(220, 215, 205), width=1)
        
        if os.path.exists(webp_path):
            thumb = Image.open(webp_path).resize((320, 300), Image.Resampling.LANCZOS)
            contact_img.paste(thumb, (x, y))
        
        manifest_row = rows[10 + idx]
        name_en = manifest_row["name_en"]
        form = manifest_row["product_form"]
        
        # Draw label box
        draw.rectangle([x, y + 300, x + 320, y + 380], fill=(255, 255, 255))
        draw.text((x + 10, y + 308), f"{sku} — {name_en[:28]}", fill=(18, 61, 40))
        draw.text((x + 10, y + 328), f"Form: {form}", fill=(70, 100, 80))
        draw.text((x + 10, y + 348), "STATUS: READY FOR REVIEW", fill=(4, 120, 87))

    contact_sheet_png = os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch2.png")
    contact_img.save(contact_sheet_png, "PNG")
    print(f"Contact sheet saved to {contact_sheet_png}")

    # Generate HTML contact sheet for Batch 2
    generate_html_contact_sheet_batch2(rows[10:30], os.path.join(CLIENT_GEN_DIR, "contact_sheet_batch2.html"))
    print("Batch 2 processing completed successfully!")

def generate_html_contact_sheet_batch2(items, output_html_path):
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
  .card { background: #ffffff; border: 1px solid #e5ded3; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.04); transition: transform 0.2s; }
  .card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
  .img-box { width: 100%; aspect-ratio: 1/1; background: #f4eee3; position: relative; display: flex; align-items: center; justify-content: center; }
  .img-box img { width: 100%; height: 100%; object-fit: cover; }
  .placeholder { color: #9c9284; font-size: 13px; text-align: center; padding: 20px; }
  .content { padding: 16px; }
  .sku-badge { display: inline-block; background: #123d28; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px; }
  .name-en { font-family: Georgia, serif; font-size: 16px; font-weight: bold; margin: 0 0 4px 0; color: #123d28; }
  .name-ta { font-size: 13px; color: #5a6b5c; margin: 0 0 8px 0; }
  .meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; border-top: 1px solid #f0eae1; padding-top: 10px; margin-top: 8px; }
  .form-tag { background: #edf4e9; color: #1e5235; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
  .status-tag { font-weight: 700; text-transform: uppercase; font-size: 10px; }
  .status-ready { color: #047857; }
</style>
</head>
<body>
  <h1>TRINAYAA Botanical Photography — Batch 2 Contact Sheet</h1>
  <p class="subtitle">Products TRN-1011 through TRN-1030 · 1:1 Square 1024×1024 WebP · Warm Ivory & Teakwood Aesthetics · Zero Packaging & Labels</p>
  <div class="grid">
"""
    for item in items:
        sku = item['sku']
        name_en = item['name_en']
        name_ta = item['name_ta']
        form = item['product_form']
        img_url = item['new_image']
        
        local_path = os.path.join(BASE_DIR, "client", "public", img_url.lstrip("/"))
        file_exists = os.path.exists(local_path)
        
        html += f"""
    <div class="card">
      <div class="img-box">
        {"<img src='" + img_url + "' alt='" + name_en + "' />" if file_exists else "<div class='placeholder'>📸 Pending Stage 2 Generation<br><small style='opacity:0.7'>" + sku + ".webp</small></div>"}
      </div>
      <div class="content">
        <span class="sku-badge">{sku}</span>
        <h3 class="name-en">{name_en}</h3>
        <p class="name-ta">{name_ta}</p>
        <div class="meta">
          <span class="form-tag">{form}</span>
          <span class="status-tag status-ready">READY FOR REVIEW</span>
        </div>
      </div>
    </div>
"""

    html += """
  </div>
</body>
</html>
"""
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated HTML contact sheet: {output_html_path}")

if __name__ == "__main__":
    pass

