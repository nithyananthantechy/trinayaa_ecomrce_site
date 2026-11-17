from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
# Let's save a clear slice or inspect it
print("Image mode:", im.mode, "size:", im.size)
# Let's check pixel values along vertical line x = 368
col = [tuple(im.getpixel((368, y))) for y in range(0, im.height, 20)]
print("Vertical line sample at x=368:")
for y, c in zip(range(0, im.height, 20), col):
    if c != (255, 253, 248):
        print(f"y={y}: {c}")
