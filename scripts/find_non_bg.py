from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
arr = np.array(im)
bg = np.array([255, 253, 248])
diff = np.abs(arr - bg).sum(axis=-1)
non_bg = diff > 20
print("Non-bg pixels count:", non_bg.sum())
rows = np.any(non_bg, axis=1)
cols = np.any(non_bg, axis=0)
if np.any(rows):
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    print(f"Non-bg bounding box: x={xmin}..{xmax}, y={ymin}..{ymax} (width: {xmax-xmin}, height: {ymax-ymin})")
