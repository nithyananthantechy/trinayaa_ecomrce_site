from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
arr = np.array(im)

# Look at center 200x200
center = arr[300:500, 300:500]
print("Center mean:", center.mean(axis=(0,1)))
# Look at edges
top_left = arr[0:50, 0:50]
print("Top left mean:", top_left.mean(axis=(0,1)))

# Let's save a clean transparent PNG and SVG silhouette of the district boundary!
# If the map has a distinct shape on white/light background, let's analyze the mask.
# Background is likely light (around 240-255).
# Let's count pixels with brightness < 220
mask = (arr[:, :, 0] < 220) | (arr[:, :, 1] < 220) | (arr[:, :, 2] < 220)
print("Foreground pixels count:", mask.sum(), "Total pixels:", arr.shape[0]*arr.shape[1])
# Bounding box of foreground:
rows = np.any(mask, axis=1)
cols = np.any(mask, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]
print(f"Foreground bbox: ({xmin}, {ymin}) to ({xmax}, {ymax})")
