import cv2
import numpy as np

# Load the cropped map silhouette
im = cv2.imread("client/public/images/erode_district_silhouette.png")
# We want the map part on the right (x from approx 50 to 170, y from 10 to 95)
map_roi = im[10:95, 60:170]
gray = cv2.cvtColor(map_roi, cv2.COLOR_BGR2GRAY)

# Find edges or threshold
# In the original footer screenshot, the background was dark green (#123D28, gray ~50)
# and the map was light/white/ivory (gray ~180..255)
ret, thresh = cv2.threshold(gray, 90, 255, cv2.THRESH_BINARY)

contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
print(f"Found {len(contours)} contours in map region")
contours = sorted(contours, key=cv2.contourArea, reverse=True)

if contours:
    c = contours[0]
    print(f"Main map contour area: {cv2.contourArea(c)}, bbox: {cv2.boundingRect(c)}")
    # Simplify contour slightly for a crisp vector path
    epsilon = 0.015 * cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, epsilon, True)
    print(f"Points: {len(c)} -> {len(approx)}")
    pts = approx.reshape(-1, 2)
    path_d = f"M {pts[0][0]} {pts[0][1]}"
    for p in pts[1:]:
        path_d += f" L {p[0]} {p[1]}"
    path_d += " Z"
    print("SVG Path:", path_d)
    
    # Save test SVG
    w, h = map_roi.shape[1], map_roi.shape[0]
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><path d="{path_d}" fill="#123D28" stroke="#123D28" stroke-width="1.5"/></svg>'
    with open("client/public/images/erode_silhouette_test.svg", "w") as f:
        f.write(svg)
    print(f"Saved test SVG to client/public/images/erode_silhouette_test.svg (viewBox 0 0 {w} {h})")
