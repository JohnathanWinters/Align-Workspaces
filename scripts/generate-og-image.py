"""
Generate a professional OG image for Align Workspaces.
Composites a therapy office photo with logo, gradient overlay, and branding text.
Output: 1200x630 PNG (standard OG image dimensions)
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os

# --- Configuration ---
WIDTH, HEIGHT = 1200, 630
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, '..')
OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'client', 'public', 'images', 'og-image.png')
PHOTO_PATH = r"C:\Users\Nomad\Desktop\jiangjiang_miu_a_cozy_reading_corner_with_soft_natural_lighting_c5d175c0-2da1-4c8d-85a7-b5872009bc3d.png"
LOGO_PATH = os.path.join(PROJECT_ROOT, 'client', 'public', 'images', 'logo-align-cream.png')

# Colors
WARM_CREAM = (245, 238, 225)
SOFT_GOLD = (196, 168, 116)
DARK_OVERLAY = (20, 35, 28)  # Deep green-black for overlay


def crop_to_aspect(img, target_w, target_h):
    """Center-crop image to target aspect ratio."""
    target_ratio = target_w / target_h
    img_ratio = img.width / img.height

    if img_ratio > target_ratio:
        # Image is wider — crop sides
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) // 2
        img = img.crop((left, 0, left + new_width, img.height))
    else:
        # Image is taller — crop top/bottom
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) // 2
        img = img.crop((0, top, img.width, top + new_height))

    return img.resize((target_w, target_h), Image.LANCZOS)


def apply_gradient_overlay(base_img):
    """Apply a dark gradient overlay from left side for text readability."""
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    for x in range(WIDTH):
        # Strong dark overlay on left, fading to subtle on right
        t = x / WIDTH

        if t < 0.55:
            # Left side: strong overlay for text area
            alpha = int(200 - (t / 0.55) * 80)
        else:
            # Right side: gentle fade to let photo show
            alpha = int(120 - ((t - 0.55) / 0.45) * 90)

        alpha = max(20, min(220, alpha))
        draw.line([(x, 0), (x, HEIGHT)], fill=DARK_OVERLAY + (alpha,))

    # Extra darkening at bottom for tagline readability
    for y in range(HEIGHT - 120, HEIGHT):
        t = (y - (HEIGHT - 120)) / 120
        extra_alpha = int(60 * t)
        draw.line([(0, y), (WIDTH, y)], fill=DARK_OVERLAY + (extra_alpha,))

    base_rgba = base_img.convert('RGBA')
    return Image.alpha_composite(base_rgba, overlay)


def add_logo(img):
    """Add the Align logo, boosted for visibility on dark overlay."""
    if not os.path.exists(LOGO_PATH):
        print(f"Warning: Logo not found at {LOGO_PATH}")
        return img, 0

    logo = Image.open(LOGO_PATH).convert('RGBA')

    # Resize logo
    logo_height = 160
    aspect = logo.width / logo.height
    logo_width = int(logo_height * aspect)
    logo = logo.resize((logo_width, logo_height), Image.LANCZOS)

    # Boost visibility — make cream brighter and more opaque
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            r, g, b, a = pixels[x, y]
            if a > 15:
                # Brighten and boost alpha
                r = min(255, int(r * 1.5))
                g = min(255, int(g * 1.5))
                b = min(255, int(b * 1.5))
                a = min(255, int(a * 2.0))
                pixels[x, y] = (r, g, b, a)

    # Position: left side, vertically centered in upper area
    logo_x = 70
    logo_y = 110
    img.paste(logo, (logo_x, logo_y), logo)

    return img, logo_width


def add_text(img, logo_width):
    """Add branding text: title, subtitle, tagline, URL."""
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 68)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/calibril.ttf", 24)
        font_tagline = ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 20)
        font_url = ImageFont.truetype("C:/Windows/Fonts/calibri.ttf", 18)
    except Exception as e:
        print(f"Font error: {e}")
        font_title = ImageFont.load_default()
        font_subtitle = font_title
        font_tagline = font_title
        font_url = font_title

    text_x = 70 + logo_width + 25

    # "ALIGN" title
    text_y = 140
    # Subtle shadow for depth
    draw.text((text_x + 2, text_y + 2), "A L I G N", fill=(0, 0, 0, 80), font=font_title)
    draw.text((text_x, text_y), "A L I G N", fill=WARM_CREAM, font=font_title)

    # Subtitle lines
    subtitle_y = text_y + 80
    draw.text((text_x, subtitle_y), "Flexible Workspaces for Therapists", fill=SOFT_GOLD, font=font_subtitle)
    draw.text((text_x, subtitle_y + 30), "& Wellness Professionals", fill=SOFT_GOLD, font=font_subtitle)

    # Gold accent line under subtitle
    line_y = subtitle_y + 68
    draw.line([(text_x, line_y), (text_x + 280, line_y)], fill=SOFT_GOLD + (100,), width=1)

    # Tagline at bottom
    tagline_y = HEIGHT - 90
    draw.text(
        (70, tagline_y),
        "Private, beautifully designed spaces that elevate your practice",
        fill=WARM_CREAM + (200,), font=font_tagline
    )

    # Website URL
    draw.text(
        (70, HEIGHT - 45),
        "alignworkspaces.com",
        fill=SOFT_GOLD + (180,), font=font_url
    )

    return img


def add_accent_bars(img):
    """Add subtle gold accent bars at top and bottom edges."""
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Top bar
    for x in range(WIDTH):
        t = x / WIDTH
        alpha = int(100 * (1 - abs(2 * t - 1)))
        for dy in range(3):
            a = int(alpha * (1 - dy * 0.35))
            draw.point((x, dy), fill=SOFT_GOLD + (a,))

    # Bottom bar
    for x in range(WIDTH):
        t = x / WIDTH
        alpha = int(70 * (1 - abs(2 * t - 1)))
        for dy in range(2):
            a = int(alpha * (1 - dy * 0.4))
            draw.point((x, HEIGHT - 1 - dy), fill=SOFT_GOLD + (a,))

    return Image.alpha_composite(img, overlay)


def main():
    # 1. Load and prepare photo
    print("Loading photo...")
    photo = Image.open(PHOTO_PATH)
    print(f"  Original size: {photo.size}")

    # Crop to OG aspect ratio and resize
    photo = crop_to_aspect(photo, WIDTH, HEIGHT)
    print(f"  Cropped/resized to: {photo.size}")

    # Slightly warm up the photo
    enhancer = ImageEnhance.Color(photo)
    photo = enhancer.enhance(1.1)  # Slight color boost
    enhancer = ImageEnhance.Brightness(photo)
    photo = enhancer.enhance(0.95)  # Slightly dim for overlay contrast

    # 2. Apply gradient overlay
    print("Applying gradient overlay...")
    img = apply_gradient_overlay(photo)

    # 3. Add logo
    print("Adding logo...")
    img, logo_width = add_logo(img)

    # 4. Add text
    print("Adding text...")
    img = add_text(img, logo_width)

    # 5. Add accent bars
    print("Adding accent bars...")
    img = add_accent_bars(img)

    # 6. Save
    output = img.convert('RGB')
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    output.save(OUTPUT_PATH, 'PNG', optimize=True)
    print(f"\nOG image saved to: {OUTPUT_PATH}")
    print(f"Dimensions: {output.size[0]}x{output.size[1]}")
    filesize = os.path.getsize(OUTPUT_PATH)
    print(f"File size: {filesize / 1024:.0f} KB")


if __name__ == '__main__':
    main()
