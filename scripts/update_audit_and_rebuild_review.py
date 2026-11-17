import os
import sys
import json
import csv
import hashlib
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_JSON_PATH = os.path.join(BASE_DIR, "docs", "WIKIMEDIA_SOURCING_AUDIT.json")
CANDIDATES_DIR = os.path.join(BASE_DIR, "image-library", "demo-approved-candidates")

# 1. Update WIKIMEDIA_SOURCING_AUDIT.json for TRN-1039
with open(AUDIT_JSON_PATH, "r", encoding="utf-8") as f:
    audit_data = json.load(f)

audit_data["TRN-1039"] = {
    "sku": "TRN-1039",
    "name_en": "Drumstick Gum",
    "name_ta": "முருங்கை பிசின்",
    "botanical_name": "Moringa oleifera",
    "form": "Herbal resin or gum",
    "status": "AI_GENERATED_CANDIDATE",
    "source": "TRINAYAA Botanical Studio (AI Fallback - Natural Resin Tears)",
    "license": "TRINAYAA Commercial Asset",
    "dimensions": "1024x1024 WebP",
    "sha256": "73338549e38764b68b516f0133949721035295d446f35d9d9c85ffdf1aca4cec",
    "file_exists": True
}

with open(AUDIT_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(audit_data, f, ensure_ascii=False, indent=2)

print("Updated WIKIMEDIA_SOURCING_AUDIT.json with TRN-1039.")

