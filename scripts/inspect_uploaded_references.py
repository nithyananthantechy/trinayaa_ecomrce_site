import os
from PIL import Image

images = [
    ("media_1794903304709_bc050ffd.jpg", "Image 1"),
    ("media_1794903358181_ea9934f5.jpg", "Image 2"),
    ("media_1794903372227_f5a6ed4d.jpg", "Image 3"),
    ("media_1794903384576_ec10d0da.png", "Image 4"),
    ("media_1794903405141_72868ea7.jpg", "Image 5"),
    ("media_1794903440140_a7672be9.png", "Image 6"),
    ("media_1794903459270_1be028f8.jpg", "Image 7"),
    ("media_1794903480582_012fbd42.jpg", "Image 8"),
    ("media_1794903505892_0f0df1c5.jpg", "Image 9"),
    ("media_1794903526797_3c251d9b.png", "Image 10"),
]

base_dir = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded"

for filename, label in images:
    path = os.path.join(base_dir, filename)
    if os.path.exists(path):
        img = Image.open(path)
        print(f"{label} ({filename}): {img.size}, format={img.format}, mode={img.mode}")
    else:
        print(f"{label} NOT FOUND: {path}")
