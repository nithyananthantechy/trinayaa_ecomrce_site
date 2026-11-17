import cv2
import numpy as np

im = cv2.imread("client/public/images/erode_district_silhouette.png")
map_roi = im[10:95, 60:170]
gray = cv2.cvtColor(map_roi, cv2.COLOR_BGR2GRAY)
ret, thresh = cv2.threshold(gray, 90, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
c = sorted(contours, key=cv2.contourArea, reverse=True)[0]

epsilon = 0.004 * cv2.arcLength(c, True)
approx = cv2.approxPolyDP(c, epsilon, True)
pts = approx.reshape(-1, 2)
print("Smooth points count:", len(pts))
path_d = f"M {pts[0][0]} {pts[0][1]}"
for p in pts[1:]:
    path_d += f" L {p[0]} {p[1]}"
path_d += " Z"

# Let's normalize coordinates relative to bbox so it fits nicely in a viewBox="0 0 100 100"
xmin, ymin, w, h = cv2.boundingRect(c)
pts_norm = []
for p in pts:
    nx = round((p[0] - xmin) / w * 100, 1)
    ny = round((p[1] - ymin) / h * 100, 1)
    pts_norm.append((nx, ny))

path_norm = f"M {pts_norm[0][0]} {pts_norm[0][1]}"
for p in pts_norm[1:]:
    path_norm += f" L {p[0]} {p[1]}"
path_norm += " Z"

print("Normalized 100x100 SVG path:")
print(path_norm)

with open("client/public/images/erode_map_normalized.json", "w") as f:
    import json
    json.dump({"viewBox": "0 0 100 100", "path": path_norm, "points": pts_norm}, f, indent=2)
print("Saved erode_map_normalized.json")
