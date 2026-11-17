import sys
import os
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC_IMG = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded", "media_1793877704256_ca196056.jpg"
)

im = Image.open(SRC_IMG)
print("Dimensions:", im.size)

# Check Row 1 ribbon end (x=130, y=60 to 80)
print("--- Row 1 ribbon end ---")
for y in range(60, 80, 2):
    print(f"y={y}: {im.getpixel((130, y))}")

# Check Row 2 ribbon end (x=130, y=310 to 330)
print("--- Row 2 ribbon end ---")
for y in range(310, 330, 2):
    print(f"y={y}: {im.getpixel((130, y))}")

# Check between Row 2 and Row 3 (y=500 to 550, x=380)
print("--- Between Row 2 and Row 3 ---")
for y in range(500, 550, 5):
    print(f"y={y}: {im.getpixel((380, y))}")

# Check Row 3 ribbon (y=690 to 735, x=200)
print("--- Row 3 ribbon ---")
for y in range(690, 735, 5):
    print(f"y={y}: {im.getpixel((200, y))}")

# Check between Row 3 and Row 4: Is there a banner?
print("--- Between Row 3 and Row 4 (y=750 to 815, x=380) ---")
for y in range(750, 815, 5):
    print(f"y={y}: {im.getpixel((380, y))}")

# Check Row 4 ribbon (y=940 to 980, x=200)
print("--- Row 4 ribbon ---")
for y in range(940, 980, 5):
    print(f"y={y}: {im.getpixel((200, y))}")

