import glob
import os
from PIL import Image

base = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded"
files = glob.glob(os.path.join(base, "*"))

for f in files:
    ext = os.path.splitext(f)[1].lower()
    if ext in [".png", ".jpg", ".jpeg"]:
        try:
            im = Image.open(f)
            # if aspect ratio is roughly between 0.7 and 1.5 and size > 200x200
            w, h = im.size
            if w > 200 and h > 200:
                print(f"{os.path.basename(f)}: size=({w}, {h}), ratio={w/h:.2f}")
        except Exception:
            pass
