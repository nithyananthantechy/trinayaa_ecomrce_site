from PIL import Image
import numpy as np

im = Image.open("client/public/images/page_2_inner_crop.png")
arr = np.array(im)
# Find all unique colors and their frequency
import collections
pixels = [tuple(p) for p in arr.reshape(-1, 3)]
top = collections.Counter(pixels).most_common(15)
for col, cnt in top:
    hex_col = "#{:02X}{::02X}{:02X}".format(*col)
    print(col, hex_col, cnt)
