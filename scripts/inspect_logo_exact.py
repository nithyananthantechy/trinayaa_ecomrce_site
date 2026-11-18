import cv2
import numpy as np

# Load template logo
img_tpl = cv2.imread("client/public/logo_approved_template_crop.png")
# Load current storefront logo
img_cur = cv2.imread("client/public/logo_current_storefront_crop.png")

# Let's inspect the text color of "TRINAYAA" in the template
# In template crop, let's find the non-white pixels
# In img_tpl (RGB):
# Let's convert to RGB
img_tpl_rgb = cv2.cvtColor(img_tpl, cv2.COLOR_BGR2RGB)
img_cur_rgb = cv2.cvtColor(img_cur, cv2.COLOR_BGR2RGB)

print("Template Crop Shape:", img_tpl.shape)
print("Storefront Crop Shape:", img_cur.shape)

# Find coordinates of darkest pixels in template
dark_mask = (img_tpl_rgb[:, :, 0] < 150) & (img_tpl_rgb[:, :, 1] < 80) & (img_tpl_rgb[:, :, 2] < 80)
ys, xs = np.where(dark_mask)
if len(ys) > 0:
    print(f"Template dark red pixels found: {len(ys)} pixels")
    print(f"Sample template red color (RGB): {img_tpl_rgb[ys[0], xs[0]]}")
    # Average color of TRINAYAA letters:
    avg_col = np.mean(img_tpl_rgb[dark_mask], axis=0)
    print("Average color of wordmark (RGB):", avg_col)

# Also check green pixels in template (tagline or emblem)
green_mask = (img_tpl_rgb[:, :, 1] > img_tpl_rgb[:, :, 0] + 20) & (img_tpl_rgb[:, :, 1] > img_tpl_rgb[:, :, 2] + 20)
y_g, x_g = np.where(green_mask)
if len(y_g) > 0:
    avg_green = np.mean(img_tpl_rgb[green_mask], axis=0)
    print("Average green in template (RGB):", avg_green)

# Let's save a clean zoomed-in comparison
cv2.imwrite("client/public/tpl_zoomed.png", img_tpl)
cv2.imwrite("client/public/cur_zoomed.png", img_cur)
print("Zoomed crops saved.")
