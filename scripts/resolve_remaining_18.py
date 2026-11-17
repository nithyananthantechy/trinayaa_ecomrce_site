import os
import sys
import json
import urllib.request
import urllib.parse
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")
AUDIT_OUTPUT_PATH = os.path.join(BASE_DIR, "docs", "WIKIMEDIA_SOURCING_AUDIT.json")

with open(AUDIT_OUTPUT_PATH, "r", encoding="utf-8") as f:
    audit_data = json.load(f)

headers = {
    "User-Agent": "TrinayaaBotanicalArchive/1.0 (contact@trinayaa.in; Research & Botanical Documentation Bot) Python-urllib"
}

SYNONYMS = {
    "TRN-1039": "Moringa resin",
    "TRN-1065": "Rubia cordifolia",
    "TRN-1066": "Withania coagulans",
    "TRN-1079": "Amla fruit",
    "TRN-1097": "Terminalia chebula",
    "TRN-1098": "Aloe vera",
    "TRN-1100": "Psoralea corylifolia",
    "TRN-1106": "Hemidesmus indicus",
    "TRN-1112": "Phyllanthus emblica",
    "TRN-1113": "Amla powder",
    "TRN-1118": "Terminalia arjuna",
    "TRN-1120": "Pomegranate peel",
    "TRN-1121": "Mango seed",
    "TRN-1122": "Drynaria quercifolia",
    "TRN-1123": "Moringa seed",
    "TRN-1145": "Aegle marmelos leaf",
    "TRN-1151": "Withania coagulans",
    "TRN-1152": "Alum crystal"
}

def search_wikimedia(query):
    endpoint = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": "6",
        "gsrlimit": "4",
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
            for pid, pdata in pages.items():
                infos = pdata.get("imageinfo", [])
                if not infos:
                    continue
                info = infos[0]
                img_url = info.get("url")
                meta = info.get("extmetadata", {})
                license_name = meta.get("LicenseShortName", {}).get("value", "CC-BY / Public Domain")
                author = meta.get("Artist", {}).get("value", "Wikimedia Contributor")
                if img_url and not img_url.endswith(".svg") and info.get("width", 0) >= 300:
                    return {
                        "url": img_url,
                        "license": license_name,
                        "author": author
                    }
    except Exception as e:
        print(f"Error {query}: {e}")
    return None

def download_and_normalize(img_url, dest_path):
    req = urllib.request.Request(img_url, headers=headers)
    temp_path = dest_path + ".temp"
    try:
        with urllib.request.urlopen(req, timeout=20) as r, open(temp_path, "wb") as f:
            f.write(r.read())
        with Image.open(temp_path) as im:
            im = im.convert("RGB")
            w, h = im.size
            aspect = w / h
            if 0.8 <= aspect <= 1.25:
                min_dim = min(w, h)
                left = (w - min_dim) // 2
                top = (h - min_dim) // 2
                im_final = im.crop((left, top, left + min_dim, top + min_dim)).resize((1024, 1024), Image.Resampling.LANCZOS)
            else:
                max_dim = max(w, h)
                pad_im = Image.new("RGB", (max_dim, max_dim), (250, 248, 245))
                pad_im.paste(im, ((max_dim - w) // 2, (max_dim - h) // 2))
                im_final = pad_im.resize((1024, 1024), Image.Resampling.LANCZOS)
            im_final.save(dest_path, "WEBP", quality=90, method=6)
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return True
    except:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return False

resolved_count = 0
for sku, syn in SYNONYMS.items():
    dest = os.path.join(OUTPUT_DIR, f"{sku}.webp")
    if os.path.exists(dest):
        continue
    print(f"Searching synonym for {sku} with '{syn}'...")
    res = search_wikimedia(syn)
    if res:
        ok = download_and_normalize(res["url"], dest)
        if ok:
            resolved_count += 1
            print(f"  ✓ Resolved {sku} with {res['license']}")
            audit_data[sku] = {
                "sku": sku,
                "name_en": audit_data.get(sku, {}).get("name_en", ""),
                "status": "REAL_PHOTO_CANDIDATE",
                "source": res["url"],
                "author": res["author"],
                "license": res["license"],
                "dimensions": "1024x1024 WebP",
                "file_exists": True
            }

with open(AUDIT_OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(audit_data, f, ensure_ascii=False, indent=2)

print(f"\nResolved an additional {resolved_count} items. Total updated audit saved.")

