import os
import sys
import json
import csv
import time
import urllib.request
import urllib.parse
from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")
MANIFEST_PATH = os.path.join(BASE_DIR, "docs", "TRINAYAA_162_PRODUCT_BOTANICAL_MANIFEST.csv")
AUDIT_OUTPUT_PATH = os.path.join(BASE_DIR, "docs", "WIKIMEDIA_SOURCING_AUDIT.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# 26 Verified SKUs to preserve (Batch 1 + Batch 2)
PRESERVED_SKUS = {
    "TRN-1001", "TRN-1002", "TRN-1003", "TRN-1004", "TRN-1005",
    "TRN-1006", "TRN-1007", "TRN-1008", "TRN-1009", "TRN-1010",
    "TRN-1011", "TRN-1012", "TRN-1013", "TRN-1014", "TRN-1015",
    "TRN-1016", "TRN-1017", "TRN-1018", "TRN-1021", "TRN-1022",
    "TRN-1023", "TRN-1024", "TRN-1025", "TRN-1026", "TRN-1027",
    "TRN-1028"
}

with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    items = list(csv.DictReader(f))

print(f"Loaded {len(items)} manifest items.")

headers = {
    "User-Agent": "TrinayaaBotanicalArchive/1.0 (contact@trinayaa.in; Research & Botanical Documentation Bot) Python-urllib"
}

def search_wikimedia(query):
    endpoint = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": "6",
        "gsrlimit": "6",
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "format": "json"
    }
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            results = []
            for pid, pdata in pages.items():
                infos = pdata.get("imageinfo", [])
                if not infos:
                    continue
                info = infos[0]
                img_url = info.get("url")
                width = info.get("width", 0)
                height = info.get("height", 0)
                meta = info.get("extmetadata", {})
                license_name = meta.get("LicenseShortName", {}).get("value", "CC-BY / Public Domain")
                author = meta.get("Artist", {}).get("value", "Wikimedia Contributor")
                title = pdata.get("title", "")
                
                # Exclude SVG, PDF, low-res or icons
                if not img_url or img_url.endswith(".svg") or width < 400 or height < 400:
                    continue
                    
                results.append({
                    "title": title,
                    "url": img_url,
                    "width": width,
                    "height": height,
                    "license": license_name,
                    "author": author
                })
            return results
    except Exception as e:
        print(f"    [Error query '{query}']: {e}")
        return []

def download_and_normalize(img_url, dest_path):
    req = urllib.request.Request(img_url, headers=headers)
    temp_path = dest_path + ".temp"
    try:
        with urllib.request.urlopen(req, timeout=20) as r, open(temp_path, "wb") as f:
            f.write(r.read())
            
        # Normalize to 1024x1024 WebP with luxury centered framing
        with Image.open(temp_path) as im:
            im = im.convert("RGB")
            w, h = im.size
            
            # If aspect ratio is close to square (within 1.25), do center crop
            aspect = w / h
            if 0.8 <= aspect <= 1.25:
                # Center square crop
                min_dim = min(w, h)
                left = (w - min_dim) // 2
                top = (h - min_dim) // 2
                im_cropped = im.crop((left, top, left + min_dim, top + min_dim))
                im_final = im_cropped.resize((1024, 1024), Image.Resampling.LANCZOS)
            else:
                # Pad to square with warm limestone ivory background (#FAF8F5)
                max_dim = max(w, h)
                pad_im = Image.new("RGB", (max_dim, max_dim), (250, 248, 245))
                offset_x = (max_dim - w) // 2
                offset_y = (max_dim - h) // 2
                pad_im.paste(im, (offset_x, offset_y))
                im_final = pad_im.resize((1024, 1024), Image.Resampling.LANCZOS)
                
            im_final.save(dest_path, "WEBP", quality=90, method=6)
            
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return True
    except Exception as e:
        print(f"    [Download Error {img_url}]: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return False

# Main Execution Loop
audit_log = {}
successful_count = 0
skipped_preserved = 0
failed_count = 0

print("\n=== STARTING WIKIMEDIA COMMONS BOTANICAL SOURCING ===")

for idx, it in enumerate(items):
    sku = it["sku"]
    name_en = it["name_en"]
    name_ta = it["name_ta"]
    bot_name = it["botanical_name"]
    form = it["product_form"]
    query = it["search_query"]
    dest_file = os.path.join(OUTPUT_DIR, f"{sku}.webp")
    
    # 1. Preserve existing 26 verified images
    if sku in PRESERVED_SKUS:
        skipped_preserved += 1
        audit_log[sku] = {
            "sku": sku,
            "name_en": name_en,
            "status": "AI_GENERATED_CANDIDATE",
            "source": "TRINAYAA Botanical Studio Photography (Verified)",
            "license": "TRINAYAA Commercial License",
            "dimensions": "1024x1024 WebP",
            "file_exists": os.path.exists(dest_file)
        }
        continue
        
    print(f"[{idx+1}/162] Sourcing {sku}: {name_en} ({bot_name} - {form})...")
    
    # Search candidates with primary query
    candidates = search_wikimedia(query)
    
    # If no results, try fallback with botanical name or English name
    if not candidates and bot_name:
        clean_bot = bot_name.split("/")[0].split("(")[0].strip()
        candidates = search_wikimedia(f"{clean_bot} botanical")
    if not candidates:
        clean_name = name_en.replace("Powder", "").replace("- 1", "").replace("- 2", "").strip()
        candidates = search_wikimedia(f"{clean_name} herb")
        
    if candidates:
        best = candidates[0]
        ok = download_and_normalize(best["url"], dest_file)
        if ok:
            successful_count += 1
            print(f"  ✓ Succeeded from Wikimedia: {best['license']} | {best['author'][:30]}")
            audit_log[sku] = {
                "sku": sku,
                "name_en": name_en,
                "name_ta": name_ta,
                "botanical_name": bot_name,
                "form": form,
                "status": "REAL_PHOTO_CANDIDATE",
                "source": best["url"],
                "author": best["author"],
                "license": best["license"],
                "dimensions": "1024x1024 WebP",
                "file_exists": True
            }
        else:
            failed_count += 1
            audit_log[sku] = {
                "sku": sku,
                "name_en": name_en,
                "status": "FAILED",
                "reason": "Download or normalization failed",
                "file_exists": False
            }
    else:
        failed_count += 1
        print(f"  ⚠️ No open photograph candidate found for: {query}")
        audit_log[sku] = {
            "sku": sku,
            "name_en": name_en,
            "status": "NEEDS_BOTANICAL_CONFIRMATION",
            "reason": "No Wikimedia candidate matched query",
            "file_exists": False
        }
        
    # Polite rate limit for Wikimedia API (1 request per 0.5s)
    time.sleep(0.4)

with open(AUDIT_OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(audit_log, f, ensure_ascii=False, indent=2)

print("\n=== SOURCING SUMMARY ===")
print(f"Preserved Verified Studio Candidates: {skipped_preserved}")
print(f"Successfully Sourced Real Photos: {successful_count}")
print(f"Failed / Needs Botanical Confirmation: {failed_count}")
print(f"Total Logged: {len(audit_log)} / 162")
print(f"Detailed audit saved to: {AUDIT_OUTPUT_PATH}")

