import cv2
import numpy as np

sub = cv2.imread("client/public/sub_approved_tight.png")
# Let's inspect the first 15 pixels and last 15 pixels of the subtitle
print("Sub width:", sub.shape[1], "height:", sub.shape[0])

# In sub, let's see what is drawn on the far left before 'PURE' and far right after 'HERBS'
# Save high-res zoom
zoom = cv2.resize(sub, (sub.shape[1] * 8, sub.shape[0] * 8), interpolation=cv2.INTER_NEAREST)
cv2.imwrite("client/public/sub_8x.png", zoom)
print("Saved sub_8x.png")
