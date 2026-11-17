from PIL import Image
import numpy as np

im = Image.open("client/public/images/references/supplied_erode_map.png")
cropped = im.crop((70, 110, 620, 570))
cropped.save("client/public/images/erode_map_district_crop.png")
print("Saved cropped district map: size", cropped.size)

# Also let's inspect the cropped image values
arr = np.array(cropped)
print("Crop shape:", arr.shape)
# Find what colors are inside
bg = np.array([255, 253, 248])
diff = np.abs(arr - bg).sum(axis=-1)
print("Total non-bg pixels in crop:", (diff > 25).sum())
