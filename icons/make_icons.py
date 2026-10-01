from PIL import Image, ImageDraw, ImageFont

import os
# Any bold TrueType font with a rupee (U+20B9) glyph works. Adjust if needed for your OS.
_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    'C:\\Windows\\Fonts\\arialbd.ttf',
]
FONT_PATH = next((p for p in _CANDIDATES if os.path.exists(p)), _CANDIDATES[0])

def gradient_bg(size):
    """Diagonal gold -> coral -> purple gradient, matching the app's header gradient."""
    stops = [(0.0, (242, 169, 59)), (0.5, (239, 91, 91)), (1.0, (142, 68, 173))]
    img = Image.new('RGB', (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            for i in range(len(stops) - 1):
                t0, c0 = stops[i]
                t1, c1 = stops[i + 1]
                if t0 <= t <= t1 or i == len(stops) - 2:
                    local = 0 if t1 == t0 else (t - t0) / (t1 - t0)
                    local = max(0, min(1, local))
                    r = int(c0[0] + (c1[0] - c0[0]) * local)
                    g = int(c0[1] + (c1[1] - c0[1]) * local)
                    b = int(c0[2] + (c1[2] - c0[2]) * local)
                    px[x, y] = (r, g, b)
                    break
    return img

def rounded_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask

def make_icon(size, radius_ratio, out_path, content_scale=1.0):
    bg = gradient_bg(size)
    mask = rounded_mask(size, int(size * radius_ratio))
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)
    font_size = int(size * 0.52 * content_scale)
    font = ImageFont.truetype(FONT_PATH, font_size)
    text = '\u20b9'  # ₹
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = ((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1])
    draw.text(pos, text, font=font, fill=(255, 255, 255, 255))

    canvas.save(out_path)
    print('wrote', out_path)

# Standard icons (rounded square, used by most launchers)
make_icon(192, 0.22, 'icon-192.png')
make_icon(512, 0.22, 'icon-512.png')

# Maskable icon: content kept inside the safe zone (~40% padding) since Android
# may crop this to a circle/squircle/rounded-square depending on the device theme
make_icon(512, 0.0, 'icon-maskable-512.png', content_scale=0.60)

# Apple touch icon: iOS adds its own rounding, so square art, no radius here
make_icon(180, 0.0, 'apple-touch-icon.png')
