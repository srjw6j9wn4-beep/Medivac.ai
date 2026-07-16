#!/usr/bin/env python3
"""
Generate a Split Duty calculation PDF for RFDS Medivac.ai
Usage: python3 split_duty_pdf.py '<json_payload>' <output_path>
"""
import sys, json, os
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Colours ──────────────────────────────────────────────────────────────────
TEAL        = HexColor("#01696F")
TEAL_LIGHT  = HexColor("#E6F2F2")
DARK        = HexColor("#171614")
SURFACE     = HexColor("#1C1B19")
SURFACE2    = HexColor("#201F1D")
BORDER      = HexColor("#393836")
TEXT        = HexColor("#CDCCCA")
TEXT_MUTED  = HexColor("#797876")
RED         = HexColor("#A13544")
RED_LIGHT   = HexColor("#3D1118")
AMBER       = HexColor("#964219")
AMBER_LIGHT = HexColor("#3D2510")
GREEN       = HexColor("#437A22")
WHITE       = white

PAGE_W, PAGE_H = A4
L_MARGIN = R_MARGIN = 18*mm
T_MARGIN = 18*mm
B_MARGIN = 16*mm

def parse_hhmm(t):
    parts = (t or "00:00").split(":")
    return int(parts[0]) * 60 + int(parts[1])

def add_mins(t, mins):
    total = (parse_hhmm(t) + int(mins)) % (24 * 60)
    if total < 0:
        total += 24 * 60
    return f"{total // 60:02d}:{total % 60:02d}"

def fmt_hrs(h):
    return f"{float(h):.1f} hrs"

