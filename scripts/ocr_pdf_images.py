import pytesseract
from PIL import Image
import glob, os

for f in sorted(glob.glob('pdf_images/*.png')):
    try:
        txt = pytesseract.image_to_string(Image.open(f)).strip()
        if txt:
            print(f"=== {os.path.basename(f)} ===")
            print(txt[:200])
    except Exception as e:
        pass
