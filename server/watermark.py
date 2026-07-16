#!/usr/bin/env python3
"""
Stamp every page of a PDF with a diagonal "UNCONTROLLED COPY" watermark.
Usage: python3 watermark.py <input.pdf> <output.pdf>
"""
import sys
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.lib.units import mm

def make_watermark(width, height):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    c.saveState()
    # Diagonal watermark centred on page
    c.translate(width / 2, height / 2)
    c.rotate(45)
    # Outer text — large, very light
    c.setFont("Helvetica-Bold", 52)
    c.setFillColor(Color(0.6, 0.6, 0.6, alpha=0.13))
    c.drawCentredString(0, 10, "UNCONTROLLED COPY")
    # Underline text — slightly smaller
    c.setFont("Helvetica", 16)
    c.setFillColor(Color(0.5, 0.5, 0.5, alpha=0.10))
    c.drawCentredString(0, -18, "Not for operational use — verify currency before use")
    c.restoreState()
    c.save()
    buf.seek(0)
    return PdfReader(buf).pages[0]

def watermark_pdf(input_path, output_path):
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for page in reader.pages:
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        wm = make_watermark(w, h)
        page.merge_page(wm)
        writer.add_page(page)
    # Preserve bookmarks/outlines
    writer.add_metadata(reader.metadata or {})
    with open(output_path, "wb") as f:
        writer.write(f)

if __name__ == "__main__":
    watermark_pdf(sys.argv[1], sys.argv[2])
