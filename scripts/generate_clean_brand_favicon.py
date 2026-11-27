import os
import cv2
import numpy as np
from PIL import Image
import base64

def generate_clean_favicons():
    # Source is the high-res authentic TRINAYAA emblem
    emblem_path = os.path.abspath('client/public/images/brand/emblem_crisp.png')
    client_public = os.path.abspath('client/public')
    dist_public = os.path.abspath('dist/public')
    
    src = Image.open(emblem_path).convert('RGBA')
    arr = np.array(src)
    
    # Crop tight to the emblem content
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 10)
    tight_arr = arr[ys.min():ys.max()+1, xs.min():xs.max()+1]
    th, tw = tight_arr.shape[:2]
    
    # Create master square canvas (512x512)
    def make_canvas(size, add_subtle_halo=True):
        # Calculate emblem size to fit inside square canvas with nice padding (approx 90% of canvas)
        pad_ratio = 0.90 if size >= 64 else 0.94
        target_h = int(size * pad_ratio)
        target_w = int(target_h * (tw / th))
        if target_w > int(size * pad_ratio):
            target_w = int(size * pad_ratio)
            target_h = int(target_w * (th / tw))
            
        resized = cv2.resize(tight_arr, (target_w, target_h), interpolation=cv2.INTER_AREA)
        
        # Center in square canvas
        canvas = np.zeros((size, size, 4), dtype=np.uint8)
        oy = (size - target_h) // 2
        ox = (size - target_w) // 2
        
        # If adding subtle halo for contrast on dark browser tabs:
        if add_subtle_halo:
            r_alpha = resized[:, :, 3]
            # Kernel size depends on canvas size
            k_size = 5 if size >= 128 else (3 if size >= 32 else 3)
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
            dilated = cv2.dilate(r_alpha, kernel, iterations=1)
            
            # Create a soft white/cream halo (alpha ~140) behind the emblem
            halo_canvas = np.zeros((size, size, 4), dtype=np.uint8)
            halo_canvas[oy:oy+target_h, ox:ox+target_w, 0] = 255
            halo_canvas[oy:oy+target_h, ox:ox+target_w, 1] = 253
            halo_canvas[oy:oy+target_h, ox:ox+target_w, 2] = 247
            halo_canvas[oy:oy+target_h, ox:ox+target_w, 3] = (dilated.astype(np.float32) * 0.45).astype(np.uint8)
            
            # Blend emblem over halo
            c_pil = Image.fromarray(halo_canvas)
            e_pil = Image.fromarray(resized)
            c_pil.paste(e_pil, (ox, oy), e_pil)
            return np.array(c_pil)
        else:
            canvas[oy:oy+target_h, ox:ox+target_w] = resized
            return canvas

    print("Generating transparent brand emblem favicons...")
    
    # 1. Master 512x512
    badge_512 = make_canvas(512, add_subtle_halo=True)
    img_512 = Image.fromarray(badge_512)
    
    # 2. 192x192 (PWA / Android)
    badge_192 = make_canvas(192, add_subtle_halo=True)
    img_192 = Image.fromarray(badge_192)
    
    # 3. 180x180 (Apple touch icon - note: Apple touch icon often looks best on solid off-white background, or transparent)
    # Apple Touch icon specification: iOS displays transparent areas as black if not opaque,
    # so we provide a luxurious cream background (#FFFDF7) with the emblem centered for Apple
    apple_canvas = Image.new('RGBA', (180, 180), (255, 253, 247, 255))
    apple_emblem = Image.fromarray(make_canvas(180, add_subtle_halo=False))
    apple_canvas.paste(apple_emblem, (0, 0), apple_emblem)
    
    # 4. 64x64
    badge_64 = make_canvas(64, add_subtle_halo=True)
    img_64 = Image.fromarray(badge_64)

    # 5. 48x48
    badge_48 = make_canvas(48, add_subtle_halo=True)
    img_48 = Image.fromarray(badge_48)

    # 6. 32x32
    badge_32 = make_canvas(32, add_subtle_halo=True)
    img_32 = Image.fromarray(badge_32)

    # 7. 16x16
    badge_16 = make_canvas(16, add_subtle_halo=True)
    img_16 = Image.fromarray(badge_16)

    # 8. Scalable SVG with embedded crisp master PNG (fully transparent background, NO green box)
    import io
    buffered = io.BytesIO()
    img_512.save(buffered, format="PNG")
    b64_data = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_data}" x="0" y="0" width="512" height="512" />
</svg>'''

    for target_dir in [client_public, dist_public]:
        os.makedirs(target_dir, exist_ok=True)
        img_512.save(os.path.join(target_dir, 'favicon_master_512.png'), optimize=True)
        img_192.save(os.path.join(target_dir, 'favicon.png'), optimize=True)
        apple_canvas.save(os.path.join(target_dir, 'apple-touch-icon.png'), optimize=True)
        img_48.save(os.path.join(target_dir, 'favicon-48x48.png'), optimize=True)
        img_32.save(os.path.join(target_dir, 'favicon-32x32.png'), optimize=True)
        img_16.save(os.path.join(target_dir, 'favicon-16x16.png'), optimize=True)
        
        ico_path = os.path.join(target_dir, 'favicon.ico')
        img_64.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)], append_images=[img_16, img_32, img_48])
        
        with open(os.path.join(target_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_content)
            
        print(f"Saved complete favicon suite to {target_dir}")

if __name__ == '__main__':
    generate_clean_favicons()

