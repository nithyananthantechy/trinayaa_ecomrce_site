import os
import pypdf

reader = pypdf.PdfReader(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1793958192398_af488d53.pdf")
os.makedirs("pdf_images", exist_ok=True)
count = 0
for i, page in enumerate(reader.pages):
    for j, img in enumerate(page.images):
        name = f"pdf_images/page_{i+1}_img_{j+1}_{img.name}"
        with open(name, "wb") as f:
            f.write(img.data)
        print("Extracted image:", name, "Size:", os.path.getsize(name))
        count += 1
print("Total images extracted:", count)
