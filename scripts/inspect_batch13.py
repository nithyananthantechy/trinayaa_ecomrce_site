import sys
import os
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC_IMG = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded", "media_1793876677476_314bad47.jpg"
)

im = Image.open(SRC_IMG)
print("Dimensions:", im.size)

# Sample Row 1
for y in range(60, 80, 2):
    print(f"y={y}: {im.getpixel((130, y))}")

# Sample Row 2
for y in range(310, 330, 2):
    print(f"y={y}: {im.getpixel((130, y))}")

# Sample Row 3 banner & ribbon
print("--- Row 3 banner (500-550) ---")
for y in range(500, 550, 5):
    print(f"y={y}: {im.getpixel((380, y))}")

print("--- Row 3 ribbon (690-735) ---")
for y in range(690, 735, 5):
    print(f"y={y}: {im.getpixel((190, y))}")

# Sample Row 4 banner & ribbon
print("--- Row 4 banner (750-815) ---")
for y in range(750, 815, 5):
    print(f"y={y}: {im.getpixel((380, y))}")

print("--- Row 4 ribbon (940-980) ---")
for y in range(940, 980, 5):
    print(f"y={y}: {im.getpixel((190, y))}")

