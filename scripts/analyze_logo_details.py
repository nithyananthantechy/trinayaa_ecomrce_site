import os
import cv2
import numpy as np

img2 = cv2.imread("client/public/logo_approved_template_crop.png")
img1 = cv2.imread("client/public/logo_current_storefront_crop.png")

print(f"Template crop shape: {img2.shape}")
print(f"Storefront crop shape: {img1.shape}")

# Let's inspect where the logo components are located and their colors
# Let's see average colors or specific text colors in the wordmark
# In img2 (template):
# TRINAYAA wordmark color:
# Let's sample the letters
# In BGR:
# Let's find dominant dark colors
# Storefront vs Template
