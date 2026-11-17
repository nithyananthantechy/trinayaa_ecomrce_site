import os
import sys
import json
import easyocr
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

reader = easyocr.Reader(['en'], gpu=False)

packaged_dir = 'client/public/images/products/packaged'
results = {}

print("Scanning pouches with EasyOCR...")
for i in range(1, 183):
    fn = f"pouch_{i:03d}.png"
    fp = os.path.join(packaged_dir, fn)
    if not os.path.exists(fp):
        continue
    
    # Crop the banner/text region (middle third of image) to be fast & accurate
    im = Image.open(fp)
    w, h = im.size
    crop = im.crop((int(w * 0.15), int(h * 0.25), int(w * 0.85), int(h * 0.65)))
    crop_path = "temp_ocr_crop.png"
    crop.save(crop_path)
    
    ocr_res = reader.readtext(crop_path, detail=0)
    text = " ".join(ocr_res)
    results[fn] = text
    if i % 10 == 0 or i == 1:
        print(f"[{i}/182] {fn}: {text}")

with open("pouch_ocr_inventory.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nFinished OCR inventory! Saved to pouch_ocr_inventory.json")

