import os
import pypdf # or let's check what libraries are available

try:
    import pypdf
    reader = pypdf.PdfReader(r"C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.user_uploaded\media_1793958192398_af488d53.pdf")
    print("PDF pages:", len(reader.pages))
    text = ""
    for i, page in enumerate(reader.pages):
        text += f"\n--- Page {i+1} ---\n" + page.extract_text()
    with open("pdf_extracted.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Saved extracted PDF text (len:", len(text), ")")
    # Search for footer, erode, map, packaging
    for w in ['footer', 'erode', 'map', 'packaging', 'kraft']:
        print(f"Occurrences of '{w}':", text.lower().count(w))
except Exception as e:
    print("Error:", e)
