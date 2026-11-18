from PIL import Image

# Let's inspect the dimensions and pixels
tpl = Image.open("client/public/logo_tpl_full.png")
cur = Image.open("client/public/logo_cur_full.png")

print("Tpl size:", tpl.size)
print("Cur size:", cur.size)

# Let's save a 4x scaled version of both to inspect visually
tpl.resize((tpl.width * 4, tpl.height * 4), Image.Resampling.LANCZOS).save("client/public/logo_tpl_4x.png")
cur.resize((cur.width * 4, cur.height * 4), Image.Resampling.LANCZOS).save("client/public/logo_cur_4x.png")

# Also let's inspect the footer reference (Image 4: media_1794903384576_ec10d0da.png)
footer = Image.open("client/public/footer_reference_full.png")
footer.resize((footer.width * 2, footer.height * 2), Image.Resampling.LANCZOS).save("client/public/footer_reference_2x.png")

print("Saved logo_tpl_4x.png, logo_cur_4x.png, and footer_reference_2x.png")
