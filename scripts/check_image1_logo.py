import cv2
import numpy as np

img1 = cv2.imread(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1794903304709_bc050ffd.jpg")
crop1 = img1[60:140, 50:280]
crop1_rgb = cv2.cvtColor(crop1, cv2.COLOR_BGR2RGB)

wordmark_area = crop1_rgb[15:55, 45:220]
brightness = np.mean(wordmark_area, axis=2)
darkest = wordmark_area[brightness < 120]
print("Darkest in Image 1 count:", len(darkest))
if len(darkest) > 0:
    print("Mean RGB Image 1:", np.mean(darkest, axis=0))
    print("Sample RGB Image 1:", darkest[:10])
