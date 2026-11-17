from PIL import Image
import numpy as np

for f in ["page_3_img_1_X17.png", "page_4_img_1_X20.png", "page_5_img_2_X24.png", "page_7_img_1_X31.png"]:
    im = Image.open(f"pdf_images/{f}")
    arr = np.array(im)
    print(f, im.size, "Mean:", arr.mean(axis=(0,1)).astype(int))
