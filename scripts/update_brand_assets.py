import os
import numpy as np
from PIL import Image

p1 = r"C:\Users\Foxle\.gemini\antigravity-ide\brain\89eca043-6500-447b-ade7-3b302beebf3d\.user_uploaded\media_1789787970966.jpg"
p2 = r"C:\Users\Foxle\.gemini\antigravity-ide\brain\89eca043-6500-447b-ade7-3b302beebf3d\.user_uploaded\media_1789787992780.jpg"

web_public = r"c:\Users\Foxle\Downloads\twinth.ink\apps\web\public"
web_app = r"c:\Users\Foxle\Downloads\twinth.ink\apps\web\src\app"

# ==========================================
# 1. PROCESS FAVICON / APP ICON (Image 1)
# ==========================================
im1 = Image.open(p1)
arr1 = np.array(im1)

# Circle center and radius from measurement
cx, cy = 510.5, 257.0
radius = 162.5
box_size = 330
half = box_size / 2.0

x0 = int(round(cx - half))
y0 = int(round(cy - half))

crop1 = arr1[y0:y0+box_size, x0:x0+box_size].copy()

# Make circular anti-aliased RGBA icon
rgba1 = np.zeros((box_size, box_size, 4), dtype=np.uint8)
rgba1[:, :, :3] = crop1

y_grid, x_grid = np.ogrid[:box_size, :box_size]
dist = np.sqrt((x_grid - half)**2 + (y_grid - half)**2)
alpha1 = np.clip((radius + 1.0 - dist) / 2.0, 0.0, 1.0) * 255.0
rgba1[:, :, 3] = alpha1.astype(np.uint8)

icon_master = Image.fromarray(rgba1, 'RGBA')
icon_512 = icon_master.resize((512, 512), Image.Resampling.LANCZOS)
icon_192 = icon_master.resize((192, 192), Image.Resampling.LANCZOS)
icon_180 = icon_master.resize((180, 180), Image.Resampling.LANCZOS)
icon_64 = icon_master.resize((64, 64), Image.Resampling.LANCZOS)
icon_32 = icon_master.resize((32, 32), Image.Resampling.LANCZOS)
icon_16 = icon_master.resize((16, 16), Image.Resampling.LANCZOS)

# Save PNG icons
icon_512.save(os.path.join(web_public, 'icon.png'), 'PNG')
icon_512.save(os.path.join(web_app, 'icon.png'), 'PNG')
icon_180.save(os.path.join(web_public, 'apple-touch-icon.png'), 'PNG')
icon_180.save(os.path.join(web_app, 'apple-icon.png'), 'PNG')

# Save multi-size favicon.ico
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
icon_master.save(os.path.join(web_public, 'favicon.ico'), format='ICO', sizes=ico_sizes)
icon_master.save(os.path.join(web_app, 'favicon.ico'), format='ICO', sizes=ico_sizes)

# SVG vector icon matching exact circular mark
svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="48" fill="#FD9CB3"/>
  <g fill="#111827">
    <!-- TT Crossbar -->
    <rect x="23" y="24" width="54" height="7" rx="3.5" />
    <!-- Left Stem -->
    <rect x="40.6" y="28" width="7" height="48" rx="3.5" />
    <!-- Right Stem -->
    <rect x="52.4" y="28" width="7" height="48" rx="3.5" />
  </g>
</svg>"""

with open(os.path.join(web_public, 'icon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)
with open(os.path.join(web_app, 'icon.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Favicon and app icon assets saved successfully!")

# ==========================================
# 2. PROCESS LOGO (Image 2)
# ==========================================
im2 = Image.open(p2)
arr2 = np.array(im2)

# Text bounds: y: 260..385, x: 143..879
pad_y = 16
pad_x = 24
y_start = max(0, 260 - pad_y)
y_end = min(arr2.shape[0], 385 + pad_y)
x_start = max(0, 143 - pad_x)
x_end = min(arr2.shape[1], 879 + pad_x)

crop2 = arr2[y_start:y_end, x_start:x_end].copy()
h, w, _ = crop2.shape

# 2a. Clean white background version
logo_white = Image.fromarray(crop2, 'RGB')
logo_white.save(os.path.join(web_public, 'logo-white.png'), 'PNG')
logo_white.save(os.path.join(web_public, 'logo.jpg'), 'JPEG', quality=95)
logo_white.save(os.path.join(web_public, 'logo-new.jpg'), 'JPEG', quality=95)

# 2b. Clean transparent background version (no halos)
rgba2 = np.zeros((h, w, 4), dtype=np.uint8)
sat_pink = (crop2[:,:,0].astype(int) - crop2[:,:,1].astype(int) > 40) & (crop2[:,:,0].astype(int) - crop2[:,:,2].astype(int) > 30)
is_white = (crop2[:,:,0] > 245) & (crop2[:,:,1] > 245) & (crop2[:,:,2] > 245)

for y in range(h):
    for x in range(w):
        r, g, b = crop2[y, x]
        if sat_pink[y, x]:
            # Pink dot pixel
            rgba2[y, x] = [r, g, b, 255]
        elif is_white[y, x]:
            rgba2[y, x] = [255, 255, 255, 0]
        else:
            brightness = (int(r) + int(g) + int(b)) / 3.0
            if brightness >= 245:
                rgba2[y, x] = [17, 24, 39, 0]
            else:
                alpha = int(np.clip((245.0 - brightness) / 245.0 * 255.0, 0, 255))
                rgba2[y, x] = [17, 24, 39, alpha]

logo_trans = Image.fromarray(rgba2, 'RGBA')
logo_trans.save(os.path.join(web_public, 'logo.png'), 'PNG')

print("Logo assets saved successfully! Logo size:", logo_trans.size)
