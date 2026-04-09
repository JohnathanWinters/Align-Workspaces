"""Generate professional PDFs for Align Workspaces documents."""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))  # Up two levels: pdf -> documents -> project root
LOGO_PATH = os.path.join(PROJECT_DIR, "client", "public", "images", "logo-align-dark.png")

BRAND_TAN = HexColor("#c4956a")
BRAND_DARK = HexColor("#2a2a2a")
BRAND_MID = HexColor("#6b6b6b")
BRAND_LIGHT = HexColor("#999999")
BRAND_BG = HexColor("#faf8f5")
BRAND_LINE = HexColor("#e0d6ca")


def get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "DocTitle", parent=styles["Title"],
        fontSize=24, leading=30, textColor=BRAND_DARK,
        spaceAfter=6, alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "DocSubtitle", parent=styles["Normal"],
        fontSize=11, leading=16, textColor=BRAND_LIGHT,
        spaceAfter=4, alignment=TA_CENTER,
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        "BrandLabel", parent=styles["Normal"],
        fontSize=8, leading=12, textColor=BRAND_TAN,
        spaceAfter=2, alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        spaceBefore=0,
    ))
    styles.add(ParagraphStyle(
        "SectionHead", parent=styles["Heading1"],
        fontSize=16, leading=22, textColor=BRAND_DARK,
        spaceBefore=24, spaceAfter=10,
        fontName="Helvetica-Bold",
        borderWidth=0,
    ))
    styles.add(ParagraphStyle(
        "SubHead", parent=styles["Heading2"],
        fontSize=12, leading=16, textColor=BRAND_DARK,
        spaceBefore=16, spaceAfter=6,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "SubHead3", parent=styles["Heading3"],
        fontSize=10, leading=14, textColor=BRAND_TAN,
        spaceBefore=12, spaceAfter=4,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=15, textColor=BRAND_MID,
        spaceAfter=8, alignment=TA_LEFT,
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        "BodyJustify", parent=styles["Normal"],
        fontSize=10, leading=15, textColor=BRAND_MID,
        spaceAfter=8, alignment=TA_JUSTIFY,
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        "BulletCustom", parent=styles["Normal"],
        fontSize=10, leading=15, textColor=BRAND_MID,
        spaceAfter=3, leftIndent=18, bulletIndent=6,
        fontName="Helvetica",
    ))
    styles.add(ParagraphStyle(
        "SmallNote", parent=styles["Normal"],
        fontSize=8, leading=11, textColor=BRAND_LIGHT,
        spaceAfter=4, alignment=TA_CENTER,
        fontName="Helvetica-Oblique",
    ))
    styles.add(ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=7, leading=10, textColor=BRAND_LIGHT,
        alignment=TA_CENTER,
        fontName="Helvetica",
    ))
    return styles


def add_header_footer(canvas, doc, title_text):
    canvas.saveState()
    # Header line
    canvas.setStrokeColor(BRAND_LINE)
    canvas.setLineWidth(0.5)
    canvas.line(0.75*inch, letter[1] - 0.6*inch, letter[0] - 0.75*inch, letter[1] - 0.6*inch)
    # Header text
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(BRAND_LIGHT)
    canvas.drawString(0.75*inch, letter[1] - 0.55*inch, "ALIGN WORKSPACES")
    canvas.drawRightString(letter[0] - 0.75*inch, letter[1] - 0.55*inch, title_text.upper())
    # Footer
    canvas.setStrokeColor(BRAND_LINE)
    canvas.line(0.75*inch, 0.6*inch, letter[0] - 0.75*inch, 0.6*inch)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(BRAND_LIGHT)
    canvas.drawString(0.75*inch, 0.42*inch, "alignworkspaces.com")
    canvas.drawCentredString(letter[0]/2, 0.42*inch, f"Page {doc.page}")
    canvas.drawRightString(letter[0] - 0.75*inch, 0.42*inch, "Confidential")
    canvas.restoreState()


def build_cover_page(story, styles, title, subtitle, date):
    story.append(Spacer(1, 1.5*inch))
    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=1.2*inch, height=1.2*inch)
        logo.hAlign = "CENTER"
        story.append(logo)
        story.append(Spacer(1, 12))
    story.append(Paragraph("ALIGN WORKSPACES", styles["BrandLabel"]))
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="40%", thickness=1, color=BRAND_TAN, spaceAfter=20, spaceBefore=0))
    story.append(Paragraph(title, styles["DocTitle"]))
    story.append(Paragraph(subtitle, styles["DocSubtitle"]))
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="40%", thickness=1, color=BRAND_TAN, spaceAfter=30, spaceBefore=0))
    story.append(Paragraph(date, styles["DocSubtitle"]))
    story.append(Spacer(1, 40))
    story.append(Paragraph("Align Workspaces  |  Miami, FL  |  hello@alignworkspaces.com", styles["SmallNote"]))
    story.append(PageBreak())


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=BRAND_LINE, spaceAfter=12, spaceBefore=4)


