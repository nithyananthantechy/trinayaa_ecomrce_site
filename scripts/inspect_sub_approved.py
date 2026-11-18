import cv2
import numpy as np

img2 = cv2.imread(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1794903358181_ea9934f5.jpg")
# Crop logo closely
logo = img2[45:95, 60:240]
cv2.imwrite("client/public/logo_approved_tight.png", logo)

# Let's inspect the subtitle
sub = logo[28:48, 48:175]
cv2.imwrite("client/public/sub_approved_tight.png", sub)

# Threshold to see characters clearly
sub_gray = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(sub_gray, 180, 255, cv2.THRESH_BINARY_INV)
cv2.imwrite("client/public/sub_thresh.png", thresh)
print("Sub threshold saved.")
