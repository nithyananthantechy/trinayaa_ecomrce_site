import cv2
import numpy as np
from PIL import Image

# Read image 2 (approved template)
img = cv2.imread(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1794903358181_ea9934f5.jpg")

# The logo in Image 2 is on top left: x ~50..250, y ~30..90
# Let's crop x: 50 to 280, y: 30 to 110
crop = img[30:110, 50:280]
cv2.imwrite("client/public/test_approved_logo_exact.png", crop)

# Let's inspect the RGB of the TRINAYAA letters:
# Let's convert to RGB
crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)

# Find darkest pixels in the wordmark region
wordmark_area = crop_rgb[15:55, 45:220]
# Calculate brightness
brightness = np.mean(wordmark_area, axis=2)
darkest = wordmark_area[brightness < 100]
print("Darkest pixels count in wordmark:", len(darkest))
if len(darkest) > 0:
    print("Mean RGB:", np.mean(darkest, axis=0))
    print("Sample RGB values:", darkest[:10])

# Subtitle area
subtitle_area = crop_rgb[55:75, 45:220]
brightness_sub = np.mean(subtitle_area, axis=2)
darkest_sub = subtitle_area[brightness_sub < 150]
print("Darkest pixels in subtitle:", len(darkest_sub))
if len(darkest_sub) > 0:
    print("Mean subtitle RGB:", np.mean(darkest_sub, axis=0))
    print("Sample subtitle RGB:", darkest_sub[:10])
