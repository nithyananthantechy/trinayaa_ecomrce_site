from PIL import Image
import numpy as np

im = Image.open("client/public/images/references/supplied_erode_map.png")
arr = np.array(im)

# Let's inspect coordinates of pixels close to [18, 61, 40]
green_mask = (np.abs(arr[:,:,0] - 18) < 10) & (np.abs(arr[:,:,1] - 61) < 10) & (np.abs(arr[:,:,2] - 40) < 10)
print("Green pixels count:", green_mask.sum())
if np.any(green_mask):
    ymin, ymax = np.where(np.any(green_mask, axis=1))[0][[0, -1]]
    xmin, xmax = np.where(np.any(green_mask, axis=0))[0][[0, -1]]
    print(f"Green bbox: x={xmin}..{xmax}, y={ymin}..{ymax}")

# Let's inspect coordinates of pixels close to [140, 150, 141]
gray_mask = (np.abs(arr[:,:,0] - 140) < 20) & (np.abs(arr[:,:,1] - 150) < 20) & (np.abs(arr[:,:,2] - 141) < 20)
print("Gray/Sage pixels count:", gray_mask.sum())
if np.any(gray_mask):
    ymin, ymax = np.where(np.any(gray_mask, axis=1))[0][[0, -1]]
    xmin, xmax = np.where(np.any(gray_mask, axis=0))[0][[0, -1]]
    print(f"Gray/Sage bbox: x={xmin}..{xmax}, y={ymin}..{ymax}")
