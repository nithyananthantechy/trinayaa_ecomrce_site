from PIL import Image
import numpy as np

im = Image.open("client/public/images/page_2_inner_crop.png")
arr = np.array(im)

# background is > 245 in all channels
is_bg = (arr[:,:,0] > 245) & (arr[:,:,1] > 242) & (arr[:,:,2] > 235)

# Create a clean RGBA image
rgba = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
# non-bg pixels get original RGB and alpha 255
rgba[~is_bg] = np.concatenate([arr[~is_bg], np.full(((~is_bg).sum(), 1), 255, dtype=np.uint8)], axis=-1)

clean_im = Image.fromarray(rgba)
clean_im.save("client/public/images/erode_map_clean.png")
print("Saved clean erode map with transparent background! Total non-bg pixels:", (~is_bg).sum())
