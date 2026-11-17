from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
# downsample to 40x40
thumb = im.resize((50, 35))
arr = np.array(thumb)
bg = np.array([255, 253, 248])
diff = np.abs(arr - bg).sum(axis=-1)
for row in diff:
    line = "".join(["#" if v > 30 else " " for v in row])
    print(line)
