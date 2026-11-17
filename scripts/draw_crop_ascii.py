from PIL import Image
import numpy as np

im = Image.open("client/public/images/erode_map_district_crop.png")
thumb = im.resize((60, 30))
arr = np.array(thumb)
bg = np.array([255, 253, 248])
diff = np.abs(arr - bg).sum(axis=-1)
for row in diff:
    print("".join(["#" if v > 20 else " " for v in row]))
