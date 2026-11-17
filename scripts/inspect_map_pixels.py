from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
arr = np.array(im)

# Sample 10 random coordinates to see what's in there
for y in range(100, 700, 100):
    row = [tuple(arr[y, x]) for x in range(100, 700, 100)]
    print(f"y={y}:", row)
