#!/usr/bin/env python3
"""
AiGovOps Foundation Framework — Audit Report PDF Generator
Generates a branded, cryptographically-verified audit log PDF.
"""

import argparse
import hashlib
import io
import os
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone

import qrcode
from PIL import Image as PILImage

from reportlab.lib import colors
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.graphics.shapes import Drawing, Path, String, Rect
from reportlab.graphics import renderPDF

# ── Brand colors ──────────────────────────────────────────────────────────────
NAVY = HexColor("#1B3A6B")
NAVY_LIGHT = HexColor("#243F6B")
TEAL = HexColor("#01696F")
TEAL_LIGHT = HexColor("#E8F3F4")
ROW_ALT = HexColor("#EEF1F7")
TEXT_DARK = HexColor("#1A1A2E")
TEXT_MUTED = HexColor("#5A6272")
BORDER = HexColor("#C8CDD8")
BG_WHITE = HexColor("#FFFFFF")
COVER_BG = NAVY

PAGE_W, PAGE_H = letter
MARGIN = 0.65 * inch

# ── Sample demo data (used when no DB exists) ─────────────────────────────────
DEMO_ENTRIES = [
    {
        "id": 1,
        "timestamp": "2026-04-01T08:15:22Z",
        "user": "bob.rapp@aigovops.org",
        "prompt": "Initialize governance framework baseline configuration",
        "results": "Framework v1 baseline committed. 12 policies registered.",
        "prev_hash": "0000000000000000",
        "current_hash": None,
    },
    {
        "id": 2,
        "timestamp": "2026-04-03T11:42:05Z",
        "user": "ken.johnston@aigovops.org",
        "prompt": "Run AI technical debt audit across production models",
        "results": "Audit complete. 3 high-severity, 7 medium items flagged.",
        "prev_hash": None,
        "current_hash": None,
    },
    {
        "id": 3,
        "timestamp": "2026-04-07T14:30:18Z",
        "user": "bob.rapp@aigovops.org",
        "prompt": "Validate operational compliance checklist for Q2",
        "results": "Q2 compliance validation passed. 47/47 controls satisfied.",
        "prev_hash": None,
        "current_hash": None,
    },
    {
        "id": 4,
        "timestamp": "2026-04-12T09:05:44Z",
        "user": "reviewer@aigovops.org",
        "prompt": "Generate community standards review report",
        "results": "Report generated. 2 new standards proposed for RFC.",
        "prev_hash": None,
        "current_hash": None,
    },
    {
        "id": 5,
        "timestamp": "2026-04-20T16:55:30Z",
        "user": "ken.johnston@aigovops.org",
        "prompt": "Export immutable audit snapshot for April 2026",
        "results": "Snapshot exported. Hash chain verified. All entries intact.",
        "prev_hash": None,
        "current_hash": None,
    },
]


def build_demo_hash_chain(entries):
    """Build a proper SHA-256 hash chain from demo entries."""
    for i, entry in enumerate(entries):
        if i == 0:
            entry["prev_hash"] = "0" * 64
        else:
            entry["prev_hash"] = entries[i - 1]["current_hash"]
        payload = (
            f"{entry['id']}|{entry['timestamp']}|{entry['user']}|"
            f"{entry['prompt']}|{entry['results']}|{entry['prev_hash']}"
        )
        entry["current_hash"] = hashlib.sha256(payload.encode()).hexdigest()
    return entries


