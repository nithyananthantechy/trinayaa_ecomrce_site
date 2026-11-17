from PIL import Image
import numpy as np
import glob

for f in sorted(glob.glob("pdf_images/*.png")):
    im = Image.open(f)
    arr = np.array(im)
    print(f, im.size, "Mean:", arr.mean(axis=(0,1)).astype(int))
