import os
import sys
import csv
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "data", "product_image_manifest.csv")
GEN_DIR = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated")
PUBLIC_GEN_DIR = os.path.join(BASE_DIR, "public", "images", "products", "generated")

os.makedirs(GEN_DIR, exist_ok=True)
os.makedirs(PUBLIC_GEN_DIR, exist_ok=True)

def normalize_to_webp(src_path, dest_webp_path, target_size=(1024, 1024)):
    """Normalize any image to 1024x1024 high-fidelity WebP without distortion."""
    im = Image.open(src_path)
    im = im.convert("RGB")
    
    # Resize with high quality Lanczos filter
    im = im.resize(target_size, Image.Resampling.LANCZOS)
    im.save(dest_webp_path, "WEBP", quality=90, method=6)
    
    # Also mirror to public folder
    dest_public = os.path.join(PUBLIC_GEN_DIR, os.path.basename(dest_webp_path))
    im.save(dest_public, "WEBP", quality=90, method=6)
    print(f"Saved normalized WebP: {dest_webp_path} ({os.path.getsize(dest_webp_path)/1024:.1f} KB)")
    return dest_webp_path

def generate_html_contact_sheet(items, output_html_path):
    """Generate an elegant visual HTML contact sheet for Stage 1 Batch review."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TRINAYAA — Botanical Photography Contact Sheet (Batch 1)</title>
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
  .status-pending { color: #d97706; }
</style>
</head>
<body>
  <h1>TRINAYAA Botanical Photography — Batch 1 Contact Sheet</h1>
  <p class="subtitle">Natural Botanical Studio Direction · 1:1 Square · Warm Ivory & Teakwood Aesthetics · No Artificial Packaging or Labels</p>
  <div class="grid">
"""
    for item in items:
        sku = item['sku']
        name_en = item['name_en']
        name_ta = item['name_ta']
        form = item['product_form']
        status = item['status']
        img_url = item['new_image']
        
        # Check if physical file exists
        local_path = os.path.join(BASE_DIR, "client", "public", img_url.lstrip("/"))
        file_exists = os.path.exists(local_path)
        
        html += f"""
    <div class="card">
      <div class="img-box">
        {"<img src='" + img_url + "' alt='" + name_en + "' />" if file_exists else "<div class='placeholder'>📸 Pending Stage 1 Generation<br><small style='opacity:0.7'>" + sku + ".webp</small></div>"}
      </div>
      <div class="content">
        <span class="sku-badge">{sku}</span>
        <h3 class="name-en">{name_en}</h3>
        <p class="name-ta">{name_ta}</p>
        <div class="meta">
          <span class="form-tag">{form}</span>
          <span class="status-tag {'status-ready' if file_exists else 'status-pending'}">{'READY FOR REVIEW' if file_exists else 'PENDING'}</span>
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
    # Read manifest first 10
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
    batch1 = reader[:10]
    out_html = os.path.join(GEN_DIR, "contact_sheet_batch1.html")
    generate_html_contact_sheet(batch1, out_html)

