import cv2
import numpy as np

# Let's inspect the colors and fonts of the text in Reference 4
# Column 1
col1 = cv2.imread("client/public/footer_ref_col1.png")
col2 = cv2.imread("client/public/footer_ref_col2.png")
col3 = cv2.imread("client/public/footer_ref_col3.png")
col4 = cv2.imread("client/public/footer_ref_col4.png")
col5 = cv2.imread("client/public/footer_ref_col5.png")

# Background color of the footer in Reference 4:
# Sample top-left corner
bg_bgr = col1[10, 10]
bg_rgb = [int(bg_bgr[2]), int(bg_bgr[1]), int(bg_bgr[0])]
print(f"Footer background color in Reference 4 (RGB): {bg_rgb}, Hex: #{bg_rgb[0]:02X}{bg_rgb[1]:02X}{bg_rgb[2]:02X}")

# Text color in Quick Links / Contact Us:
# Find dark pixels in col2 (Quick links text)
col2_rgb = cv2.cvtColor(col2, cv2.COLOR_BGR2RGB)
dark_text = col2_rgb[np.mean(col2_rgb, axis=2) < 100]
if len(dark_text) > 0:
    median_dark = np.median(dark_text, axis=0).astype(int)
    print(f"Text color in Reference 4 (RGB): {list(median_dark)}, Hex: #{median_dark[0]:02X}{median_dark[1]:02X}{median_dark[2]:02X}")

# Check the logo in col1 of the footer reference:
col1_rgb = cv2.cvtColor(col1, cv2.COLOR_BGR2RGB)
# Sample wordmark in footer
col1_logo_area = col1_rgb[20:70, 50:250]
logo_dark = col1_logo_area[np.mean(col1_logo_area, axis=2) < 120]
if len(logo_dark) > 0:
    median_logo = np.median(logo_dark, axis=0).astype(int)
    print(f"Footer Logo wordmark color in Reference 4 (RGB): {list(median_logo)}, Hex: #{median_logo[0]:02X}{median_logo[1]:02X}{median_logo[2]:02X}")