def load_from_db(db_path):
    """Load audit log entries from SQLite database."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    # Try common column names; adapt as needed
    try:
        cur.execute(
            """SELECT id, timestamp, user, prompt, results,
                      prev_hash, current_hash
               FROM audit_logs ORDER BY id ASC"""
        )
        rows = [dict(r) for r in cur.fetchall()]
    except sqlite3.OperationalError:
        # Try alternate schema
        try:
            cur.execute("SELECT * FROM audit_logs ORDER BY rowid ASC")
            rows = [dict(r) for r in cur.fetchall()]
        except sqlite3.OperationalError as e:
            print(f"[WARN] Could not read audit_logs: {e}. Using demo data.", file=sys.stderr)
            rows = None
    conn.close()
    return rows


def verify_hash_chain(entries):
    """
    Verify the SHA-256 hash chain.
    Returns (is_valid, broken_at_id) where broken_at_id is None if valid.
    """
    for i, entry in enumerate(entries):
        expected_prev = "0" * 64 if i == 0 else entries[i - 1].get("current_hash", "")
        actual_prev = entry.get("prev_hash", "")
        if actual_prev != expected_prev:
            return False, entry.get("id", i + 1)
    return True, None


def make_qr_image(url, size_px=180):
    """Generate a QR code PNG in memory and return as a BytesIO."""
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=6,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B3A6B", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def draw_shield_logo(c, x, y, size=48):
    """
    Draw an SVG-style shield with 'AG' text using ReportLab canvas primitives.
    x, y is the center-bottom of the shield.
    """
    w = size * 0.75
    h = size

    # Shield path (relative to x, y bottom-center)
    # Shield shape: rounded top, pointed bottom
    left = x - w / 2
    right = x + w / 2
    top = y + h
    mid_y = y + h * 0.45  # where sides start curving inward

    c.saveState()

    # Fill: teal gradient-like flat fill
    c.setFillColor(TEAL)
    c.setStrokeColor(white)
    c.setLineWidth(1.5)

    p = c.beginPath()
    # Start at top-left, go across top, down right, converge to bottom point
    radius = w * 0.18
    # Top-left corner
    p.moveTo(left + radius, top)
    # Top edge
    p.lineTo(right - radius, top)
    # Top-right arc
    p.arcTo(right - 2 * radius, top - 2 * radius, right, top, 0, 90)
    # Right side → curve inward toward bottom
    p.lineTo(right, mid_y)
    # Bottom-right → point
    p.lineTo(x, y)
    # Bottom-left ← point
    p.lineTo(left, mid_y)
    # Left side up
    p.lineTo(left, top - radius)
    # Top-left arc
    p.arcTo(left, top - 2 * radius, left + 2 * radius, top, 90, 90)
    p.close()
    c.drawPath(p, fill=1, stroke=1)

    # Inner shield highlight (lighter teal strip)
    c.setFillColor(HexColor("#02818A"))
    c.setStrokeColor(HexColor("#02818A"))
    inset = size * 0.08
    il = left + inset
    ir = right - inset
    it = top - inset
    im = mid_y + inset * 0.3

    p2 = c.beginPath()
    p2.moveTo(il + radius * 0.5, it)
    p2.lineTo(ir - radius * 0.5, it)
    p2.arcTo(ir - radius, it - radius, ir, it, 0, 90)
    p2.lineTo(ir, im)
    p2.lineTo(x, y + inset * 1.5)
    p2.lineTo(il, im)
    p2.lineTo(il, it - radius * 0.5)
    p2.arcTo(il, it - radius, il + radius, it, 90, 90)
    p2.close()
    c.drawPath(p2, fill=1, stroke=0)

    # "AG" text centered in shield
    font_size = size * 0.38
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", font_size)
    text_y = y + h * 0.36
    c.drawCentredString(x, text_y, "AG")

    c.restoreState()


# ── Page template helpers ─────────────────────────────────────────────────────
class AuditDocTemplate(BaseDocTemplate):
    """Custom doc template that tracks total pages for 'Page X of Y' footer."""

    def __init__(self, filename, **kwargs):
        self.total_pages = 0
        BaseDocTemplate.__init__(self, filename, **kwargs)

    def afterFlowable(self, flowable):
        pass


def make_footer(c, doc, total_pages=None):
    """Draw the standard footer on a page."""
    c.saveState()
    footer_y = MARGIN * 0.5
    page_w = PAGE_W

    # Left: org name + URL
    c.setFont("Helvetica", 7.5)
    c.setFillColor(TEXT_MUTED)
    c.drawString(MARGIN, footer_y, "AiGovOps Foundation — www.aigovopsfoundation.org")

    # Center: CONFIDENTIAL
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(NAVY)
    c.drawCentredString(page_w / 2, footer_y, "CONFIDENTIAL — Owner Access Only")

    # Right: page number
    c.setFont("Helvetica", 7.5)
    c.setFillColor(TEXT_MUTED)
    if total_pages:
        page_text = f"Page {doc.page} of {total_pages}"
    else:
        page_text = f"Page {doc.page}"
    c.drawRightString(page_w - MARGIN, footer_y, page_text)

    # Thin rule above footer
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)
    c.line(MARGIN, footer_y + 10, page_w - MARGIN, footer_y + 10)

    c.restoreState()


def make_header_line(c, doc):
    """Draw a thin navy rule under the header area (non-cover pages)."""
    c.saveState()
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.5)
    c.line(MARGIN, PAGE_H - MARGIN + 4, PAGE_W - MARGIN, PAGE_H - MARGIN + 4)
    c.restoreState()


def cover_page_cb(c, doc):
    """Cover page: full navy background, no header rule."""
    make_footer(c, doc, total_pages=getattr(doc, "_total_pages", None))


def inner_page_cb(c, doc):
    """Interior pages: header rule + footer."""
    make_header_line(c, doc)
    make_footer(c, doc, total_pages=getattr(doc, "_total_pages", None))


# ── Style helpers ─────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=white,
        spaceAfter=10,
        alignment=1,  # center
    )
    styles["cover_subtitle"] = ParagraphStyle(
        "cover_subtitle",
        fontName="Helvetica",
        fontSize=13,
        leading=18,
        textColor=HexColor("#A8C4E0"),
        spaceAfter=6,
        alignment=1,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=HexColor("#C8D8EC"),
        alignment=1,
    )
    styles["section_heading"] = ParagraphStyle(
        "section_heading",
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=20,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=8,
        borderPadding=(0, 0, 4, 0),
    )
    styles["subsection"] = ParagraphStyle(
        "subsection",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=4,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=6,
    )
    styles["body_muted"] = ParagraphStyle(
        "body_muted",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=TEXT_MUTED,
        spaceAfter=4,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        leftIndent=16,
        spaceAfter=4,
        bulletIndent=4,
    )
    styles["pillar_name"] = ParagraphStyle(
        "pillar_name",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=TEAL,
        spaceAfter=2,
    )
    styles["mono"] = ParagraphStyle(
        "mono",
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
        spaceAfter=4,
        backColor=HexColor("#F0F2F6"),
        leftIndent=8,
        rightIndent=8,
        borderPadding=4,
    )
    styles["hash_label"] = ParagraphStyle(
        "hash_label",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=12,
        textColor=TEXT_MUTED,
        spaceAfter=2,
    )
    styles["hash_value"] = ParagraphStyle(
        "hash_value",
        fontName="Courier-Bold",
        fontSize=8,
        leading=11,
        textColor=TEAL,
        spaceAfter=6,
    )
    styles["table_header"] = ParagraphStyle(
        "table_header",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=white,
    )
    styles["table_cell"] = ParagraphStyle(
        "table_cell",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=TEXT_DARK,
        wordWrap="CJK",
    )
    styles["table_cell_mono"] = ParagraphStyle(
        "table_cell_mono",
        fontName="Courier",
        fontSize=7,
        leading=9,
        textColor=TEXT_MUTED,
    )
    styles["verify_ok"] = ParagraphStyle(
        "verify_ok",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=HexColor("#1A7A40"),
        spaceAfter=6,
    )
    styles["verify_fail"] = ParagraphStyle(
        "verify_fail",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=HexColor("#A12C2C"),
        spaceAfter=6,
    )
    return styles


# ── Cover page (canvas-drawn, no Platypus frames) ─────────────────────────────
def draw_cover(c, doc, entries, qr_buf):
    """Draw the full cover page directly on the canvas."""
    c.saveState()

    w, h = PAGE_W, PAGE_H

    # Full navy background
    c.setFillColor(COVER_BG)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Decorative teal band — left vertical stripe
    c.setFillColor(TEAL)
    c.rect(0, 0, 6, h, fill=1, stroke=0)

    # Decorative light teal angled band at bottom
    c.setFillColor(HexColor("#0D4E56"))
    c.rect(0, 0, w, 0.18 * h, fill=1, stroke=0)

    # Subtle grid dots
    c.setFillColor(HexColor("#243F6B"))
    dot_spacing = 28
    dot_r = 1.2
    for gx in range(int(w // dot_spacing) + 2):
        for gy in range(int(h // dot_spacing) + 2):
            c.circle(gx * dot_spacing, gy * dot_spacing, dot_r, fill=1, stroke=0)

    # Shield logo — centered upper area
    shield_x = w / 2
    shield_y = h * 0.62
    draw_shield_logo(c, shield_x, shield_y, size=72)

    # "AiGovOps Foundation" above shield
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#A8C4E0"))
    c.drawCentredString(w / 2, h * 0.78, "AiGovOps Foundation")

    # Title
    title_y = h * 0.56
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(white)
    c.drawCentredString(w / 2, title_y, "AiGovOps Foundation Framework")
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(w / 2, title_y - 26, "April 2026 v1")

    # Divider line
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.5)
    div_y = title_y - 42
    c.line(w * 0.25, div_y, w * 0.75, div_y)

    # Subtitle
    c.setFont("Helvetica", 12)
    c.setFillColor(HexColor("#A8C4E0"))
    c.drawCentredString(w / 2, div_y - 18, "Immutable Audit Log — Compliance Artifact")

    # Co-founder attribution
    attr_y = div_y - 48
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(HexColor("#C8D8EC"))
    c.drawCentredString(w / 2, attr_y, "Co-Founders: Bob Rapp & Ken Johnston")

    # Date
    date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#8AAAC8"))
    c.drawCentredString(w / 2, attr_y - 16, f"Report Generated: {date_str} UTC")

    # Entry count badge
    c.setFillColor(TEAL)
    badge_x, badge_y, badge_w, badge_h = w / 2 - 60, attr_y - 50, 120, 24
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(white)
    c.drawCentredString(w / 2, badge_y + 7, f"{len(entries)} Audit Entries")

    # QR code — bottom right
    qr_size = 88
    qr_x = w - MARGIN - qr_size
    qr_y = MARGIN * 0.9
    c.drawImage(
        qr_buf,
        qr_x, qr_y,
        width=qr_size, height=qr_size,
        preserveAspectRatio=True,
    )
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#8AAAC8"))
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 10, "aigovopsfoundation.org")

    # Bottom footer on cover
    c.setFont("Helvetica", 7.5)
    c.setFillColor(HexColor("#6A8AAC"))
    c.drawString(MARGIN, MARGIN * 0.7, "AiGovOps Foundation — www.aigovopsfoundation.org")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(HexColor("#8AAAC8"))
    c.drawCentredString(w / 2, MARGIN * 0.7, "CONFIDENTIAL — Owner Access Only")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(HexColor("#6A8AAC"))
    c.drawRightString(w - MARGIN, MARGIN * 0.7, "Page 1")

    c.restoreState()


# ── Section: Executive Summary ────────────────────────────────────────────────
def build_exec_summary(styles):
    story = []

    # Page heading with teal rule
    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header("Executive Summary", styles))

    story.append(Paragraph(
        "The <b>AiGovOps Foundation Framework</b> is an open, community-driven governance standard "
        "for responsible AI operations. It provides organizations with a structured approach to "
        "deploying, auditing, and maintaining AI systems in compliance with evolving regulatory "
        "requirements and industry best practices.",
        styles["body"],
    ))

    story.append(Paragraph(
        "This report constitutes an <b>immutable compliance artifact</b> — a cryptographically "
        "chained audit log of all governance operations performed under the framework. Each entry "
        "is linked to its predecessor via SHA-256 hash, creating a tamper-evident chain of "
        "accountability that can be independently verified.",
        styles["body"],
    ))

    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("Core Pillars", styles["subsection"]))

    pillars = [
        (
            "1  |  Governance as Code",
            "All governance policies, compliance rules, and operational constraints are version-controlled "
            "artifacts — reviewable, auditable, and deployable like software. Changes are tracked with "
            "full provenance.",
        ),
        (
            "2  |  AI Technical Debt Elimination",
            "Systematic identification and remediation of model drift, data quality issues, shadow AI, "
            "and undocumented model dependencies. The framework mandates regular debt audits and "
            "enforces remediation SLAs.",
        ),
        (
            "3  |  Operational Compliance",
            "Continuous verification that AI systems meet applicable regulations (EU AI Act, NIST AI RMF, "
            "ISO/IEC 42001). Compliance checks are automated, logged, and tied to cryptographic proofs "
            "of execution.",
        ),
        (
            "4  |  Community-Driven Standards",
            "Governance standards are developed collaboratively via public RFC processes, peer review, "
            "and consensus ratification. No single vendor controls the standard — it belongs to the "
            "community of practitioners.",
        ),
    ]

    for name, desc in pillars:
        pillar_data = [
            [
                Paragraph(name, styles["pillar_name"]),
                Paragraph(desc, styles["body_muted"]),
            ]
        ]
        pillar_table = Table(pillar_data, colWidths=[1.55 * inch, 5.0 * inch])
        pillar_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (0, 0), 8),
            ("RIGHTPADDING", (0, 0), (0, 0), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LINEAFTER", (0, 0), (0, 0), 1.5, TEAL),
            ("BACKGROUND", (0, 0), (-1, -1), TEAL_LIGHT),
            ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ]))
        story.append(pillar_table)
        story.append(Spacer(1, 0.06 * inch))

    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph("What This Report Contains", styles["subsection"]))

    contents = [
        "Audit Log Table — every governance operation captured with user, prompt, outcome, and hash linkage.",
        "Hash Chain Verification — cryptographic proof of log integrity with first/last hash display.",
        "Verification Status — pass/fail result of the full chain audit, suitable for regulatory submission.",
    ]
    for item in contents:
        story.append(Paragraph(f"&#8226;  {item}", styles["bullet"]))

    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        'More information at <a href="https://www.aigovopsfoundation.org/" color="#01696F">'
        'www.aigovopsfoundation.org</a>.',
        styles["body_muted"],
    ))

    return story


# ── Section: Audit Log Table ──────────────────────────────────────────────────
def build_audit_table(entries, styles):
    story = []

    story.append(PageBreak())
    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header("Audit Log — Immutable Hash Chain Table", styles))

    story.append(Paragraph(
        f"The following table presents all {len(entries)} audit log entries in chronological order. "
        "Each entry records the actor, operation, outcome, and cryptographic link to the preceding "
        "entry. Hashes are truncated to 15 characters for display; full hashes appear in the "
        "verification section.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.12 * inch))

    def trunc_hash(h, n=15):
        if not h:
            return "—"
        h = str(h)
        return h[:n] + "..." if len(h) > n else h

    def wrap(text, style):
        return Paragraph(str(text) if text else "—", style)

    # Table header
    header = [
        wrap("#", styles["table_header"]),
        wrap("Timestamp", styles["table_header"]),
        wrap("User", styles["table_header"]),
        wrap("Prompt", styles["table_header"]),
        wrap("Results", styles["table_header"]),
        wrap("Prev Hash", styles["table_header"]),
        wrap("Current Hash", styles["table_header"]),
    ]

    col_widths = [
        0.28 * inch,   # #
        1.05 * inch,   # Timestamp
        1.05 * inch,   # User
        1.40 * inch,   # Prompt
        1.30 * inch,   # Results
        0.95 * inch,   # Prev Hash
        0.97 * inch,   # Current Hash
    ]

    table_data = [header]
    for entry in entries:
        ts = str(entry.get("timestamp", ""))
        # Shorten timestamp for display
        if "T" in ts:
            ts = ts.replace("T", "\n").replace("Z", " UTC")
        row = [
            wrap(str(entry.get("id", "")), styles["table_cell"]),
            wrap(ts, styles["table_cell_mono"]),
            wrap(str(entry.get("user", "")), styles["table_cell"]),
            wrap(str(entry.get("prompt", "")), styles["table_cell"]),
            wrap(str(entry.get("results", "")), styles["table_cell"]),
            wrap(trunc_hash(entry.get("prev_hash", "")), styles["table_cell_mono"]),
            wrap(trunc_hash(entry.get("current_hash", "")), styles["table_cell_mono"]),
        ]
        table_data.append(row)

    table = Table(table_data, colWidths=col_widths, repeatRows=1)

    row_count = len(table_data)
    alt_rows = [(i, i) for i in range(2, row_count, 2)]

    style_cmds = [
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("LEFTPADDING", (0, 0), (-1, 0), 5),
        ("RIGHTPADDING", (0, 0), (-1, 0), 5),
        # Body rows
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("FONTSIZE", (0, 1), (-1, -1), 7.5),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),  # # column
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LEFTPADDING", (0, 1), (-1, -1), 5),
        ("RIGHTPADDING", (0, 1), (-1, -1), 5),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, TEAL),
    ]

    # Alternating row backgrounds
    for (r, _) in alt_rows:
        style_cmds.append(("BACKGROUND", (0, r), (-1, r), ROW_ALT))

    table.setStyle(TableStyle(style_cmds))
    story.append(table)

    return story


# ── Section: Hash Chain Verification ─────────────────────────────────────────
def build_verification_section(entries, styles):
    story = []

    story.append(PageBreak())
    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header("Hash Chain Verification", styles))

    story.append(Paragraph(
        "The AiGovOps audit log employs a SHA-256 cryptographic hash chain to guarantee "
        "tamper-evidence. Each entry's <b>current_hash</b> is derived from the concatenation of "
        "its own fields and the <b>current_hash</b> of the preceding entry. Modifying any entry "
        "invalidates all subsequent hashes, making silent alterations detectable.",
        styles["body"],
    ))

    # Mechanism diagram (text-based)
    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph("Chain Mechanism", styles["subsection"]))

    mechanism_text = (
        "Entry N fields: { id, timestamp, user, prompt, results, prev_hash }\n"
        "current_hash(N) = SHA-256( id | timestamp | user | prompt | results | current_hash(N-1) )\n"
        "prev_hash(N)     = current_hash(N-1)\n"
        "Genesis entry:   prev_hash = '0' × 64"
    )
    story.append(Paragraph(mechanism_text, styles["mono"]))

    story.append(Spacer(1, 0.15 * inch))

    # Chain verification result
    chain_valid, broken_at = verify_hash_chain(entries)

    verify_data = []
    if chain_valid:
        verify_data.append(Paragraph(
            "&#10003;  Hash Chain VERIFIED — All entries intact, no tampering detected.",
            styles["verify_ok"],
        ))
    else:
        verify_data.append(Paragraph(
            f"&#10007;  Hash Chain BROKEN — Integrity failure detected at entry ID {broken_at}. "
            "This log may have been tampered with.",
            styles["verify_fail"],
        ))

    story.extend(verify_data)
    story.append(Spacer(1, 0.15 * inch))

    # First and last entry hashes
    story.append(Paragraph("Chain Anchors", styles["subsection"]))
    story.append(Paragraph(
        "The first and last hashes anchor the chain. Any third party can verify integrity "
        "by recomputing the chain from source data and comparing these values.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.08 * inch))

    if entries:
        first = entries[0]
        last = entries[-1]

        anchor_data = [
            ["Entry", "Field", "Value"],
            [
                f"First Entry\n(ID: {first.get('id', '?')})",
                "current_hash",
                str(first.get("current_hash", "N/A")),
            ],
            [
                f"Last Entry\n(ID: {last.get('id', '?')})",
                "current_hash",
                str(last.get("current_hash", "N/A")),
            ],
        ]

        def wrap_anchor(text, font="Helvetica", size=8.5, color=TEXT_DARK):
            st = ParagraphStyle(
                "a", fontName=font, fontSize=size, leading=12, textColor=color
            )
            return Paragraph(str(text), st)

        anchor_display = [
            [
                wrap_anchor("Entry", "Helvetica-Bold", color=white),
                wrap_anchor("Field", "Helvetica-Bold", color=white),
                wrap_anchor("Full SHA-256 Hash", "Helvetica-Bold", color=white),
            ],
            [
                wrap_anchor(f"First\n(ID: {first.get('id', '?')})", "Helvetica-Bold", color=NAVY),
                wrap_anchor("current_hash", "Helvetica"),
                wrap_anchor(str(first.get("current_hash", "N/A")), "Courier", 7.5, TEAL),
            ],
            [
                wrap_anchor(f"Last\n(ID: {last.get('id', '?')})", "Helvetica-Bold", color=NAVY),
                wrap_anchor("current_hash", "Helvetica"),
                wrap_anchor(str(last.get("current_hash", "N/A")), "Courier", 7.5, TEAL),
            ],
        ]

        anchor_table = Table(
            anchor_display,
            colWidths=[0.85 * inch, 1.0 * inch, 5.15 * inch],
        )
        anchor_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8.5),
            ("BACKGROUND", (0, 1), (-1, 1), TEAL_LIGHT),
            ("BACKGROUND", (0, 2), (-1, 2), white),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("LINEBELOW", (0, 0), (-1, 0), 1.5, TEAL),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(anchor_table)

    story.append(Spacer(1, 0.2 * inch))

    # Total entry count summary
    story.append(Paragraph("Audit Summary", styles["subsection"]))
    summary_rows = [
        ["Total Audit Entries", str(len(entries))],
        ["Hash Algorithm", "SHA-256"],
        ["Chain Status", "VERIFIED" if chain_valid else f"BROKEN at entry {broken_at}"],
        ["Genesis Hash Seed", "0" * 16 + "... (64 zero chars)"],
        ["Report Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Framework Version", "April 2026 v1"],
        ["Co-Founders", "Bob Rapp & Ken Johnston"],
    ]

    status_color = HexColor("#1A7A40") if chain_valid else HexColor("#A12C2C")

    summary_table_data = []
    for i, (label, value) in enumerate(summary_rows):
        val_color = status_color if label == "Chain Status" else TEXT_DARK
        val_font = "Helvetica-Bold" if label == "Chain Status" else "Helvetica"
        summary_table_data.append([
            Paragraph(label, ParagraphStyle("sl", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=TEXT_MUTED)),
            Paragraph(value, ParagraphStyle("sv", fontName=val_font, fontSize=9, leading=12, textColor=val_color)),
        ])

    summary_table = Table(summary_table_data, colWidths=[2.0 * inch, 5.0 * inch])
    summary_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("BACKGROUND", (0, 0), (0, -1), HexColor("#F3F5FA")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(summary_table)

    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(
        'This report was generated by the AiGovOps Foundation audit toolchain. '
        'For verification tools and source code, visit '
        '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.',
        styles["body_muted"],
    ))

    return story


# ── Utility ───────────────────────────────────────────────────────────────────
def _section_header(title, styles):
    """Returns a styled section header paragraph with a left teal accent bar implemented via table."""
    data = [[Paragraph(title, styles["section_heading"])]]
    t = Table(data, colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 2.5, TEAL),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


# ── Main PDF builder ──────────────────────────────────────────────────────────
def generate_pdf(entries, output_path):
    """Build the full multi-page audit PDF."""

    # Generate QR code
    qr_buf_pil = make_qr_image("https://www.aigovopsfoundation.org/")
    # Save to temp file for ReportLab ImageReader
    qr_tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    qr_tmp.write(qr_buf_pil.read())
    qr_tmp.flush()
    qr_tmp_path = qr_tmp.name
    qr_tmp.close()

    styles = build_styles()

    # ── Two-pass: first pass to count pages, second to render ─────────────────
    # We use a single-pass approach with a custom canvas that records total pages
    # via a deferred-render trick using a buffer + setTitle after.

    # Build the Platypus story (pages 2+)
    story = []

    # Page 2: Executive Summary
    story.extend(build_exec_summary(styles))

    # Pages 3+: Audit Log Table
    story.extend(build_audit_table(entries, styles))

    # Pages N+: Hash Verification
    story.extend(build_verification_section(entries, styles))

    # ── Document setup ────────────────────────────────────────────────────────
    doc = AuditDocTemplate(
        output_path,
        pagesize=letter,
        title="AiGovOps Foundation Framework — April 2026 v1",
        author="Perplexity Computer",
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN * 1.2,
    )

    # Cover uses full-canvas drawing, no frame needed (we use a dummy frame)
    cover_frame = Frame(
        0, 0, PAGE_W, PAGE_H,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    content_frame = Frame(
        MARGIN, MARGIN * 1.2,
        PAGE_W - 2 * MARGIN, PAGE_H - MARGIN - MARGIN * 1.2,
        id="content",
    )

    cover_template = PageTemplate(
        id="Cover",
        frames=[cover_frame],
        onPage=lambda c, d: draw_cover(c, d, entries, qr_tmp_path),
    )
    inner_template = PageTemplate(
        id="Inner",
        frames=[content_frame],
        onPage=inner_page_cb,
    )

    doc.addPageTemplates([cover_template, inner_template])

    # Insert template switches into story
    # Cover page is blank flowable (drawing happens via onPage callback)
    from reportlab.platypus import Flowable

    class BlankPage(Flowable):
        def __init__(self):
            Flowable.__init__(self)
            self.width = PAGE_W
            self.height = PAGE_H

        def draw(self):
            pass

        def wrap(self, aW, aH):
            return (aW, aH)

    full_story = (
        [BlankPage(), NextPageTemplate("Inner"), PageBreak()]
        + story
    )

    doc.build(full_story)

    # Cleanup temp QR file
    try:
        os.unlink(qr_tmp_path)
    except Exception:
        pass

    print(f"[OK] PDF written to: {output_path}")
    return output_path


# ── CLI entrypoint ────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Generate AiGovOps Foundation audit report PDF."
    )
    parser.add_argument(
        "--db",
        default="./openclaw.db",
        help="Path to openclaw.db SQLite database (default: ./openclaw.db)",
    )
    parser.add_argument(
        "--output",
        default="./aigovops-audit-report.pdf",
        help="Output PDF path (default: ./aigovops-audit-report.pdf)",
    )
    args = parser.parse_args()

    # Load entries
    entries = None
    if os.path.exists(args.db):
        print(f"[INFO] Loading audit log from: {args.db}")
        entries = load_from_db(args.db)

    if not entries:
        print("[INFO] Using demo data (no DB found or DB returned no rows).")
        entries = build_demo_hash_chain(DEMO_ENTRIES)
    else:
        print(f"[INFO] Loaded {len(entries)} entries from database.")

    generate_pdf(entries, args.output)


if __name__ == "__main__":
    main()
