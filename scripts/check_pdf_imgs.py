from PIL import Image
import numpy as np
import glob, os

for f in sorted(glob.glob("pdf_images/*.png")):
    im = Image.open(f)
    print(f"{os.path.basename(f)}: size={im.size}")