def build_pdf(data: dict, out_path: str):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=L_MARGIN, rightMargin=R_MARGIN,
        topMargin=T_MARGIN, bottomMargin=B_MARGIN,
        title="Split Duty Calculation — RFDS Medivac.ai",
        author="Perplexity Computer",
    )

    usable_w = PAGE_W - L_MARGIN - R_MARGIN

    # ── Extract params ────────────────────────────────────────────────────────
    depart       = data.get("departHHMM", "06:00")
    pre_break    = float(data.get("preBreakHours", 6))
    sdrp         = float(data.get("sdrpHours", 3))
    post_break   = float(data.get("postBreakHours", 4))
    facility     = data.get("facility", "sleeping")
    multi_crew   = bool(data.get("multiCrew", True))
    result       = data.get("result", {})
    generated_at = datetime.now().strftime("%d %b %Y  %H:%M AEST")

    break_start  = add_mins(depart, int(pre_break * 60))
    break_end    = add_mins(break_start, int(sdrp * 60))
    duty_end     = add_mins(break_end, int(post_break * 60))

    valid        = result.get("valid", True)
    errors       = result.get("errors", [])
    warnings     = result.get("warnings", [])

    # ── Styles ────────────────────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    title_style = S("Title",
        fontName="Helvetica-Bold", fontSize=18, textColor=TEAL,
        spaceAfter=2*mm, leading=22)
    sub_style = S("Sub",
        fontName="Helvetica", fontSize=9, textColor=TEXT_MUTED,
        spaceAfter=6*mm)
    section_style = S("Section",
        fontName="Helvetica-Bold", fontSize=7.5, textColor=TEAL,
        spaceBefore=5*mm, spaceAfter=2*mm,
        letterSpacing=1.2, leading=10)
    body_style = S("Body",
        fontName="Helvetica", fontSize=9, textColor=TEXT, leading=13)
    mono_style = S("Mono",
        fontName="Courier-Bold", fontSize=14, textColor=WHITE, leading=16)
    label_style = S("Label",
        fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED,
        leading=9, letterSpacing=0.8)
    value_style = S("Value",
        fontName="Helvetica-Bold", fontSize=13, textColor=TEAL, leading=16)
    small_style = S("Small",
        fontName="Helvetica", fontSize=7.5, textColor=TEXT_MUTED, leading=10)
    rule_style = S("Rule",
        fontName="Helvetica", fontSize=8, textColor=TEXT, leading=11,
        spaceAfter=1*mm)
    rule_bold = S("RuleBold",
        fontName="Helvetica-Bold", fontSize=8, textColor=TEXT, leading=11)
    warn_style = S("Warn",
        fontName="Helvetica", fontSize=8.5, textColor=HexColor("#FDAB43"), leading=12)
    err_style = S("Err",
        fontName="Helvetica", fontSize=8.5, textColor=HexColor("#DD6974"), leading=12)
    footer_style = S("Footer",
        fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED,
        alignment=TA_CENTER, leading=10)

    story = []

    # ── Header bar ───────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("SPLIT DUTY CALCULATION", S("H",
            fontName="Helvetica-Bold", fontSize=9, textColor=TEAL,
            letterSpacing=1.5, leading=11)),
        Paragraph(f"RFDS Medivac.ai  ·  CAO 48.1 App. 4B  ·  EBA 2025", S("HR",
            fontName="Helvetica", fontSize=8, textColor=TEXT_MUTED,
            alignment=TA_RIGHT, leading=11)),
    ]]
    header_tbl = Table(header_data, colWidths=[usable_w * 0.55, usable_w * 0.45])
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), SURFACE),
        ("ROUNDEDCORNERS", [4]),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (0,-1), 10),
        ("RIGHTPADDING", (-1,0), (-1,-1), 10),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 5*mm))

    # ── Status badge ─────────────────────────────────────────────────────────
    status_color = TEAL if valid else RED
    status_bg    = TEAL_LIGHT if valid else HexColor("#3D1118")
    status_text  = "✓  COMPLIANT — CAO 48.1 Appendix 4B" if valid else "✗  NON-COMPLIANT — Parameters exceed limits"
    status_data  = [[Paragraph(status_text, S("ST",
        fontName="Helvetica-Bold", fontSize=10, textColor=status_color, leading=13))]]
    status_tbl = Table(status_data, colWidths=[usable_w])
    status_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), status_bg),
        ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("ROUNDEDCORNERS", [4]),
        ("BOX", (0,0), (-1,-1), 0.75, status_color),
    ]))
    story.append(status_tbl)
    story.append(Spacer(1, 5*mm))

    # ── Input parameters ─────────────────────────────────────────────────────
    story.append(Paragraph("INPUT PARAMETERS", section_style))

    crew_type = "Multi-Crew (2+ pilots)" if multi_crew else "Single Pilot"
    facility_label = "Sleeping Accommodation" if facility == "sleeping" else "Resting Accommodation Only"

    params_data = [
        ["Crew Type", crew_type,     "Duty Start",       depart],
        ["Facility",  facility_label, "Pre-Break Segment", fmt_hrs(pre_break)],
        ["",          "",             "SDRP Duration",     fmt_hrs(sdrp)],
        ["",          "",             "Post-Break Segment", fmt_hrs(post_break)],
    ]
    cw = [usable_w * 0.18, usable_w * 0.32, usable_w * 0.22, usable_w * 0.28]
    params_tbl = Table(params_data, colWidths=cw)
    params_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), SURFACE),
        ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME", (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8.5),
        ("TEXTCOLOR", (0,0), (0,-1), TEXT_MUTED),
        ("TEXTCOLOR", (2,0), (2,-1), TEXT_MUTED),
        ("TEXTCOLOR", (1,0), (1,-1), TEXT),
        ("TEXTCOLOR", (3,0), (3,-1), TEXT),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("LINEBELOW", (0,0), (-1,-2), 0.3, BORDER),
        ("ROUNDEDCORNERS", [4]),
        ("BOX", (0,0), (-1,-1), 0.5, BORDER),
    ]))
    story.append(params_tbl)
    story.append(Spacer(1, 5*mm))

    # ── Timeline ─────────────────────────────────────────────────────────────
    story.append(Paragraph("DUTY TIMELINE", section_style))

    total_span = pre_break + sdrp + post_break
    bar_w = usable_w - 16  # inner bar width

    # Proportional widths
    pre_w  = max(bar_w * (pre_break  / total_span), 30)
    sdrp_w = max(bar_w * (sdrp       / total_span), 30)
    post_w = max(bar_w * (post_break / total_span), 30)
    # Normalise to fit bar_w
    total_raw = pre_w + sdrp_w + post_w
    pre_w  = bar_w * pre_w  / total_raw
    sdrp_w = bar_w * sdrp_w / total_raw
    post_w = bar_w * post_w / total_raw

    sdrp_bg    = HexColor("#2D4A4A") if facility == "sleeping" else HexColor("#4A3010")
    sdrp_label = f"{fmt_hrs(sdrp)}\n{'Sleep' if facility == 'sleeping' else 'Rest'}"

    timeline_data = [[
        Paragraph(f"<b>{fmt_hrs(pre_break)}</b><br/>FDP", S("TL",
            fontName="Helvetica-Bold", fontSize=8.5, textColor=WHITE,
            alignment=TA_CENTER, leading=11)),
        Paragraph(f"<b>{fmt_hrs(sdrp)}</b><br/>{'Sleep' if facility=='sleeping' else 'Rest'}", S("TL2",
            fontName="Helvetica-Bold", fontSize=8.5, textColor=HexColor("#B0D4D4"),
            alignment=TA_CENTER, leading=11)),
        Paragraph(f"<b>{fmt_hrs(post_break)}</b><br/>FDP", S("TL3",
            fontName="Helvetica-Bold", fontSize=8.5,
            textColor=WHITE if valid else HexColor("#DD6974"),
            alignment=TA_CENTER, leading=11)),
    ]]
    timeline_tbl = Table(timeline_data, colWidths=[pre_w, sdrp_w, post_w])
    timeline_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,0), TEAL),
        ("BACKGROUND", (1,0), (1,0), sdrp_bg),
        ("BACKGROUND", (2,0), (2,0), TEAL if valid else RED),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))

    # Time labels row
    time_labels = [[
        Paragraph(depart,      S("TM", fontName="Courier", fontSize=8, textColor=TEXT_MUTED, alignment=TA_LEFT,   leading=10)),
        Paragraph(break_start, S("TM", fontName="Courier", fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER, leading=10)),
        Paragraph(break_end,   S("TM", fontName="Courier", fontSize=8, textColor=TEXT_MUTED, alignment=TA_RIGHT,  leading=10)),
    ]]
    time_tbl = Table(time_labels, colWidths=[pre_w, sdrp_w, post_w])
    time_tbl.setStyle(TableStyle([
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
    ]))

    # Wrap in outer frame
    outer_data = [[timeline_tbl], [time_tbl],
                  [Paragraph(
                       f"Total span: <b>{fmt_hrs(total_span)}</b>  ·  "
                       f"Flight time: <b>{fmt_hrs(pre_break + post_break)}</b>  ·  "
                       f"FDP limit: <b>{fmt_hrs(result.get('maxTotalFDP', 16))}</b>  ·  "
                       f"Duty ends: <b>{duty_end}</b>",
                       S("TI", fontName="Helvetica", fontSize=7.5, textColor=TEXT_MUTED, leading=10))]]
    outer_tbl = Table(outer_data, colWidths=[usable_w])
    outer_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), SURFACE),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,2), (-1,2), 7),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("BOX", (0,0), (-1,-1), 0.5, BORDER),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(outer_tbl)
    story.append(Spacer(1, 5*mm))

    # ── Results grid ─────────────────────────────────────────────────────────
    story.append(Paragraph("CALCULATION RESULTS", section_style))

    fdp_ext     = result.get("fdpExtension", 0)
    max_total   = result.get("maxTotalFDP", 16)
    max_post    = result.get("maxPostBreak", 0)
    req_odp     = result.get("requiredODP", 10)
    odp_ref     = result.get("odpRef", "EBA Cl 18.5")
    facility_note = "Full SDRP (Sleeping)" if facility == "sleeping" else "½ SDRP max +2h (Resting)"
    total_used  = float(result.get("totalFDPUsed", total_span))
    post_ok     = post_break <= max_post

    def metric_cell(label, value, sub, ok=True):
        val_color = TEAL if ok else RED
        return [
            Paragraph(label.upper(), S("ML", fontName="Helvetica", fontSize=7,
                textColor=TEXT_MUTED, leading=9, letterSpacing=0.8)),
            Paragraph(value, S("MV", fontName="Helvetica-Bold", fontSize=15,
                textColor=val_color, leading=17)),
            Paragraph(sub,   S("MS", fontName="Helvetica", fontSize=7.5,
                textColor=TEXT_MUTED, leading=9)),
        ]

    cell_w = usable_w / 4 - 2
    results_data = [[
        metric_cell("FDP Extension",  f"+{float(fdp_ext):.1f} hrs",  facility_note),
        metric_cell("Max Total FDP",  fmt_hrs(max_total), "incl. SDRP, cap 16h",
                    ok=(total_used <= max_total)),
        metric_cell("Max Post-Break", fmt_hrs(max_post),
                    f"Fresh FCM from {break_end}", ok=post_ok),
        metric_cell("Required ODP",   f"{req_odp} hrs", odp_ref),
    ]]
    # Flatten — each cell is a list of 3 paragraphs, put in a sub-table
    def make_cell_tbl(paragraphs, ok=True):
        bg = SURFACE2 if ok else HexColor("#2A1015")
        border = BORDER if ok else RED
        tbl = Table([[p] for p in paragraphs], colWidths=[cell_w])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), bg),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("BOX", (0,0), (-1,-1), 0.5, border),
            ("ROUNDEDCORNERS", [4]),
        ]))
        return tbl

    metrics_row = [[
        make_cell_tbl(metric_cell("FDP Extension", f"+{float(fdp_ext):.1f} hrs", facility_note)),
        make_cell_tbl(metric_cell("Max Total FDP", fmt_hrs(max_total), "incl. SDRP, cap 16h"),
                      ok=(total_used <= max_total)),
        make_cell_tbl(metric_cell("Max Post-Break", fmt_hrs(max_post), f"Fresh FCM from {break_end}"),
                      ok=post_ok),
        make_cell_tbl(metric_cell("Required ODP", f"{req_odp} hrs", odp_ref)),
    ]]
    metrics_tbl = Table(metrics_row, colWidths=[cell_w + 2]*4, hAlign="LEFT")
    metrics_tbl.setStyle(TableStyle([
        ("LEFTPADDING", (0,0), (-1,-1), 1),
        ("RIGHTPADDING", (0,0), (-1,-1), 1),
        ("TOPPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    story.append(metrics_tbl)
    story.append(Spacer(1, 4*mm))

    # ── Summary / Schedule ────────────────────────────────────────────────────
    story.append(Paragraph("SCHEDULE SUMMARY", section_style))
    earliest_return = result.get("earliestReturn", "—")
    night_warn      = result.get("nightwindowViolation", False)

    sched_rows = [
        ["Duty Start",          depart,          "Crew Type",          crew_type],
        ["Break Starts",        break_start,     "Facility",           facility_label],
        ["Resume After SDRP",   break_end,       "SDRP Duration",      fmt_hrs(sdrp)],
        ["Duty Ends",           duty_end,        "FDP Extension",      f"+{float(fdp_ext):.1f} hrs"],
        ["Required ODP",        f"{req_odp} hrs", "ODP Reference",     odp_ref],
        ["Earliest Next Duty",  earliest_return, "", ""],
    ]
    sched_cw = [usable_w*0.20, usable_w*0.17, usable_w*0.22, usable_w*0.41]
    sched_tbl = Table(sched_rows, colWidths=sched_cw)
    sched_style = [
        ("BACKGROUND", (0,0), (-1,-1), SURFACE),
        ("FONTNAME",   (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",   (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 8.5),
        ("TEXTCOLOR",  (0,0), (0,-1), TEXT_MUTED),
        ("TEXTCOLOR",  (2,0), (2,-1), TEXT_MUTED),
        ("TEXTCOLOR",  (1,0), (1,-1), TEXT),
        ("TEXTCOLOR",  (3,0), (3,-1), TEXT),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("LINEBELOW", (0,0), (-1,-2), 0.3, BORDER),
        ("BOX",        (0,0), (-1,-1), 0.5, BORDER),
        ("ROUNDEDCORNERS", [4]),
        # Highlight Earliest Next Duty row
        ("BACKGROUND", (0,5), (-1,5), HexColor("#0D2E2E")),
        ("FONTNAME",   (1,5), (1,5), "Helvetica-Bold"),
        ("TEXTCOLOR",  (1,5), (1,5), TEAL),
        ("FONTSIZE",   (1,5), (1,5), 11),
    ]
    sched_tbl.setStyle(TableStyle(sched_style))
    story.append(sched_tbl)

    # Night window warning
    if night_warn:
        story.append(Spacer(1, 2*mm))
        nw_data = [[Paragraph(
            "⚠  SDRP spans 2300-0529 — Night window applies. "
            "Sleeping accommodation is mandatory. No ODP reduction permitted.",
            S("NW", fontName="Helvetica-Bold", fontSize=8, textColor=HexColor("#FDAB43"), leading=11))]]
        nw_tbl = Table(nw_data, colWidths=[usable_w])
        nw_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), HexColor("#2A1A08")),
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("LEFTPADDING", (0,0), (-1,-1), 10),
            ("BOX", (0,0), (-1,-1), 0.5, HexColor("#964219")),
            ("ROUNDEDCORNERS", [4]),
        ]))
        story.append(nw_tbl)

    # Errors
    if errors:
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph("CAO 48.1 VIOLATIONS", S("EH",
            fontName="Helvetica-Bold", fontSize=7.5, textColor=RED,
            letterSpacing=1.2, spaceBefore=2*mm, spaceAfter=1*mm)))
        for i, e in enumerate(errors, 1):
            err_data = [[Paragraph(f"{i}.  {e}", S("EE",
                fontName="Helvetica", fontSize=8.5, textColor=HexColor("#DD6974"), leading=12))]]
            err_tbl = Table(err_data, colWidths=[usable_w])
            err_tbl.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), HexColor("#2A1015")),
                ("TOPPADDING", (0,0), (-1,-1), 5),
                ("BOTTOMPADDING", (0,0), (-1,-1), 5),
                ("LEFTPADDING", (0,0), (-1,-1), 10),
                ("BOX", (0,0), (-1,-1), 0.5, HexColor("#A13544")),
                ("ROUNDEDCORNERS", [3]),
            ]))
            story.append(err_tbl)
            story.append(Spacer(1, 1.5*mm))

    story.append(Spacer(1, 5*mm))

    # ── Regulatory reference ──────────────────────────────────────────────────
    story.append(HRFlowable(width=usable_w, thickness=0.5, color=BORDER))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph("REGULATORY REFERENCE — CAO 48.1 Appendix 4B (Medical Transport & Emergency Service Operations)", section_style))

    rules = [
        ("Sleeping accom (SDRP 2+ hrs)",
         "FDP extended by full SDRP duration. Post-break segment must not exceed the FDP limit applicable to a fresh FCM departing at the break-end time. Total FDP including SDRP must not exceed 16 hours."),
        ("Resting accom (SDRP 2+ hrs)",
         "FDP extended by half the SDRP duration, to a maximum of +2 hours. Total FDP must not exceed 16 hours."),
        ("Night window (2300–0529 local)",
         "If the SDRP spans any period between 2300 and 0529, the SDRP must be a minimum of 7 hours with sleeping accommodation. No reduction of the subsequent ODP is permitted."),
        ("Off Duty Period (ODP) — App. 4B",
         "No reduction applies — the full SDRP duration counts. EBA Cl 18.5 applies: minimum 10 hrs ODP where combined flight time is 10 hrs or less; minimum 12 hrs where combined flight time exceeds 10 hrs."),
        ("EBA 2025 Cl 20.3(d) & (e)",
         "An FDP already commenced may be extended to the CAO 48.1 maximum. Where an extension occurs, the crew member must receive a rest period of not less than 9 consecutive hours (including 2200–0600) plus 1 additional hour for each 15-minute increment the flight time exceeded 8 hours."),
    ]
    for rule_title, rule_body in rules:
        rule_data = [[
            Paragraph(rule_title, S("RT", fontName="Helvetica-Bold", fontSize=8,
                textColor=TEAL, leading=10)),
            Paragraph(rule_body, S("RB", fontName="Helvetica", fontSize=8,
                textColor=TEXT, leading=11)),
        ]]
        rule_tbl = Table(rule_data, colWidths=[usable_w*0.28, usable_w*0.72])
        rule_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), SURFACE),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
            ("LEFTPADDING", (0,0), (0,-1), 8),
            ("LEFTPADDING", (1,0), (1,-1), 6),
            ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ("LINEBELOW", (0,0), (-1,-1), 0.3, BORDER),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
        ]))
        story.append(rule_tbl)

    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        f"Generated by RFDS Medivac.ai  ·  {generated_at}  ·  "
        f"This document is a planning reference only. Verify all calculations against current CAO 48.1 and applicable EBA before operational use.",
        footer_style))

    doc.build(story)
    return out_path


if __name__ == "__main__":
    payload = json.loads(sys.argv[1])
    out     = sys.argv[2]
    build_pdf(payload, out)
    print(out)
