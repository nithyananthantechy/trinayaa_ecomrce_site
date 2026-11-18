import cv2
import os
from PIL import Image

base_dir = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded"

# Template
img_tpl = Image.open(os.path.join(base_dir, "media_1794903358181_ea9934f5.jpg"))
# Let's crop full header left
crop_tpl = img_tpl.crop((20, 20, 320, 120))
crop_tpl.save("client/public/logo_tpl_full.png")

# Storefront
img_cur = Image.open(os.path.join(base_dir, "media_1794903304709_bc050ffd.jpg"))
crop_cur = img_cur.crop((20, 50, 320, 150))
crop_cur.save("client/public/logo_cur_full.png")

print("Saved logo_tpl_full.png and logo_cur_full.png")
