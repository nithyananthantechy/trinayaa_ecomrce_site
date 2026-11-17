from PIL import Image
import numpy as np

im = Image.open("client/public/images/page_2_inner_crop.png")
# Let's save a 1/2 scale image and analyze its lines
w, h = im.size
print(f"Crop size: {w}x{h}")
# Let's check non-bg pixels
arr = np.array(im)
is_dark = (arr[:,:,0] < 100) & (arr[:,:,1] < 100) & (arr[:,:,2] < 100)
print("Dark pixels:", is_dark.sum())
# Where are dark pixels?
rows = np.where(np.any(is_dark, axis=1))[0]
cols = np.where(np.any(is_dark, axis=0))[0]
print(f"Dark pixels range y: {rows[0]}..{rows[-1]}, x: {cols[0]}..{cols[-1]}")
