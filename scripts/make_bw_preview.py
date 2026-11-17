from PIL import Image
import numpy as np

im = Image.open("client/public/images/page_2_inner_crop.png")
arr = np.array(im)
# background is around (255, 253, 248) and (251, 248, 240)
# Anything with R < 240, G < 240, or B < 230 is foreground
is_fg = (arr[:,:,0] < 240) | (arr[:,:,1] < 235) | (arr[:,:,2] < 225)
bw = np.full((arr.shape[0], arr.shape[1]), 255, dtype=np.uint8)
bw[is_fg] = 0
bw_im = Image.fromarray(bw)
bw_im.save("client/public/images/page_2_bw_preview.png")
print("Saved black & white preview of graphic: client/public/images/page_2_bw_preview.png")
