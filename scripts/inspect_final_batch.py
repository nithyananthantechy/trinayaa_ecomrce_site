import sys
import os
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC_IMG = os.path.join(
    os.path.expanduser("~"),
    ".gemini", "antigravity", "brain",
    "34975747-e24c-4255-9bf1-e062de239868",
    ".user_uploaded", "media_1793879124082_6a58c480.jpg"
)

im = Image.open(SRC_IMG)
print("Dimensions:", im.size)

# Photo 1 (Item 161)
# Top header "HEALTH & CULINARY"
print("--- Top header (y=0 to 60, x=380) ---")
for y in range(0, 60, 5):
    print(f"y={y}: {im.getpixel((380, y))}")

# Check when Photo 1 starts (y=30 to 80, x=380 and x=200)
print("--- Photo 1 start (y=25 to 65, x=200) ---")
for y in range(25, 65, 5):
    print(f"y={y}: {im.getpixel((200, y))}")

# Bottom ribbon of Photo 1 (around y=400 to 520)
print("--- Photo 1 bottom ribbon (y=400 to 510, x=380) ---")
for y in range(400, 510, 10):
    print(f"y={y}: {im.getpixel((380, y))}")

# Top ribbon of Photo 2 (around y=490 to 560, x=380)
print("--- Photo 2 top ribbon (y=500 to 570, x=380) ---")
for y in range(500, 570, 5):
    print(f"y={y}: {im.getpixel((380, y))}")

# Photo 2 start (x=200)
print("--- Photo 2 start (y=540 to 580, x=200) ---")
for y in range(540, 580, 5):
    print(f"y={y}: {im.getpixel((200, y))}")

# Photo 2 bottom ribbon (y=900 to 1024, x=380)
print("--- Photo 2 bottom ribbon (y=900 to 1024, x=380) ---")
for y in range(900, 1024, 10):
    print(f"y={y}: {im.getpixel((380, y))}")

