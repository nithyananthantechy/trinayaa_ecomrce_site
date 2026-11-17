from PIL import Image
import numpy as np

im = Image.open("client/public/images/erode_map_clean.png")
arr = np.array(im)
alpha = arr[:, :, 3] > 0

# Find bounding box of alpha
rows = np.any(alpha, axis=1)
cols = np.any(alpha, axis=0)
ymin, ymax = np.where(rows)[0][[0, -1]]
xmin, xmax = np.where(cols)[0][[0, -1]]
print(f"BBox: ({xmin}, {ymin}) to ({xmax}, {ymax}), W={xmax-xmin}, H={ymax-ymin}")

# Crop to alpha bbox
cropped_alpha = alpha[ymin:ymax+1, xmin:xmax+1]
# Save tightly cropped RGBA PNG as well
tight_rgba = arr[ymin:ymax+1, xmin:xmax+1]
tight_im = Image.fromarray(tight_rgba)
tight_im.save("client/public/images/erode_map_district_tight.png")
print("Saved tight crop:", tight_im.size)
