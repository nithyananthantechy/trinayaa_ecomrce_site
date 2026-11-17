import os
import sys
import hashlib
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_RAW = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\drumstick_gum_trn_1039_1793853202668.jpg"

STAGING_PATH = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates", "TRN-1039.webp")
CLIENT_GEN_PATH = os.path.join(BASE_DIR, "client", "public", "images", "products", "generated", "TRN-1039.webp")
PUB_GEN_PATH = os.path.join(BASE_DIR, "public", "images", "products", "generated", "TRN-1039.webp")

os.makedirs(os.path.dirname(STAGING_PATH), exist_ok=True)
os.makedirs(os.path.dirname(CLIENT_GEN_PATH), exist_ok=True)
os.makedirs(os.path.dirname(PUB_GEN_PATH), exist_ok=True)

if not os.path.exists(SRC_RAW):
    print(f"Error: Raw file not found: {SRC_RAW}")
    sys.exit(1)

im = Image.open(SRC_RAW).convert("RGB")
w, h = im.size
print(f"Original image: {w}x{h}, format={im.format}")

# Center square crop and resize to 1024x1024
min_dim = min(w, h)
left = (w - min_dim) // 2
top = (h - min_dim) // 2
im_cropped = im.crop((left, top, left + min_dim, top + min_dim))
im_final = im_cropped.resize((1024, 1024), Image.Resampling.LANCZOS)

im_final.save(STAGING_PATH, "WEBP", quality=90, method=6)
im_final.save(CLIENT_GEN_PATH, "WEBP", quality=90, method=6)
im_final.save(PUB_GEN_PATH, "WEBP", quality=90, method=6)

with open(STAGING_PATH, "rb") as f:
    data = f.read()
sha256 = hashlib.sha256(data).hexdigest()
size_kb = len(data) / 1024

print(f"✓ Saved TRN-1039.webp:")
print(f"  - Staging: {STAGING_PATH}")
print(f"  - Dimensions: 1024x1024")
print(f"  - Format: WebP")
print(f"  - Size: {size_kb:.1f} KB")
print(f"  - SHA-256: {sha256}")

