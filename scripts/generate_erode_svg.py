import cv2
import numpy as np

# Load tight map
im = cv2.imread("client/public/images/erode_map_district_tight.png", cv2.IMREAD_UNCHANGED)
alpha = im[:, :, 3]
# Threshold alpha
ret, thresh = cv2.threshold(alpha, 127, 255, 0)
contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

print(f"Total external contours found: {len(contours)}")
# Sort by area descending
contours = sorted(contours, key=cv2.contourArea, reverse=True)
for i, c in enumerate(contours[:5]):
    area = cv2.contourArea(c)
    x, y, w, h = cv2.boundingRect(c)
    print(f"Contour {i}: Area={area:.1f}, BoundingRect=({x}, {y}, {w}, {h})")

# Let's take the largest contour, approximate polygon to simplify, and generate an SVG path!
if contours:
    main_contour = contours[0]
    # Simplify contour slightly for clean SVG path
    epsilon = 0.003 * cv2.arcLength(main_contour, True)
    approx = cv2.approxPolyDP(main_contour, epsilon, True)
    print(f"Main contour points: {len(main_contour)} -> simplified: {len(approx)}")

    # Generate SVG path string
    points = approx.reshape(-1, 2)
    path_d = f"M {points[0][0]} {points[0][1]}"
    for pt in points[1:]:
        path_d += f" L {pt[0]} {pt[1]}"
    path_d += " Z"
    
    # Save SVG
    w_box = im.shape[1]
    h_box = im.shape[0]
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w_box} {h_box}" fill="currentColor" className="erode-district-map">
  <path d="{path_d}" />
</svg>'''
    with open("client/public/images/erode_district_map.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Wrote SVG to client/public/images/erode_district_map.svg (viewBox: 0 0 {w_box} {h_box})")
    
    # Also save path_d to a js/ts file or json
    with open("client/src/components/erodeMapPath.json", "w", encoding="utf-8") as f:
        import json
        json.dump({"viewBox": f"0 0 {w_box} {h_box}", "path": path_d, "width": w_box, "height": h_box}, f, indent=2)
    print("Saved erodeMapPath.json")
