import os
import sys
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC_IMG = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded", "media_1793879124082_6a58c480.jpg"
)

im = Image.open(SRC_IMG)

# Photo 1: (12, 50, 753, 435)
crop1 = im.crop((12, 50, 753, 435))
print("Crop 1 size:", crop1.size)

# Photo 2: (12, 575, 753, 945)
crop2 = im.crop((12, 575, 753, 945))
print("Crop 2 size:", crop2.size)

# Let's check top and bottom rows of pixels for crop 1
print("Crop 1 top row avg:", crop1.getpixel((370, 0)))
print("Crop 1 bottom row avg:", crop1.getpixel((370, crop1.height - 1)))

# Let's check top and bottom rows of pixels for crop 2
print("Crop 2 top row avg:", crop2.getpixel((370, 0)))
print("Crop 2 bottom row avg:", crop2.getpixel((370, crop2.height - 1)))

