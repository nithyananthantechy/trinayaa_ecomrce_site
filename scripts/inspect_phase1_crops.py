import os
from PIL import Image

base_dir = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded"

# 1. Client-approved template logo crop (Image 2: media_1794903358181_ea9934f5.jpg)
img2 = Image.open(os.path.join(base_dir, "media_1794903358181_ea9934f5.jpg"))
# Header is in top ~15%
w, h = img2.size
# Logo is roughly x: 30..250, y: 15..95
logo2 = img2.crop((30, 15, 260, 105))
logo2.save("client/public/logo_approved_template_crop.png")

# 2. Current storefront logo crop (Image 1: media_1794903304709_bc050ffd.jpg)
img1 = Image.open(os.path.join(base_dir, "media_1794903304709_bc050ffd.jpg"))
logo1 = img1.crop((30, 50, 260, 140))
logo1.save("client/public/logo_current_storefront_crop.png")

# 3. Footer crop (Image 4: media_1794903384576_ec10d0da.png)
img4 = Image.open(os.path.join(base_dir, "media_1794903384576_ec10d0da.png"))
img4.save("client/public/footer_reference_full.png")

print("Crops saved successfully!")
