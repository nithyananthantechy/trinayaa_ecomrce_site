from PIL import Image

im = Image.open("client/public/images/page_2_contact_section.png")
w, h = im.size
print("Size:", w, h)
# Lines 17-25 corresponds to y from roughly 180 to 290, and x from roughly 200 to 600
crop_graphic = im.crop((250, 150, 680, 290))
crop_graphic.save("client/public/images/erode_map_in_footer.png")
print("Saved erode_map_in_footer.png: size", crop_graphic.size)
