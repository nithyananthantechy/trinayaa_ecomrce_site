import glob
import os

base = r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded"
files = glob.glob(os.path.join(base, "*"))

print(f"Total files in .user_uploaded: {len(files)}")
for f in files:
    name = os.path.basename(f)
    ext = os.path.splitext(f)[1].lower()
    if ext in [".png", ".jpg", ".jpeg"]:
        size = os.path.getsize(f)
        print(f"{name}: {size} bytes")
