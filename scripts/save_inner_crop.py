from PIL import Image

im = Image.open("pdf_images/page_2_img_2_X14.png")
c = im.crop((50, 50, 680, 670))
c.save("client/public/images/page_2_inner_crop.png")
print("Saved inner crop: size", c.size)
