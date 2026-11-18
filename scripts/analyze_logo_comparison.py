import cv2
import numpy as np

tpl = cv2.imread("client/public/logo_tpl_4x.png")
cur = cv2.imread("client/public/logo_cur_4x.png")

# Let's inspect the wordmark letters:
# In tpl:
# Emblem is on the left
# TRINAYAA text:
# Let's see the text in tpl vs cur:
# Where does TRINAYAA start and end in x and y?
print("TPL shape:", tpl.shape)

# Let's look at the color of TRINAYAA in TPL:
# Let's find the RGB of the darkest strokes of the letters
# In BGR:
tpl_rgb = cv2.cvtColor(tpl, cv2.COLOR_BGR2RGB)
cur_rgb = cv2.cvtColor(cur, cv2.COLOR_BGR2RGB)

# Let's find min RGB in the wordmark region (x from 250 to 900, y from 60 to 220)
tpl_wordmark = tpl_rgb[70:220, 260:1000]
cur_wordmark = cur_rgb[70:220, 260:1000]

print("Tpl wordmark min RGB:", np.min(tpl_wordmark, axis=(0,1)))
# Sample pixels where brightness is lowest
mask_tpl_dark = np.sum(tpl_wordmark, axis=2) < 250
if np.any(mask_tpl_dark):
    dark_vals = tpl_wordmark[mask_tpl_dark]
    print("Tpl letter dark pixels count:", len(dark_vals))
    print("Tpl median letter RGB:", np.median(dark_vals, axis=0))

mask_cur_dark = np.sum(cur_wordmark, axis=2) < 250
if np.any(mask_cur_dark):
    dark_vals_cur = cur_wordmark[mask_cur_dark]
    print("Cur letter dark pixels count:", len(dark_vals_cur))
    print("Cur median letter RGB:", np.median(dark_vals_cur, axis=0))

# Subtitle region (y from 220 to 320, x from 260 to 1000)
tpl_sub = tpl_rgb[220:310, 260:1000]
cur_sub = cur_rgb[220:310, 260:1000]

mask_tpl_sub = np.sum(tpl_sub, axis=2) < 350
if np.any(mask_tpl_sub):
    print("Tpl median subtitle RGB:", np.median(tpl_sub[mask_tpl_sub], axis=0))

mask_cur_sub = np.sum(cur_sub, axis=2) < 350
if np.any(mask_cur_sub):
    print("Cur median subtitle RGB:", np.median(cur_sub[mask_cur_sub], axis=0))
