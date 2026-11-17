from PIL import Image
import numpy as np

for name in ["page_1_img_2_X8.png", "page_1_img_3_X9.png", "page_2_img_1_X13.png", "page_2_img_2_X14.png"]:
    im = Image.open(f"pdf_images/{name}")
    arr = np.array(im)
    print(f"=== {name} ===")
    print("Shape:", arr.shape)
    print("Mean RGB:", arr.mean(axis=(0,1)))
