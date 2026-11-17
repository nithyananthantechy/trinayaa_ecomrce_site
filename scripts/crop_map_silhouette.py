from PIL import Image

im = Image.open("client/public/images/erode_map_in_footer.png")
map_silhouette = im.crop((260, 25, 430, 135))
map_silhouette.save("client/public/images/erode_district_silhouette.png")
print("Saved map silhouette: size", map_silhouette.size)
