from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
print("Size:", im.size, "Mode:", im.mode)
# Copy it to client/public/images/erode_district_map.png so we can use it and inspect it!
import shutil, os
os.makedirs("client/public/images", exist_ok=True)
shutil.copyfile("pdf_images/page_2_img_2_X14.png", "client/public/images/erode_district_map_raw.png")
print("Copied to client/public/images/erode_district_map_raw.png")
