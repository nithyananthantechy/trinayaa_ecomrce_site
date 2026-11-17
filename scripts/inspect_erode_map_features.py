from PIL import Image
import numpy as np

im = Image.open("client/public/images/references/supplied_erode_map.png")
print("Size:", im.size)
arr = np.array(im)

# Let's find out what features are inside the image
# Let's check non-white pixels
# What are the dominant non-white colors?
non_white = arr[(arr[:,:,0] < 240) | (arr[:,:,1] < 240) | (arr[:,:,2] < 240)]
print("Total non-white pixels:", len(non_white))
# Histogram of non-white pixels
import collections
cols = [tuple(p) for p in non_white]
top = collections.Counter(cols).most_common(10)
for c, count in top:
    print(c, count)
