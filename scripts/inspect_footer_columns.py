import cv2
from PIL import Image

img = Image.open(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1794903384576_ec10d0da.png")
w, h = img.size
print(f"Footer Reference image size: {w}x{h}")

# Column 1: Brand, Address, Social
col1 = img.crop((0, 0, int(w * 0.28), h))
col1.save("client/public/footer_ref_col1.png")

# Column 2: Quick Links
col2 = img.crop((int(w * 0.28), 0, int(w * 0.42), h))
col2.save("client/public/footer_ref_col2.png")

# Column 3: Useful Policies
col3 = img.crop((int(w * 0.42), 0, int(w * 0.58), h))
col3.save("client/public/footer_ref_col3.png")

# Column 4: Contact Us
col4 = img.crop((int(w * 0.58), 0, int(w * 0.76), h))
col4.save("client/public/footer_ref_col4.png")

# Column 5: Erode Map Card
col5 = img.crop((int(w * 0.76), 0, w, h))
col5.save("client/public/footer_ref_col5.png")

print("Saved all 5 columns of footer reference!")
