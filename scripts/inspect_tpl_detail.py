from PIL import Image
import numpy as np

# Let's inspect the subtitle left and right ends in tpl_crop
tpl = Image.open("client/public/logo_tpl_4x.png")
# Subtitle is at y ~220..310
# Let's crop subtitle specifically
sub = tpl.crop((230, 230, 950, 310))
sub.save("client/public/sub_tpl_detail.png")

# Let's also crop wordmark
wordmark = tpl.crop((230, 80, 950, 220))
wordmark.save("client/public/wordmark_tpl_detail.png")

print("Saved sub_tpl_detail.png and wordmark_tpl_detail.png")
