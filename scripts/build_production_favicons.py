import os
import cv2
import numpy as np
from PIL import Image

def generate_favicons():
    emblem_path = os.path.abspath('client/public/images/brand/emblem_crisp.png')
    out_dir = os.path.abspath('client/public')
    
    img = Image.open(emblem_path).convert('RGBA')
    arr = np.array(img)
    
    # Isolate dark strokes of the emblem
    # arr has dark pixels where RGB < 130 and Alpha > 70
    mask = (arr[:, :, 0] < 130) & (arr[:, :, 1] < 130) & (arr[:, :, 2] < 130) & (arr[:, :, 3] > 70)
    
    ys, xs = np.where(mask)
    if len(ys) == 0 or len(xs) == 0:
        raise ValueError("Emblem mask empty!")
    
    cropped_mask = mask[ys.min():ys.max()+1, xs.min():xs.max()+1].astype(np.uint8) * 255
    h, w = cropped_mask.shape
    
    # Brand Colors
    BG_GREEN = (18, 61, 40)       # #123D28 Deep Forest Herbal Green
    GOLD_RIM = (218, 178, 77)     # #DAB24D Warm Metallic Gold
    WHITE_EMBLEM = (255, 255, 255) # Crisp White
    
    def create_badge(size, emblem_kernel_size=None, emblem_scale=0.68, border_ratio=0.045):
        # Create base canvas with transparency
        canvas = np.zeros((size, size, 4), dtype=np.uint8)
        
        # Calculate squircle radius
        radius = int(size * 0.22)
        border_thick = max(1, int(size * border_ratio))
        
        # Draw background squircle
        # To anti-alias, we can draw on a 2x or 4x canvas if needed, or directly cv2
        scale_aa = 2 if size <= 64 else 1
        s_aa = size * scale_aa
        r_aa = radius * scale_aa
        b_aa = border_thick * scale_aa
        
        big_canvas = np.zeros((s_aa, s_aa, 4), dtype=np.uint8)
        
        # Fill rounded rectangle
        # Main fill in Deep Forest Green
        # Using cv2 rounded rect drawing:
        # A rounded rect is a combination of rectangles and 4 corner circles
        # First draw the background
        cv2.rectangle(big_canvas, (r_aa, 0), (s_aa - r_aa, s_aa), (*BG_GREEN, 255), -1)
        cv2.rectangle(big_canvas, (0, r_aa), (s_aa, s_aa - r_aa), (*BG_GREEN, 255), -1)
        cv2.circle(big_canvas, (r_aa, r_aa), r_aa, (*BG_GREEN, 255), -1, cv2.LINE_AA)
        cv2.circle(big_canvas, (s_aa - r_aa, r_aa), r_aa, (*BG_GREEN, 255), -1, cv2.LINE_AA)
        cv2.circle(big_canvas, (r_aa, s_aa - r_aa), r_aa, (*BG_GREEN, 255), -1, cv2.LINE_AA)
        cv2.circle(big_canvas, (s_aa - r_aa, s_aa - r_aa), r_aa, (*BG_GREEN, 255), -1, cv2.LINE_AA)
        
        # Draw Gold border around perimeter
        # We can create a mask of the squircle, erode it by b_aa, and color the difference with GOLD_RIM
        squircle_mask = (big_canvas[:, :, 3] > 0).astype(np.uint8) * 255
        inner_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (b_aa * 2 + 1, b_aa * 2 + 1))
        inner_mask = cv2.erode(squircle_mask, inner_kernel)
        border_region = (squircle_mask > 0) & (inner_mask == 0)
        
        big_canvas[border_region, 0] = GOLD_RIM[0]
        big_canvas[border_region, 1] = GOLD_RIM[1]
        big_canvas[border_region, 2] = GOLD_RIM[2]
        big_canvas[border_region, 3] = 255
        
        # Downsample to target size
        if scale_aa > 1:
            badge = cv2.resize(big_canvas, (size, size), interpolation=cv2.INTER_AREA)
        else:
            badge = big_canvas
            
        # Prepare emblem
        processed_mask = cropped_mask.copy()
        if emblem_kernel_size and emblem_kernel_size > 1:
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (emblem_kernel_size, emblem_kernel_size))
            processed_mask = cv2.dilate(processed_mask, k, iterations=1)
            
        # Target emblem dimensions inside badge
        target_emblem_h = int(size * emblem_scale)
        target_emblem_w = int(target_emblem_h * (w / h))
        if target_emblem_w > int(size * emblem_scale):
            target_emblem_w = int(size * emblem_scale)
            target_emblem_h = int(target_emblem_w * (h / w))
            
        resized_emblem = cv2.resize(processed_mask, (target_emblem_w, target_emblem_h), interpolation=cv2.INTER_AREA)
        
        # Offset to center
        oy = (size - target_emblem_h) // 2
        ox = (size - target_emblem_w) // 2
        
        # Blend white emblem onto badge
        alpha_e = resized_emblem.astype(np.float32) / 255.0
        for c in range(3):
            badge[oy:oy+target_emblem_h, ox:ox+target_emblem_w, c] = np.clip(
                badge[oy:oy+target_emblem_h, ox:ox+target_emblem_w, c] * (1.0 - alpha_e) +
                WHITE_EMBLEM[c] * alpha_e, 0, 255
            ).astype(np.uint8)
            
        return badge

    print("Generating favicon suite...")
    
    # 1. Master 512x512
    badge_512 = create_badge(512, emblem_kernel_size=None, emblem_scale=0.68, border_ratio=0.035)
    img_512 = Image.fromarray(badge_512, mode='RGBA')
    img_512.save(os.path.join(out_dir, 'favicon_master_512.png'), optimize=True)
    print("Saved favicon_master_512.png")
    
    # 2. Android / PWA 192x192
    badge_192 = create_badge(192, emblem_kernel_size=None, emblem_scale=0.68, border_ratio=0.04)
    img_192 = Image.fromarray(badge_192, mode='RGBA')
    img_192.save(os.path.join(out_dir, 'favicon.png'), optimize=True)
    print("Saved favicon.png (192x192)")

    # 3. Apple Touch Icon 180x180
    badge_180 = create_badge(180, emblem_kernel_size=None, emblem_scale=0.68, border_ratio=0.04)
    img_180 = Image.fromarray(badge_180, mode='RGBA')
    img_180.save(os.path.join(out_dir, 'apple-touch-icon.png'), optimize=True)
    print("Saved apple-touch-icon.png (180x180)")

    # 4. Desktop 48x48
    badge_48 = create_badge(48, emblem_kernel_size=3, emblem_scale=0.70, border_ratio=0.05)
    img_48 = Image.fromarray(badge_48, mode='RGBA')
    img_48.save(os.path.join(out_dir, 'favicon-48x48.png'), optimize=True)

    # 5. Retina Tab 32x32 (Dilated kernel 4)
    badge_32 = create_badge(32, emblem_kernel_size=4, emblem_scale=0.72, border_ratio=0.06)
    img_32 = Image.fromarray(badge_32, mode='RGBA')
    img_32.save(os.path.join(out_dir, 'favicon-32x32.png'), optimize=True)
    print("Saved favicon-32x32.png")

    # 6. Standard Tab 16x16 (Dilated kernel 7 for extreme clarity at 16px)
    badge_16 = create_badge(16, emblem_kernel_size=7, emblem_scale=0.74, border_ratio=0.07)
    img_16 = Image.fromarray(badge_16, mode='RGBA')
    img_16.save(os.path.join(out_dir, 'favicon-16x16.png'), optimize=True)
    print("Saved favicon-16x16.png")

    # 7. Multi-resolution favicon.ico (16, 32, 48, 64)
    badge_64 = create_badge(64, emblem_kernel_size=2, emblem_scale=0.70, border_ratio=0.045)
    img_64 = Image.fromarray(badge_64, mode='RGBA')
    ico_path = os.path.join(out_dir, 'favicon.ico')
    img_64.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)], append_images=[img_16, img_32, img_48])
    print("Saved favicon.ico with multi-resolution frames (16, 32, 48, 64)")

    # 8. Scalable SVG with embedded crisp image and vector squircle
    import base64
    with open(os.path.join(out_dir, 'favicon_master_512.png'), 'rb') as f:
        b64_data = base64.b64encode(f.read()).decode('utf-8')
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <clipPath id="squircle">
      <rect x="0" y="0" width="512" height="512" rx="112" ry="112" />
    </clipPath>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="112" ry="112" fill="#123D28" stroke="#DAB24D" stroke-width="18" />
  <image href="data:image/png;base64,{b64_data}" x="0" y="0" width="512" height="512" clip-path="url(#squircle)" />
</svg>'''
    with open(os.path.join(out_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_content)
    print("Saved favicon.svg")

if __name__ == '__main__':
    generate_favicons()
