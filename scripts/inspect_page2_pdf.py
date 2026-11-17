import pypdf

reader = pypdf.PdfReader(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1793958192398_af488d53.pdf")
page2 = reader.pages[1]
print("Page 2 text:")
print(page2.extract_text())
print("Page 2 images count:", len(page2.images))
for img in page2.images:
    print("  Image name:", img.name, "len bytes:", len(img.data))
