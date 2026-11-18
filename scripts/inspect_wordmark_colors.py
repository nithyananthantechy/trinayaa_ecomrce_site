import cv2
import numpy as np

tpl = cv2.imread("client/public/tpl_zoomed.png")
cur = cv2.imread("client/public/cur_zoomed.png")

# Let's see what is in tpl:
# In tpl, let's print unique colors in the region x=50..220, y=10..60
region_tpl = tpl[15:65, 55:220]
# Convert BGR to RGB
region_tpl_rgb = cv2.cvtColor(region_tpl, cv2.COLOR_BGR2RGB)

print("TPL region shape:", region_tpl.shape)
# Find dark pixels
dark_pixels = region_tpl_rgb[np.mean(region_tpl_rgb, axis=2) < 100]
print("Dark pixels count in wordmark:", len(dark_pixels))
if len(dark_pixels) > 0:
    print("Mean RGB of wordmark in template:", np.mean(dark_pixels, axis=0))
    # Median RGB
    print("Median RGB of wordmark in template:", np.median(dark_pixels, axis=0))

# In cur (current storefront)
region_cur = cur[15:65, 55:220]
region_cur_rgb = cv2.cvtColor(region_cur, cv2.COLOR_BGR2RGB)
dark_pixels_cur = region_cur_rgb[np.mean(region_cur_rgb, axis=2) < 100]
if len(dark_pixels_cur) > 0:
    print("Mean RGB of wordmark in current:", np.mean(dark_pixels_cur, axis=0))
    print("Median RGB of wordmark in current:", np.median(dark_pixels_cur, axis=0))

# Subtitle check (PURE SEEDS ...)
sub_tpl = tpl[55:80, 55:220]
sub_tpl_rgb = cv2.cvtColor(sub_tpl, cv2.COLOR_BGR2RGB)
dark_sub = sub_tpl_rgb[np.mean(sub_tpl_rgb, axis=2) < 140]
if len(dark_sub) > 0:
    print("Mean RGB of subtitle in template:", np.mean(dark_sub, axis=0))
