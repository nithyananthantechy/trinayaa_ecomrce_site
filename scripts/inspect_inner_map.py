from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
# Let's inspect what colors exist in the inner region
inner = im.crop((50, 50, 680, 730))
arr = np.array(inner)
# Print common RGB colors in the inner area
import collections
pixels = [tuple(p) for p in arr.reshape(-1, 3)]
counts = collections.Counter(pixels).most_common(20)
for col, cnt in counts:
    print(col, cnt)
