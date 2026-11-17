from PIL import Image
import numpy as np

im = Image.open("pdf_images/page_2_img_2_X14.png")
print("Image dimensions:", im.size)
# Let's check bounding box, colors, background
arr = np.array(im)
# Is it a map of Erode district? Let's check pixel ranges
print("Min RGB:", arr.min(axis=(0,1)))
print("Max RGB:", arr.max(axis=(0,1)))
# Let's save a thumbnail or check features
# Find colors present
unique_colors = len(np.unique(arr.reshape(-1, 3), axis=0))
print("Unique colors:", unique_colors)
