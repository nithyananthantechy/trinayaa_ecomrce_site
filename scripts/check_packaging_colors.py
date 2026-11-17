from PIL import Image
import numpy as np

for f in ["client/public/images/products/packaged/photoshoot_amla_powder.png", "client/public/images/products/packaged/trn-1001.jpg"]:
    try:
        im = Image.open(f)
        arr = np.array(im)
        print(f, im.size)
        # get dominant colors
        # sample some pixels
        flat = arr.reshape(-1, arr.shape[-1])
        print("Mean:", flat.mean(axis=0).astype(int))
    except Exception as e:
        print("Err:", e)
