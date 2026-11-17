from PIL import Image

im = Image.open("client/public/images/references/supplied_footer_screenshot.png")
print("Supplied footer screenshot size:", im.size)
# Let's inspect sections: it is a wide image (1916 x 365)
# Crop 4 columns to see how the client laid it out:
# Left panel: roughly 0..500
# Col 1: 500..900
# Col 2: 900..1300
# Col 3: 1300..1916
im.crop((0, 0, 500, 365)).save("client/public/images/references/footer_col_brand.png")
im.crop((500, 0, 950, 365)).save("client/public/images/references/footer_col_quick.png")
im.crop((950, 0, 1400, 365)).save("client/public/images/references/footer_col_policies.png")
im.crop((1400, 0, 1916, 365)).save("client/public/images/references/footer_col_contact.png")
print("Saved 4 footer column crops for inspection!")