def parse_txt_to_story(filepath, styles):
    """Parse a structured txt file into reportlab flowables."""
    story = []
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        line = lines[i].rstrip("\n")

        # Skip pure decoration lines
        if line.strip() and all(c in "=- " for c in line.strip()):
            i += 1
            continue

        # Empty line
        if not line.strip():
            i += 1
            continue

        # Section headers (ALL CAPS lines that are section titles)
        stripped = line.strip()

        # Main section headers (numbered or all-caps multi-word)
        if (stripped and len(stripped) > 3 and stripped == stripped.upper()
            and not stripped.startswith("-") and not stripped.startswith("*")
            and not stripped.startswith("NOTE") and ":" not in stripped[:4]
            and any(c.isalpha() for c in stripped)):
            # Check if it's a major section (preceded by === line or numbered)
            is_major = False
            if i > 0 and lines[i-1].strip() and all(c in "= " for c in lines[i-1].strip()):
                is_major = True
            if stripped[0].isdigit() and "." in stripped[:4]:
                is_major = True

            if is_major:
                story.append(Paragraph(stripped, styles["SectionHead"]))
                story.append(hr())
            else:
                story.append(Paragraph(stripped, styles["SubHead"]))
            i += 1
            continue

        # Sub-headers (Title Case lines ending with colon, or short bold lines)
        if (stripped.endswith(":") and len(stripped) < 80 and not stripped.startswith("-")
            and not stripped.startswith("*")):
            story.append(Paragraph(f"<b>{stripped}</b>", styles["SubHead3"]))
            i += 1
            continue

        # Bullet points
        if stripped.startswith("- ") or stripped.startswith("* "):
            text = stripped[2:]
            # Bold the part before a colon if present
            if ": " in text and text.index(": ") < 40:
                parts = text.split(": ", 1)
                text = f"<b>{parts[0]}:</b> {parts[1]}"
            story.append(Paragraph(f"\u2022 {text}", styles["BulletCustom"]))
            i += 1
            continue

        # Numbered items (1. 2. etc or a) b) etc)
        if (len(stripped) > 2 and
            ((stripped[0].isdigit() and stripped[1] in ".)" and stripped[2] == " ") or
             (stripped[0].isdigit() and stripped[1].isdigit() and stripped[2] in ".)" and stripped[3] == " "))):
            story.append(Paragraph(f"\u2022 {stripped}", styles["BulletCustom"]))
            i += 1
            continue

        # Regular paragraph - collect continuation lines
        para_lines = [stripped]
        i += 1
        while i < len(lines):
            next_line = lines[i].rstrip("\n")
            if not next_line.strip():
                break
            if next_line.strip() and all(c in "=- " for c in next_line.strip()):
                break
            if next_line.strip().startswith("- ") or next_line.strip().startswith("* "):
                break
            if (next_line.strip() == next_line.strip().upper() and len(next_line.strip()) > 3
                and any(c.isalpha() for c in next_line.strip())):
                break
            para_lines.append(next_line.strip())
            i += 1

        full_para = " ".join(para_lines)
        story.append(Paragraph(full_para, styles["BodyJustify"]))

    return story


def generate_pdf(txt_filename, pdf_filename, title, subtitle, date, header_title):
    styles = get_styles()
    txt_path = os.path.join(SCRIPT_DIR, txt_filename)
    pdf_path = os.path.join(SCRIPT_DIR, pdf_filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        topMargin=0.85*inch,
        bottomMargin=0.85*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
    )

    story = []
    build_cover_page(story, styles, title, subtitle, date)

    content = parse_txt_to_story(txt_path, styles)
    story.extend(content)

    def on_page(canvas, doc_obj):
        if doc_obj.page > 1:
            add_header_footer(canvas, doc_obj, header_title)

    doc.build(story, onFirstPage=lambda c, d: None, onLaterPages=on_page)
    print(f"  Generated: {pdf_path}")


if __name__ == "__main__":
    print("Generating Align Workspaces PDFs...\n")

    generate_pdf(
        "host-sales-pitch.txt",
        "Align Workspaces - Host Sales Pitch.pdf",
        "Host Sales Pitch",
        "Positioning-based sales story for acquiring new hosts",
        "March 2026",
        "Host Sales Pitch",
    )

    generate_pdf(
        "positioning.txt",
        "Align Workspaces - Positioning.pdf",
        "Positioning Document",
        "Market positioning strategy based on the Obviously Awesome framework",
        "March 2026",
        "Positioning",
    )

    generate_pdf(
        "lawyer-briefing.txt",
        "Align Workspaces - Legal Briefing.pdf",
        "Legal Briefing",
        "Platform overview and areas for legal review by outside counsel",
        "March 2026",
        "Legal Briefing",
    )

    print("\nDone! All PDFs saved to documents/ folder.")
