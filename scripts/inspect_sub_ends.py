import cv2
import numpy as np

sub = cv2.imread("client/public/sub_approved_tight.png")
# Subtitle shape
print("Sub shape:", sub.shape)

# Let's check left side (first 25 cols) and right side (last 25 cols)
left_end = sub[:, :25]
right_end = sub[:, -25:]

# Find green or colored pixels in left and right ends:
left_rgb = cv2.cvtColor(left_end, cv2.COLOR_BGR2RGB)
right_rgb = cv2.cvtColor(right_end, cv2.COLOR_BGR2RGB)

print("Left end min RGB:", np.min(left_rgb, axis=(0,1)))
print("Right end min RGB:", np.min(right_rgb, axis=(0,1)))

# Let's save zoomed in left and right
cv2.imwrite("client/public/sub_left.png", cv2.resize(left_end, (250, 200), interpolation=cv2.INTER_NEAREST))
cv2.imwrite("client/public/sub_right.png", cv2.resize(right_end, (250, 200), interpolation=cv2.INTER_NEAREST))
print("Saved sub_left.png and sub_right.png")
