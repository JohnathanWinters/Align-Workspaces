"""Generate horizontal (1200x630) FB post images for the Align outreach
campaign. Style mirrors fb-carousel/slide-1.jpg: real Align space photo
darkened underneath, centered text block with badge pill + serif
headline + sans subhead + URL.

Outputs to documents/marketing/fb-post-images/
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os

# Brand
BRAND_ORANGE = (196, 149, 106)   # #c4956a from the site
TEXT_WHITE = (255, 255, 255)
SUBTEXT = (220, 220, 220)
URL_COLOR = (196, 149, 106)
DARK_OVERLAY = (24, 22, 20, 165)  # semi-transparent dark warm

# Output size (FB landscape feed)
W, H = 1200, 630

# Font paths (Windows)
FONT_SERIF_BOLD = "C:/Windows/Fonts/georgiab.ttf"
FONT_SERIF_REG = "C:/Windows/Fonts/georgia.ttf"
FONT_SANS_BOLD = "C:/Windows/Fonts/calibrib.ttf"
FONT_SANS_REG = "C:/Windows/Fonts/calibri.ttf"

OUT_DIR = "documents/marketing/fb-post-images"
SPACES_DIR = "client/public/images/spaces"

# Image plan: (filename, badge, headline, subhead, url, source_photo)
IMAGES = [
    # === Sheet 1: Hosts (Miami / Broward) ===
    ("host-miami.jpg",
     "FOR MIAMI SPACE OWNERS",
     "Two ways your space can earn.",
     "List free, or run your own clients privately. Pick what fits.",
     "ALIGNWORKSPACES.COM/FOR-HOSTS",
     "space-8d155dd6-8bfc-4515-a32a-01dd72bcfbfa.webp"),  # cream chairs warm room

    ("host-broward.jpg",
     "FOR BROWARD SPACE OWNERS",
     "Two ways your space can earn.",
     "List free, or run your own clients privately. Pick what fits.",
     "ALIGNWORKSPACES.COM/FOR-HOSTS",
     "space-7fae5817-d983-4e10-95bc-6d7ea4319dcb.webp"),  # therapy office with chairs + window

    ("host-investor.jpg",
     "FOR FLORIDA INVESTORS",
     "Turn vacant hours into cashflow.",
     "List the time your commercial property sits empty. Free to list.",
     "ALIGNWORKSPACES.COM/FOR-HOSTS",
     "space-afb991da-021f-4e61-b36a-a7fcef4afcc3.webp"),  # open lobby commercial

    # === Sheet 2: SaaS (national, by vertical) ===
    ("saas-salon.jpg",
     "FOR SALON & SUITE OWNERS",
     "Booking software, 0% commission.",
     "Branded page, calendar, Stripe payouts. Flat $29 to $299/mo.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-0e0ec694-0b16-4598-9919-fe47549a66b8.webp"),  # salon-style space with hats

    ("saas-medspa.jpg",
     "FOR MED SPA OWNERS",
     "Booking software, 0% commission.",
     "Branded page, intake forms, Stripe payouts. Flat monthly fee.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-c401b806-3712-4b45-8617-e3d30701873f.webp"),  # mental health office reception

    ("saas-fitness.jpg",
     "FOR STUDIO OWNERS",
     "Booking software, no per-class cuts.",
     "Branded page, schedule, payments. Flat $29 to $299/mo.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-e1d0c2a7-8baa-417b-9a77-2fb3f819b2c5.webp"),  # open studio room with macrame

    ("saas-coach.jpg",
     "FOR COACHES",
     "Booking software, you keep 100%.",
     "Branded page, calendar, contracts, Stripe payouts. No per-session cut.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-4bee724a-5e0c-4b9b-944b-c9eeddedcd8f.webp"),  # small intimate room

    ("saas-therapy.jpg",
     "FOR PRIVATE PRACTICE",
     "Booking software, no cut of your sessions.",
     "Branded page, intake, Stripe payouts. Flat $29 to $299/mo.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-7fae5817-d983-4e10-95bc-6d7ea4319dcb.webp"),  # therapy office with chairs + window

    ("saas-photo.jpg",
     "FOR PHOTO & VIDEO PROS",
     "Booking software, branded as you.",
     "Branded page, contracts, payments. Flat $29 to $299/mo.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-1a6691c3-64dc-4fcc-ad25-ecf6c5acf9a4.webp"),  # photo studio with cyc + brick

    ("saas-recording.jpg",
     "FOR RECORDING & PODCAST STUDIOS",
     "Booking software, no per-session cuts.",
     "Branded page, calendar, Stripe payouts. Flat monthly fee.",
     "ALIGNWORKSPACES.COM/FOR-STUDIOS",
     "space-72ca8bac-1570-422f-a1c5-ce37b7db06ed.webp"),  # editor workspace with computer + brick
]


def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def fit_cover(img, w, h):
    """Resize+crop image to exactly w x h, like CSS object-fit: cover."""
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    dst_ratio = w / h
    if src_ratio > dst_ratio:
        # src is wider, scale by height
        new_h = h
        new_w = int(src_w * (h / src_h))
    else:
        new_w = w
        new_h = int(src_h * (w / src_w))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - w) // 2
    top = (new_h - h) // 2
    return img.crop((left, top, left + w, top + h))


def desaturate(img, factor=0.55):
    """Slightly desaturate the photo so text reads better and brand feels editorial."""
    return ImageEnhance.Color(img).enhance(factor)


def darken_overlay(img, alpha=160):
    """Apply a centered dark vignette so the middle is darker than edges."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = img.size[0] // 2, img.size[1] // 2
    # Strong dark in middle, fading toward edges
    max_r = int(((img.size[0]/2) ** 2 + (img.size[1]/2) ** 2) ** 0.5)
    steps = 14
    for i in range(steps):
        r = int(max_r * (1 - i / steps))
        a = int(alpha * (i / steps))
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 0, 0, a))
    overlay = overlay.filter(ImageFilter.GaussianBlur(60))
    # Also flat dark layer for guaranteed contrast under text
    flat = Image.new("RGBA", img.size, (0, 0, 0, 80))
    base = img.convert("RGBA")
    base = Image.alpha_composite(base, flat)
    base = Image.alpha_composite(base, overlay)
    return base.convert("RGB")


def text_size(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_pill(draw, cx, cy, text, font, color=BRAND_ORANGE, text_color=(255, 255, 255), pad_x=22, pad_y=10):
    tw, th = text_size(draw, text, font)
    rw = tw + pad_x * 2
    rh = th + pad_y * 2
    x0 = cx - rw // 2
    y0 = cy - rh // 2
    x1 = x0 + rw
    y1 = y0 + rh
    radius = rh // 2
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=color)
    # Center text vertically using actual bbox so capitals sit right
    bbox = draw.textbbox((0, 0), text, font=font)
    text_x = cx - (bbox[2] - bbox[0]) // 2 - bbox[0]
    text_y = cy - (bbox[3] - bbox[1]) // 2 - bbox[1]
    draw.text((text_x, text_y), text, font=font, fill=text_color)
    return y1  # bottom y of pill


def draw_centered(draw, cy, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cx = W // 2
    x = cx - tw // 2 - bbox[0]
    y = cy - th // 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=fill)
    return cy + th // 2  # bottom y of text


def render(filename, badge, headline, subhead, url, source_photo):
    src_path = os.path.join(SPACES_DIR, source_photo)
    if not os.path.exists(src_path):
        # Fallback to plain dark background
        img = Image.new("RGB", (W, H), (40, 36, 32))
    else:
        img = Image.open(src_path).convert("RGB")
        img = fit_cover(img, W, H)
        img = desaturate(img, 0.55)
        img = darken_overlay(img, alpha=160)

    draw = ImageDraw.Draw(img)

    # Layout: vertically center the whole text stack
    # Stack: badge pill, gap, headline, gap, subhead, gap, URL
    badge_font = load_font(FONT_SANS_BOLD, 19)
    headline_font = load_font(FONT_SERIF_BOLD, 64)
    subhead_font = load_font(FONT_SERIF_REG, 22)
    url_font = load_font(FONT_SANS_BOLD, 16)

    # Calculate stack height
    badge_h = 19 + 20  # text height + pad
    gap_1 = 28        # between badge and headline
    headline_lines = wrap_lines(headline, headline_font, max_width=W - 200, draw=draw)
    headline_h = sum(text_size(draw, ln, headline_font)[1] for ln in headline_lines) + (len(headline_lines) - 1) * 12
    gap_2 = 22
    subhead_lines = wrap_lines(subhead, subhead_font, max_width=W - 280, draw=draw)
    subhead_h = sum(text_size(draw, ln, subhead_font)[1] for ln in subhead_lines) + (len(subhead_lines) - 1) * 6
    gap_3 = 28
    url_h = text_size(draw, url, url_font)[1]

    total = badge_h + gap_1 + headline_h + gap_2 + subhead_h + gap_3 + url_h
    start_y = (H - total) // 2

    # Draw badge pill centered horizontally
    cx = W // 2
    badge_cy = start_y + badge_h // 2
    badge_bottom = draw_pill(draw, cx, badge_cy, badge, badge_font)

    # Headline (multi-line)
    y = badge_bottom + gap_1
    for ln in headline_lines:
        bbox = draw.textbbox((0, 0), ln, font=headline_font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = cx - tw // 2 - bbox[0]
        draw.text((x, y - bbox[1]), ln, font=headline_font, fill=TEXT_WHITE)
        y += th + 12

    # Subhead
    y = y - 12 + gap_2
    for ln in subhead_lines:
        bbox = draw.textbbox((0, 0), ln, font=subhead_font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = cx - tw // 2 - bbox[0]
        draw.text((x, y - bbox[1]), ln, font=subhead_font, fill=SUBTEXT)
        y += th + 6

    # URL
    y = y - 6 + gap_3
    bbox = draw.textbbox((0, 0), url, font=url_font)
    tw = bbox[2] - bbox[0]
    x = cx - tw // 2 - bbox[0]
    draw.text((x, y - bbox[1]), url, font=url_font, fill=URL_COLOR)

    out_path = os.path.join(OUT_DIR, filename)
    img.save(out_path, "JPEG", quality=88)
    print(f"  -> {out_path}")


def wrap_lines(text, font, max_width, draw):
    """Greedy word-wrap to fit max_width."""
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if (bbox[2] - bbox[0]) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


os.makedirs(OUT_DIR, exist_ok=True)
print(f"Generating {len(IMAGES)} images at {W}x{H}...\n")
for entry in IMAGES:
    render(*entry)
print(f"\nDone. {len(IMAGES)} images written to {OUT_DIR}/")
