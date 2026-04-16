#!/usr/bin/env python3
"""
AiGovOps Foundation Framework — Audit Report PDF Generator
Generates a branded, cryptographically-verified audit log PDF.
Supports 15 languages with RTL layout for Arabic, Urdu, and Pashto.
"""

import argparse
import hashlib
import io
import json
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
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
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

RTL_LANGS = {"ar", "ur", "ps"}

# ── Font paths ────────────────────────────────────────────────────────────────
_FONT_DIR_TTF = "/usr/share/fonts/truetype/noto/"
_FONT_DIR_OTF = "/usr/share/fonts/opentype/noto/"

_FONT_PATHS = {
    "NotoSans-Regular":         _FONT_DIR_TTF + "NotoSans-Regular.ttf",
    "NotoSans-Bold":            _FONT_DIR_TTF + "NotoSans-Bold.ttf",
    # CJK: use WenQuanYi Zen Hei (TrueType, works with ReportLab)
    # NotoSansCJK-*.ttc uses CFF/PostScript outlines which ReportLab cannot embed
    "NotoSansCJK-Regular":      "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "NotoSansCJK-Bold":         "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "NotoNaskhArabic-Regular":  _FONT_DIR_TTF + "NotoNaskhArabic-Regular.ttf",
    "NotoNaskhArabic-Bold":     _FONT_DIR_TTF + "NotoNaskhArabic-Bold.ttf",
    "NotoNastaliqUrdu-Regular": _FONT_DIR_TTF + "NotoNastaliqUrdu-Regular.ttf",
    "NotoNastaliqUrdu-Bold":    _FONT_DIR_TTF + "NotoNastaliqUrdu-Bold.ttf",
    "NotoSansDevanagari-Regular": _FONT_DIR_TTF + "NotoSansDevanagari-Regular.ttf",
    "NotoSansDevanagari-Bold":  _FONT_DIR_TTF + "NotoSansDevanagari-Bold.ttf",
    "NotoSansCherokee-Regular": _FONT_DIR_TTF + "NotoSansCherokee-Regular.ttf",
    "NotoSansCherokee-Bold":    _FONT_DIR_TTF + "NotoSansCherokee-Bold.ttf",
}

_FONTS_REGISTERED = False


def register_fonts():
    """Register all script-specific Noto fonts with ReportLab."""
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return

    # Latin/Cyrillic
    pdfmetrics.registerFont(TTFont("NotoSans-Regular", _FONT_PATHS["NotoSans-Regular"]))
    pdfmetrics.registerFont(TTFont("NotoSans-Bold", _FONT_PATHS["NotoSans-Bold"]))

    # CJK: WenQuanYi Zen Hei — TrueType CJK font (NotoSansCJK uses CFF/PostScript which ReportLab can't embed)
    # WQY subfontIndex=0 = Regular, subfontIndex=1 = Sharp (used as bold substitute)
    pdfmetrics.registerFont(TTFont("NotoSansCJK-Regular", _FONT_PATHS["NotoSansCJK-Regular"], subfontIndex=0))
    pdfmetrics.registerFont(TTFont("NotoSansCJK-Bold", _FONT_PATHS["NotoSansCJK-Bold"], subfontIndex=1))

    # Arabic / Pashto
    pdfmetrics.registerFont(TTFont("NotoNaskhArabic-Regular", _FONT_PATHS["NotoNaskhArabic-Regular"]))
    pdfmetrics.registerFont(TTFont("NotoNaskhArabic-Bold", _FONT_PATHS["NotoNaskhArabic-Bold"]))

    # Urdu
    pdfmetrics.registerFont(TTFont("NotoNastaliqUrdu-Regular", _FONT_PATHS["NotoNastaliqUrdu-Regular"]))
    pdfmetrics.registerFont(TTFont("NotoNastaliqUrdu-Bold", _FONT_PATHS["NotoNastaliqUrdu-Bold"]))

    # Hindi (Devanagari)
    pdfmetrics.registerFont(TTFont("NotoSansDevanagari-Regular", _FONT_PATHS["NotoSansDevanagari-Regular"]))
    pdfmetrics.registerFont(TTFont("NotoSansDevanagari-Bold", _FONT_PATHS["NotoSansDevanagari-Bold"]))

    # Cherokee
    pdfmetrics.registerFont(TTFont("NotoSansCherokee-Regular", _FONT_PATHS["NotoSansCherokee-Regular"]))
    pdfmetrics.registerFont(TTFont("NotoSansCherokee-Bold", _FONT_PATHS["NotoSansCherokee-Bold"]))

    _FONTS_REGISTERED = True


def get_font_for_lang(lang_code):
    """Return (regular_font_name, bold_font_name) for a language code."""
    mapping = {
        "en":  ("Helvetica", "Helvetica-Bold"),
        "fr":  ("NotoSans-Regular", "NotoSans-Bold"),
        "de":  ("NotoSans-Regular", "NotoSans-Bold"),
        "pt":  ("NotoSans-Regular", "NotoSans-Bold"),
        "es":  ("NotoSans-Regular", "NotoSans-Bold"),
        "ru":  ("NotoSans-Regular", "NotoSans-Bold"),
        "tr":  ("NotoSans-Regular", "NotoSans-Bold"),
        "sw":  ("NotoSans-Regular", "NotoSans-Bold"),
        "zh":  ("NotoSansCJK-Regular", "NotoSansCJK-Bold"),
        "ar":  ("NotoNaskhArabic-Regular", "NotoNaskhArabic-Bold"),
        "ps":  ("NotoNaskhArabic-Regular", "NotoNaskhArabic-Bold"),
        "ur":  ("NotoNaskhArabic-Regular", "NotoNaskhArabic-Bold"),
        "hi":  ("NotoSansDevanagari-Regular", "NotoSansDevanagari-Bold"),
        "chr": ("NotoSansCherokee-Regular", "NotoSansCherokee-Bold"),
        "brl": ("Helvetica", "Helvetica-Bold"),
    }
    return mapping.get(lang_code, ("Helvetica", "Helvetica-Bold"))


# ── RTL text reshaping helper ─────────────────────────────────────────────────
def _rtl_canvas_text(text, lang):
    """
    For RTL languages, reshape and reorder Arabic/Urdu/Pashto text
    so it renders correctly on a ReportLab canvas drawString call.
    """
    if lang not in RTL_LANGS:
        return text
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        reshaped = arabic_reshaper.reshape(text)
        return get_display(reshaped)
    except Exception:
        return text


# ── Translation dictionary ────────────────────────────────────────────────────
PDF_TRANSLATIONS = {
    "en": {
        # Cover
        "framework_word":       "Framework",
        "date_version":         "April 2026 v1",
        "immutable_subtitle":   "Immutable Audit Log — Compliance Artifact",
        "cofounders_label":     "Co-Founders:",
        "report_generated":     "Report Generated:",
        "audit_entries":        "Audit Entries",
        "confidential":         "CONFIDENTIAL — Owner Access Only",
        # Executive Summary
        "exec_summary_heading": "Executive Summary",
        "exec_body1": (
            "The <b>AiGovOps Foundation Framework</b> is an open, community-driven governance standard "
            "for responsible AI operations. It provides organizations with a structured approach to "
            "deploying, auditing, and maintaining AI systems in compliance with evolving regulatory "
            "requirements and industry best practices."
        ),
        "exec_body2": (
            "This report constitutes an <b>immutable compliance artifact</b> — a cryptographically "
            "chained audit log of all governance operations performed under the framework. Each entry "
            "is linked to its predecessor via SHA-256 hash, creating a tamper-evident chain of "
            "accountability that can be independently verified."
        ),
        "core_pillars_heading": "Core Pillars",
        "pillar1_name": "1  |  Governance as Code",
        "pillar1_desc": (
            "All governance policies, compliance rules, and operational constraints are version-controlled "
            "artifacts — reviewable, auditable, and deployable like software. Changes are tracked with "
            "full provenance."
        ),
        "pillar2_name": "2  |  AI Technical Debt Elimination",
        "pillar2_desc": (
            "Systematic identification and remediation of model drift, data quality issues, shadow AI, "
            "and undocumented model dependencies. The framework mandates regular debt audits and "
            "enforces remediation SLAs."
        ),
        "pillar3_name": "3  |  Operational Compliance",
        "pillar3_desc": (
            "Continuous verification that AI systems meet applicable regulations (EU AI Act, NIST AI RMF, "
            "ISO/IEC 42001). Compliance checks are automated, logged, and tied to cryptographic proofs "
            "of execution."
        ),
        "pillar4_name": "4  |  Community-Driven Standards",
        "pillar4_desc": (
            "Governance standards are developed collaboratively via public RFC processes, peer review, "
            "and consensus ratification. No single vendor controls the standard — it belongs to the "
            "community of practitioners."
        ),
        "what_contains_heading": "What This Report Contains",
        "bullet1": "Audit Log Table — every governance operation captured with user, prompt, outcome, and hash linkage.",
        "bullet2": "Hash Chain Verification — cryptographic proof of log integrity with first/last hash display.",
        "bullet3": "Verification Status — pass/fail result of the full chain audit, suitable for regulatory submission.",
        "footer_link_text": "More information at",
        # Audit log table
        "audit_table_heading": "Audit Log — Immutable Hash Chain Table",
        "audit_table_intro":   "The following table presents all {n} audit log entries in chronological order. "
                               "Each entry records the actor, operation, outcome, and cryptographic link to the preceding "
                               "entry. Hashes are truncated to 15 characters for display; full hashes appear in the "
                               "verification section.",
        "col_num":        "#",
        "col_timestamp":  "Timestamp",
        "col_user":       "User",
        "col_prompt":     "Prompt",
        "col_results":    "Results",
        "col_prev_hash":  "Prev Hash",
        "col_curr_hash":  "Current Hash",
        # Hash chain verification
        "verify_heading": "Hash Chain Verification",
        "verify_body": (
            "The AiGovOps audit log employs a SHA-256 cryptographic hash chain to guarantee "
            "tamper-evidence. Each entry's <b>current_hash</b> is derived from the concatenation of "
            "its own fields and the <b>current_hash</b> of the preceding entry. Modifying any entry "
            "invalidates all subsequent hashes, making silent alterations detectable."
        ),
        "chain_mechanism_heading": "Chain Mechanism",
        "verify_ok_msg":   "&#10003;  Hash Chain VERIFIED — All entries intact, no tampering detected.",
        "verify_fail_msg": "&#10007;  Hash Chain BROKEN — Integrity failure detected at entry ID {id}. This log may have been tampered with.",
        "chain_anchors_heading": "Chain Anchors",
        "chain_anchors_body": (
            "The first and last hashes anchor the chain. Any third party can verify integrity "
            "by recomputing the chain from source data and comparing these values."
        ),
        "anchor_col_entry":  "Entry",
        "anchor_col_field":  "Field",
        "anchor_col_hash":   "Full SHA-256 Hash",
        "anchor_first":      "First\n(ID: {id})",
        "anchor_last":       "Last\n(ID: {id})",
        "audit_summary_heading": "Audit Summary",
        "summary_total":     "Total Audit Entries",
        "summary_algorithm": "Hash Algorithm",
        "summary_status":    "Chain Status",
        "summary_genesis":   "Genesis Hash Seed",
        "summary_generated": "Report Generated",
        "summary_version":   "Framework Version",
        "summary_cofounders":"Co-Founders",
        "status_verified":   "VERIFIED",
        "status_broken":     "BROKEN at entry {id}",
        "version_value":     "April 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'This report was generated by the AiGovOps Foundation audit toolchain. '
            'For verification tools and source code, visit '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        # Footer
        "footer_org":        "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"CONFIDENTIAL — Owner Access Only",
        "footer_page":       "Page",
        "footer_of":         "of",
    },

    "fr": {
        "framework_word":       "Cadre",
        "date_version":         "Avril 2026 v1",
        "immutable_subtitle":   "Journal d'audit immuable — Artefact de conformité",
        "cofounders_label":     "Co-fondateurs :",
        "report_generated":     "Rapport généré :",
        "audit_entries":        "Entrées d'audit",
        "confidential":         "CONFIDENTIEL — Accès propriétaire uniquement",
        "exec_summary_heading": "Résumé exécutif",
        "exec_body1": (
            "Le <b>cadre AiGovOps Foundation</b> est une norme de gouvernance ouverte et communautaire "
            "pour des opérations d'IA responsables. Il fournit aux organisations une approche structurée "
            "pour déployer, auditer et maintenir les systèmes d'IA en conformité avec les exigences "
            "réglementaires en évolution et les meilleures pratiques du secteur."
        ),
        "exec_body2": (
            "Ce rapport constitue un <b>artefact de conformité immuable</b> — un journal d'audit "
            "cryptographiquement chaîné de toutes les opérations de gouvernance effectuées dans le cadre. "
            "Chaque entrée est liée à son prédécesseur via un hachage SHA-256, créant une chaîne "
            "de responsabilité infalsifiable pouvant être vérifiée de manière indépendante."
        ),
        "core_pillars_heading": "Piliers fondamentaux",
        "pillar1_name": "1  |  Gouvernance en tant que code",
        "pillar1_desc": (
            "Toutes les politiques de gouvernance, règles de conformité et contraintes opérationnelles sont "
            "des artefacts versionnés — révisables, auditables et déployables comme des logiciels. "
            "Les modifications sont suivies avec une provenance complète."
        ),
        "pillar2_name": "2  |  Élimination de la dette technique IA",
        "pillar2_desc": (
            "Identification et remédiation systématiques de la dérive de modèles, des problèmes de qualité "
            "des données, de l'IA fantôme et des dépendances de modèles non documentées. Le cadre impose "
            "des audits réguliers de la dette et applique des SLA de remédiation."
        ),
        "pillar3_name": "3  |  Conformité opérationnelle",
        "pillar3_desc": (
            "Vérification continue que les systèmes d'IA respectent les réglementations applicables "
            "(Acte européen sur l'IA, NIST AI RMF, ISO/IEC 42001). Les contrôles de conformité sont "
            "automatisés, enregistrés et liés à des preuves cryptographiques d'exécution."
        ),
        "pillar4_name": "4  |  Normes pilotées par la communauté",
        "pillar4_desc": (
            "Les normes de gouvernance sont élaborées en collaboration via des processus RFC publics, "
            "une révision par les pairs et une ratification par consensus. Aucun fournisseur unique "
            "ne contrôle la norme — elle appartient à la communauté des praticiens."
        ),
        "what_contains_heading": "Contenu de ce rapport",
        "bullet1": "Tableau du journal d'audit — chaque opération de gouvernance capturée avec l'utilisateur, la requête, le résultat et le lien de hachage.",
        "bullet2": "Vérification de la chaîne de hachage — preuve cryptographique de l'intégrité du journal avec affichage du premier et dernier hachage.",
        "bullet3": "Statut de vérification — résultat réussite/échec de l'audit complet de la chaîne, adapté à la soumission réglementaire.",
        "footer_link_text": "Plus d'informations sur",
        "audit_table_heading": "Journal d'audit — Table de chaîne de hachage immuable",
        "audit_table_intro":   "Le tableau suivant présente les {n} entrées du journal d'audit dans l'ordre chronologique. "
                               "Chaque entrée enregistre l'acteur, l'opération, le résultat et le lien cryptographique avec "
                               "l'entrée précédente. Les hachages sont tronqués à 15 caractères pour l'affichage ; les hachages "
                               "complets apparaissent dans la section de vérification.",
        "col_num":        "N°",
        "col_timestamp":  "Horodatage",
        "col_user":       "Utilisateur",
        "col_prompt":     "Requête",
        "col_results":    "Résultats",
        "col_prev_hash":  "Hash préc.",
        "col_curr_hash":  "Hash actuel",
        "verify_heading": "Vérification de la chaîne de hachage",
        "verify_body": (
            "Le journal d'audit AiGovOps utilise une chaîne de hachage cryptographique SHA-256 pour garantir "
            "la résistance à la falsification. Le <b>current_hash</b> de chaque entrée est dérivé de la "
            "concaténation de ses propres champs et du <b>current_hash</b> de l'entrée précédente. "
            "La modification d'une entrée invalide tous les hachages suivants, rendant les altérations silencieuses détectables."
        ),
        "chain_mechanism_heading": "Mécanisme de chaîne",
        "verify_ok_msg":   "&#10003;  Chaîne de hachage VÉRIFIÉE — Toutes les entrées intactes, aucune falsification détectée.",
        "verify_fail_msg": "&#10007;  Chaîne de hachage ROMPUE — Défaillance d'intégrité détectée à l'entrée ID {id}. Ce journal peut avoir été falsifié.",
        "chain_anchors_heading": "Ancres de chaîne",
        "chain_anchors_body": (
            "Les premier et dernier hachages ancrent la chaîne. Tout tiers peut vérifier l'intégrité "
            "en recalculant la chaîne à partir des données sources et en comparant ces valeurs."
        ),
        "anchor_col_entry":  "Entrée",
        "anchor_col_field":  "Champ",
        "anchor_col_hash":   "Hachage SHA-256 complet",
        "anchor_first":      "Première\n(ID : {id})",
        "anchor_last":       "Dernière\n(ID : {id})",
        "audit_summary_heading": "Résumé d'audit",
        "summary_total":     "Total des entrées d'audit",
        "summary_algorithm": "Algorithme de hachage",
        "summary_status":    "Statut de la chaîne",
        "summary_genesis":   "Graine de hachage de genèse",
        "summary_generated": "Rapport généré",
        "summary_version":   "Version du cadre",
        "summary_cofounders":"Co-fondateurs",
        "status_verified":   "VÉRIFIÉ",
        "status_broken":     "ROMPU à l'entrée {id}",
        "version_value":     "Avril 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Ce rapport a été généré par la chaîne d\'outils d\'audit AiGovOps Foundation. '
            'Pour les outils de vérification et le code source, visitez '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"CONFIDENTIEL — Accès propriétaire uniquement",
        "footer_page":        "Page",
        "footer_of":          "sur",
    },

    "de": {
        "framework_word":       "Rahmenwerk",
        "date_version":         "April 2026 v1",
        "immutable_subtitle":   "Unveränderliches Prüfprotokoll — Compliance-Artefakt",
        "cofounders_label":     "Mitgründer:",
        "report_generated":     "Bericht erstellt:",
        "audit_entries":        "Prüfeinträge",
        "confidential":         "VERTRAULICH — Nur für Eigentümer",
        "exec_summary_heading": "Zusammenfassung",
        "exec_body1": (
            "Das <b>AiGovOps Foundation Rahmenwerk</b> ist ein offener, gemeinschaftsgetriebener "
            "Governance-Standard für verantwortungsvolle KI-Operationen. Es bietet Organisationen einen "
            "strukturierten Ansatz zur Bereitstellung, Prüfung und Wartung von KI-Systemen in Übereinstimmung "
            "mit sich entwickelnden regulatorischen Anforderungen und Branchenstandards."
        ),
        "exec_body2": (
            "Dieser Bericht stellt ein <b>unveränderliches Compliance-Artefakt</b> dar — ein "
            "kryptografisch verkettetes Prüfprotokoll aller Governance-Operationen im Rahmen des "
            "Rahmenwerks. Jeder Eintrag ist über SHA-256-Hash mit seinem Vorgänger verknüpft und schafft "
            "eine manipulationssichere Verantwortungskette, die unabhängig überprüft werden kann."
        ),
        "core_pillars_heading": "Kernsäulen",
        "pillar1_name": "1  |  Governance als Code",
        "pillar1_desc": (
            "Alle Governance-Richtlinien, Compliance-Regeln und Betriebsbeschränkungen sind "
            "versionskontrollierte Artefakte — überprüfbar, prüfbar und wie Software bereitstellbar. "
            "Änderungen werden mit vollständiger Herkunft verfolgt."
        ),
        "pillar2_name": "2  |  Beseitigung technischer KI-Schulden",
        "pillar2_desc": (
            "Systematische Identifizierung und Behebung von Modell-Drift, Datenqualitätsproblemen, "
            "Schatten-KI und undokumentierten Modellabhängigkeiten. Das Rahmenwerk schreibt regelmäßige "
            "Schuldenprüfungen vor und setzt Behebungs-SLAs durch."
        ),
        "pillar3_name": "3  |  Operative Compliance",
        "pillar3_desc": (
            "Kontinuierliche Überprüfung, dass KI-Systeme die geltenden Vorschriften erfüllen "
            "(EU AI Act, NIST AI RMF, ISO/IEC 42001). Compliance-Prüfungen sind automatisiert, "
            "protokolliert und mit kryptografischen Ausführungsnachweisen verknüpft."
        ),
        "pillar4_name": "4  |  Gemeinschaftsgetriebene Standards",
        "pillar4_desc": (
            "Governance-Standards werden kollaborativ über öffentliche RFC-Prozesse, Peer-Review "
            "und Konsens-Ratifizierung entwickelt. Kein einzelner Anbieter kontrolliert den Standard — "
            "er gehört der Praktikergemeinschaft."
        ),
        "what_contains_heading": "Inhalt dieses Berichts",
        "bullet1": "Prüfprotokoll-Tabelle — jede Governance-Operation mit Benutzer, Eingabe, Ergebnis und Hash-Verknüpfung erfasst.",
        "bullet2": "Hash-Ketten-Verifizierung — kryptografischer Nachweis der Protokollintegrität mit Anzeige des ersten und letzten Hashs.",
        "bullet3": "Verifizierungsstatus — Bestanden/Nicht-bestanden-Ergebnis der vollständigen Kettenprüfung, geeignet für behördliche Einreichungen.",
        "footer_link_text": "Weitere Informationen unter",
        "audit_table_heading": "Prüfprotokoll — Unveränderliche Hash-Ketten-Tabelle",
        "audit_table_intro":   "Die folgende Tabelle zeigt alle {n} Prüfprotokolleinträge in chronologischer Reihenfolge. "
                               "Jeder Eintrag erfasst den Akteur, die Operation, das Ergebnis und die kryptografische "
                               "Verknüpfung mit dem vorangehenden Eintrag. Hashes werden für die Anzeige auf 15 Zeichen "
                               "gekürzt; vollständige Hashes erscheinen im Verifizierungsabschnitt.",
        "col_num":        "Nr.",
        "col_timestamp":  "Zeitstempel",
        "col_user":       "Benutzer",
        "col_prompt":     "Eingabe",
        "col_results":    "Ergebnisse",
        "col_prev_hash":  "Vorh. Hash",
        "col_curr_hash":  "Akt. Hash",
        "verify_heading": "Hash-Ketten-Verifizierung",
        "verify_body": (
            "Das AiGovOps-Prüfprotokoll verwendet eine kryptografische SHA-256-Hash-Kette, um "
            "Manipulationssicherheit zu gewährleisten. Der <b>current_hash</b> jedes Eintrags wird aus "
            "der Verkettung seiner eigenen Felder und dem <b>current_hash</b> des vorangehenden Eintrags "
            "abgeleitet. Das Ändern eines Eintrags invalidiert alle nachfolgenden Hashes, wodurch "
            "stille Änderungen erkennbar werden."
        ),
        "chain_mechanism_heading": "Kettenmechanismus",
        "verify_ok_msg":   "&#10003;  Hash-Kette VERIFIZIERT — Alle Einträge intakt, keine Manipulation erkannt.",
        "verify_fail_msg": "&#10007;  Hash-Kette GEBROCHEN — Integritätsfehler bei Eintrag ID {id} erkannt. Dieses Protokoll wurde möglicherweise manipuliert.",
        "chain_anchors_heading": "Kettenanker",
        "chain_anchors_body": (
            "Der erste und letzte Hash verankern die Kette. Jeder Dritte kann die Integrität "
            "überprüfen, indem er die Kette aus den Quelldaten neu berechnet und diese Werte vergleicht."
        ),
        "anchor_col_entry":  "Eintrag",
        "anchor_col_field":  "Feld",
        "anchor_col_hash":   "Vollständiger SHA-256-Hash",
        "anchor_first":      "Erster\n(ID: {id})",
        "anchor_last":       "Letzter\n(ID: {id})",
        "audit_summary_heading": "Prüfzusammenfassung",
        "summary_total":     "Gesamte Prüfeinträge",
        "summary_algorithm": "Hash-Algorithmus",
        "summary_status":    "Kettenstatus",
        "summary_genesis":   "Genesis-Hash-Seed",
        "summary_generated": "Bericht erstellt",
        "summary_version":   "Rahmenwerk-Version",
        "summary_cofounders":"Mitgründer",
        "status_verified":   "VERIFIZIERT",
        "status_broken":     "GEBROCHEN bei Eintrag {id}",
        "version_value":     "April 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Dieser Bericht wurde von der AiGovOps Foundation-Prüf-Toolchain erstellt. '
            'Für Verifizierungstools und Quellcode besuchen Sie '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"VERTRAULICH — Nur für Eigentümer",
        "footer_page":        "Seite",
        "footer_of":          "von",
    },

    "zh": {
        "framework_word":       "框架",
        "date_version":         "2026年4月 v1",
        "immutable_subtitle":   "不可变审计日志 — 合规性文档",
        "cofounders_label":     "联合创始人：",
        "report_generated":     "报告生成时间：",
        "audit_entries":        "条审计记录",
        "confidential":         "机密 — 仅限所有者访问",
        "exec_summary_heading": "执行摘要",
        "exec_body1": (
            "<b>AiGovOps Foundation 框架</b>是一个开放的、社区驱动的 AI 负责任运营治理标准。"
            "它为组织提供了一种结构化方法，用于部署、审计和维护 AI 系统，同时符合不断发展的"
            "监管要求和行业最佳实践。"
        ),
        "exec_body2": (
            "本报告构成一份<b>不可变合规性文档</b>——一份对框架下所有治理操作进行加密链式审计的日志。"
            "每条记录通过 SHA-256 哈希与其前驱相连，形成一条可被独立验证的防篡改问责链。"
        ),
        "core_pillars_heading": "核心支柱",
        "pillar1_name": "1  |  治理即代码",
        "pillar1_desc": (
            "所有治理策略、合规规则和操作约束都是版本控制的文档——可审查、可审计，"
            "并像软件一样可部署。变更被完整追踪溯源。"
        ),
        "pillar2_name": "2  |  消除 AI 技术债务",
        "pillar2_desc": (
            "系统性识别和修复模型漂移、数据质量问题、影子 AI 及未记录的模型依赖关系。"
            "该框架强制要求定期进行债务审计并执行修复 SLA。"
        ),
        "pillar3_name": "3  |  运营合规性",
        "pillar3_desc": (
            "持续验证 AI 系统是否符合适用法规（欧盟 AI 法案、NIST AI RMF、ISO/IEC 42001）。"
            "合规检查自动化、已记录并与执行的加密证明挂钩。"
        ),
        "pillar4_name": "4  |  社区驱动的标准",
        "pillar4_desc": (
            "治理标准通过公开 RFC 流程、同行评审和共识批准进行协作开发。"
            "没有任何单一供应商控制该标准——它属于从业者社区。"
        ),
        "what_contains_heading": "本报告包含的内容",
        "bullet1": "审计日志表——每项治理操作均记录用户、提示、结果及哈希链接。",
        "bullet2": "哈希链验证——包含首尾哈希显示的日志完整性加密证明。",
        "bullet3": "验证状态——完整链审计的通过/失败结果，适合提交监管机构。",
        "footer_link_text": "更多信息请访问",
        "audit_table_heading": "审计日志 — 不可变哈希链表",
        "audit_table_intro":   "下表按时间顺序呈现所有 {n} 条审计日志记录。每条记录记录了操作者、操作、"
                               "结果以及与前一条记录的加密链接。哈希值截断为 15 个字符显示；"
                               "完整哈希值显示在验证部分。",
        "col_num":        "序号",
        "col_timestamp":  "时间戳",
        "col_user":       "用户",
        "col_prompt":     "提示",
        "col_results":    "结果",
        "col_prev_hash":  "前哈希",
        "col_curr_hash":  "当前哈希",
        "verify_heading": "哈希链验证",
        "verify_body": (
            "AiGovOps 审计日志使用 SHA-256 加密哈希链来保证防篡改性。"
            "每条记录的 <b>current_hash</b> 由其自身字段与前一条记录的 <b>current_hash</b> 串联生成。"
            "修改任何记录都会使后续所有哈希失效，从而使隐蔽篡改可被检测。"
        ),
        "chain_mechanism_heading": "链机制",
        "verify_ok_msg":   "&#10003;  哈希链已验证 — 所有记录完整，未检测到篡改。",
        "verify_fail_msg": "&#10007;  哈希链已断裂 — 在记录 ID {id} 处检测到完整性故障。此日志可能已被篡改。",
        "chain_anchors_heading": "链锚点",
        "chain_anchors_body": (
            "第一和最后一个哈希值锚定了链。任何第三方都可以通过从源数据重新计算链"
            "并比较这些值来验证完整性。"
        ),
        "anchor_col_entry":  "记录",
        "anchor_col_field":  "字段",
        "anchor_col_hash":   "完整 SHA-256 哈希",
        "anchor_first":      "第一条\n(ID: {id})",
        "anchor_last":       "最后一条\n(ID: {id})",
        "audit_summary_heading": "审计摘要",
        "summary_total":     "审计记录总数",
        "summary_algorithm": "哈希算法",
        "summary_status":    "链状态",
        "summary_genesis":   "创世哈希种子",
        "summary_generated": "报告生成时间",
        "summary_version":   "框架版本",
        "summary_cofounders":"联合创始人",
        "status_verified":   "已验证",
        "status_broken":     "在记录 {id} 处断裂",
        "version_value":     "2026年4月 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            '本报告由 AiGovOps Foundation 审计工具链生成。'
            '如需验证工具和源代码，请访问 '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>。'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"机密 — 仅限所有者访问",
        "footer_page":        "第",
        "footer_of":          "页，共",
    },

    "pt": {
        "framework_word":       "Estrutura",
        "date_version":         "Abril 2026 v1",
        "immutable_subtitle":   "Registro de auditoria imutável — Artefato de conformidade",
        "cofounders_label":     "Cofundadores:",
        "report_generated":     "Relatório gerado:",
        "audit_entries":        "Entradas de auditoria",
        "confidential":         "CONFIDENCIAL — Acesso somente do proprietário",
        "exec_summary_heading": "Sumário Executivo",
        "exec_body1": (
            "A <b>estrutura AiGovOps Foundation</b> é um padrão de governança aberto e orientado pela "
            "comunidade para operações responsáveis de IA. Fornece às organizações uma abordagem "
            "estruturada para implantar, auditar e manter sistemas de IA em conformidade com requisitos "
            "regulatórios em evolução e melhores práticas do setor."
        ),
        "exec_body2": (
            "Este relatório constitui um <b>artefato de conformidade imutável</b> — um log de auditoria "
            "criptograficamente encadeado de todas as operações de governança realizadas sob a estrutura. "
            "Cada entrada está vinculada à sua predecessora via hash SHA-256, criando uma cadeia de "
            "responsabilidade à prova de adulteração que pode ser verificada de forma independente."
        ),
        "core_pillars_heading": "Pilares Fundamentais",
        "pillar1_name": "1  |  Governança como Código",
        "pillar1_desc": (
            "Todas as políticas de governança, regras de conformidade e restrições operacionais são "
            "artefatos versionados — revisáveis, auditáveis e implantáveis como software. "
            "As alterações são rastreadas com proveniência completa."
        ),
        "pillar2_name": "2  |  Eliminação de Dívida Técnica em IA",
        "pillar2_desc": (
            "Identificação e remediação sistemáticas de desvio de modelos, problemas de qualidade de dados, "
            "IA não autorizada e dependências de modelos não documentadas. A estrutura exige auditorias "
            "regulares de dívida e aplica SLAs de remediação."
        ),
        "pillar3_name": "3  |  Conformidade Operacional",
        "pillar3_desc": (
            "Verificação contínua de que os sistemas de IA atendem às regulamentações aplicáveis "
            "(Lei de IA da UE, NIST AI RMF, ISO/IEC 42001). As verificações de conformidade são "
            "automatizadas, registradas e vinculadas a provas criptográficas de execução."
        ),
        "pillar4_name": "4  |  Padrões Orientados pela Comunidade",
        "pillar4_desc": (
            "Os padrões de governança são desenvolvidos colaborativamente por meio de processos RFC "
            "públicos, revisão por pares e ratificação por consenso. Nenhum fornecedor único controla "
            "o padrão — ele pertence à comunidade de praticantes."
        ),
        "what_contains_heading": "O que este relatório contém",
        "bullet1": "Tabela de log de auditoria — cada operação de governança capturada com usuário, prompt, resultado e vinculação de hash.",
        "bullet2": "Verificação de cadeia de hash — prova criptográfica da integridade do log com exibição do primeiro e último hash.",
        "bullet3": "Status de verificação — resultado de aprovação/reprovação da auditoria completa da cadeia, adequado para envio regulatório.",
        "footer_link_text": "Mais informações em",
        "audit_table_heading": "Log de Auditoria — Tabela de Cadeia de Hash Imutável",
        "audit_table_intro":   "A tabela a seguir apresenta todas as {n} entradas do log de auditoria em ordem cronológica. "
                               "Cada entrada registra o ator, a operação, o resultado e o vínculo criptográfico com a "
                               "entrada anterior. Os hashes são truncados em 15 caracteres para exibição; os hashes "
                               "completos aparecem na seção de verificação.",
        "col_num":        "Nº",
        "col_timestamp":  "Carimbo de hora",
        "col_user":       "Usuário",
        "col_prompt":     "Prompt",
        "col_results":    "Resultados",
        "col_prev_hash":  "Hash anterior",
        "col_curr_hash":  "Hash atual",
        "verify_heading": "Verificação da Cadeia de Hash",
        "verify_body": (
            "O log de auditoria AiGovOps emprega uma cadeia de hash criptográfico SHA-256 para garantir "
            "a resistência à adulteração. O <b>current_hash</b> de cada entrada é derivado da concatenação "
            "de seus próprios campos e do <b>current_hash</b> da entrada anterior. Modificar qualquer "
            "entrada invalida todos os hashes subsequentes, tornando as alterações silenciosas detectáveis."
        ),
        "chain_mechanism_heading": "Mecanismo de cadeia",
        "verify_ok_msg":   "&#10003;  Cadeia de hash VERIFICADA — Todas as entradas intactas, nenhuma adulteração detectada.",
        "verify_fail_msg": "&#10007;  Cadeia de hash QUEBRADA — Falha de integridade detectada na entrada ID {id}. Este log pode ter sido adulterado.",
        "chain_anchors_heading": "Âncoras da cadeia",
        "chain_anchors_body": (
            "Os hashes primeiro e último ancoram a cadeia. Qualquer terceiro pode verificar a integridade "
            "recalculando a cadeia a partir dos dados de origem e comparando esses valores."
        ),
        "anchor_col_entry":  "Entrada",
        "anchor_col_field":  "Campo",
        "anchor_col_hash":   "Hash SHA-256 completo",
        "anchor_first":      "Primeira\n(ID: {id})",
        "anchor_last":       "Última\n(ID: {id})",
        "audit_summary_heading": "Resumo de auditoria",
        "summary_total":     "Total de entradas de auditoria",
        "summary_algorithm": "Algoritmo de hash",
        "summary_status":    "Status da cadeia",
        "summary_genesis":   "Semente do hash de gênese",
        "summary_generated": "Relatório gerado",
        "summary_version":   "Versão da estrutura",
        "summary_cofounders":"Cofundadores",
        "status_verified":   "VERIFICADO",
        "status_broken":     "QUEBRADO na entrada {id}",
        "version_value":     "Abril 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Este relatório foi gerado pela cadeia de ferramentas de auditoria AiGovOps Foundation. '
            'Para ferramentas de verificação e código-fonte, visite '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"CONFIDENCIAL — Acesso somente do proprietário",
        "footer_page":        "Página",
        "footer_of":          "de",
    },

    "hi": {
        "framework_word":       "ढाँचा",
        "date_version":         "अप्रैल 2026 v1",
        "immutable_subtitle":   "अपरिवर्तनीय ऑडिट लॉग — अनुपालन आर्टिफैक्ट",
        "cofounders_label":     "सह-संस्थापक:",
        "report_generated":     "रिपोर्ट तैयार की गई:",
        "audit_entries":        "ऑडिट प्रविष्टियाँ",
        "confidential":         "गोपनीय — केवल स्वामी पहुँच",
        "exec_summary_heading": "कार्यकारी सारांश",
        "exec_body1": (
            "<b>AiGovOps Foundation ढाँचा</b> जिम्मेदार AI संचालन के लिए एक खुला, "
            "समुदाय-संचालित शासन मानक है। यह संगठनों को विकसित होती नियामक आवश्यकताओं "
            "और उद्योग की सर्वोत्तम प्रथाओं के अनुरूप AI प्रणालियों को तैनात करने, "
            "ऑडिट करने और बनाए रखने के लिए एक संरचित दृष्टिकोण प्रदान करता है।"
        ),
        "exec_body2": (
            "यह रिपोर्ट एक <b>अपरिवर्तनीय अनुपालन आर्टिफैक्ट</b> है — ढाँचे के अंतर्गत "
            "की गई सभी शासन संचालनों का क्रिप्टोग्राफिक रूप से जंजीर बद्ध ऑडिट लॉग। "
            "प्रत्येक प्रविष्टि SHA-256 हैश के माध्यम से अपने पूर्ववर्ती से जुड़ी है, "
            "जो एक छेड़छाड़-स्पष्ट जवाबदेही श्रृंखला बनाती है जिसे स्वतंत्र रूप से सत्यापित किया जा सकता है।"
        ),
        "core_pillars_heading": "मूल स्तंभ",
        "pillar1_name": "1  |  कोड के रूप में शासन",
        "pillar1_desc": (
            "सभी शासन नीतियाँ, अनुपालन नियम और परिचालन बाधाएँ संस्करण-नियंत्रित आर्टिफैक्ट हैं — "
            "समीक्षा योग्य, ऑडिट योग्य और सॉफ़्टवेयर की तरह तैनात करने योग्य। "
            "परिवर्तनों को पूर्ण उत्पत्ति के साथ ट्रैक किया जाता है।"
        ),
        "pillar2_name": "2  |  AI तकनीकी ऋण उन्मूलन",
        "pillar2_desc": (
            "मॉडल ड्रिफ्ट, डेटा गुणवत्ता समस्याओं, छाया AI और अनदस्तावेज़ मॉडल निर्भरताओं की "
            "व्यवस्थित पहचान और उपचार। ढाँचा नियमित ऋण ऑडिट को अनिवार्य करता है और "
            "उपचार SLA लागू करता है।"
        ),
        "pillar3_name": "3  |  परिचालन अनुपालन",
        "pillar3_desc": (
            "निरंतर सत्यापन कि AI प्रणालियाँ लागू विनियमों को पूरा करती हैं "
            "(EU AI अधिनियम, NIST AI RMF, ISO/IEC 42001)। अनुपालन जाँचें स्वचालित, "
            "लॉग की गई और क्रिप्टोग्राफिक निष्पादन प्रमाणों से जुड़ी हैं।"
        ),
        "pillar4_name": "4  |  समुदाय-संचालित मानक",
        "pillar4_desc": (
            "शासन मानकों को सार्वजनिक RFC प्रक्रियाओं, सहकर्मी समीक्षा और सहमति "
            "अनुसमर्थन के माध्यम से सहयोगात्मक रूप से विकसित किया जाता है। "
            "कोई एकल विक्रेता मानक को नियंत्रित नहीं करता — यह व्यवसायियों के समुदाय का है।"
        ),
        "what_contains_heading": "इस रिपोर्ट में क्या है",
        "bullet1": "ऑडिट लॉग तालिका — प्रत्येक शासन संचालन उपयोगकर्ता, प्रॉम्प्ट, परिणाम और हैश लिंकेज के साथ कैप्चर किया गया।",
        "bullet2": "हैश चेन सत्यापन — पहले/अंतिम हैश प्रदर्शन के साथ लॉग अखंडता का क्रिप्टोग्राफिक प्रमाण।",
        "bullet3": "सत्यापन स्थिति — पूर्ण श्रृंखला ऑडिट का पास/फेल परिणाम, नियामक प्रस्तुति के लिए उपयुक्त।",
        "footer_link_text": "अधिक जानकारी के लिए",
        "audit_table_heading": "ऑडिट लॉग — अपरिवर्तनीय हैश चेन तालिका",
        "audit_table_intro":   "निम्नलिखित तालिका कालानुक्रमिक क्रम में सभी {n} ऑडिट लॉग प्रविष्टियाँ प्रस्तुत करती है। "
                               "प्रत्येक प्रविष्टि अभिनेता, संचालन, परिणाम और पूर्ववर्ती प्रविष्टि के साथ क्रिप्टोग्राफिक "
                               "लिंक को रिकॉर्ड करती है। हैश प्रदर्शन के लिए 15 वर्णों तक काटे जाते हैं; "
                               "पूर्ण हैश सत्यापन अनुभाग में दिखाई देते हैं।",
        "col_num":        "क्र.",
        "col_timestamp":  "टाइमस्टैम्प",
        "col_user":       "उपयोगकर्ता",
        "col_prompt":     "प्रॉम्प्ट",
        "col_results":    "परिणाम",
        "col_prev_hash":  "पूर्व हैश",
        "col_curr_hash":  "वर्तमान हैश",
        "verify_heading": "हैश चेन सत्यापन",
        "verify_body": (
            "AiGovOps ऑडिट लॉग छेड़छाड़-स्पष्टता की गारंटी के लिए SHA-256 क्रिप्टोग्राफिक हैश चेन का उपयोग करता है। "
            "प्रत्येक प्रविष्टि का <b>current_hash</b> उसके अपने फ़ील्ड और पूर्ववर्ती प्रविष्टि के "
            "<b>current_hash</b> के संयोजन से प्राप्त होता है। किसी प्रविष्टि को संशोधित करने से "
            "सभी बाद के हैश अमान्य हो जाते हैं, जिससे छुपे हुए परिवर्तन पता चल जाते हैं।"
        ),
        "chain_mechanism_heading": "श्रृंखला तंत्र",
        "verify_ok_msg":   "&#10003;  हैश चेन सत्यापित — सभी प्रविष्टियाँ अखंड, कोई छेड़छाड़ नहीं।",
        "verify_fail_msg": "&#10007;  हैश चेन टूटी — प्रविष्टि ID {id} पर अखंडता विफलता। इस लॉग से छेड़छाड़ हो सकती है।",
        "chain_anchors_heading": "चेन एंकर",
        "chain_anchors_body": (
            "पहला और अंतिम हैश श्रृंखला को एंकर करते हैं। कोई भी तृतीय पक्ष स्रोत डेटा से "
            "श्रृंखला की पुनर्गणना करके और इन मानों की तुलना करके अखंडता की पुष्टि कर सकता है।"
        ),
        "anchor_col_entry":  "प्रविष्टि",
        "anchor_col_field":  "फ़ील्ड",
        "anchor_col_hash":   "पूर्ण SHA-256 हैश",
        "anchor_first":      "पहली\n(ID: {id})",
        "anchor_last":       "अंतिम\n(ID: {id})",
        "audit_summary_heading": "ऑडिट सारांश",
        "summary_total":     "कुल ऑडिट प्रविष्टियाँ",
        "summary_algorithm": "हैश एल्गोरिदम",
        "summary_status":    "चेन स्थिति",
        "summary_genesis":   "उत्पत्ति हैश बीज",
        "summary_generated": "रिपोर्ट तैयार",
        "summary_version":   "ढाँचा संस्करण",
        "summary_cofounders":"सह-संस्थापक",
        "status_verified":   "सत्यापित",
        "status_broken":     "प्रविष्टि {id} पर टूटी",
        "version_value":     "अप्रैल 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'यह रिपोर्ट AiGovOps Foundation ऑडिट टूलचेन द्वारा तैयार की गई थी। '
            'सत्यापन टूल और स्रोत कोड के लिए, देखें '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>।'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"गोपनीय — केवल स्वामी पहुँच",
        "footer_page":        "पृष्ठ",
        "footer_of":          "का",
    },

    "es": {
        "framework_word":       "Marco",
        "date_version":         "Abril 2026 v1",
        "immutable_subtitle":   "Registro de auditoría inmutable — Artefacto de conformidad",
        "cofounders_label":     "Cofundadores:",
        "report_generated":     "Informe generado:",
        "audit_entries":        "Entradas de auditoría",
        "confidential":         "CONFIDENCIAL — Acceso exclusivo del propietario",
        "exec_summary_heading": "Resumen Ejecutivo",
        "exec_body1": (
            "El <b>marco AiGovOps Foundation</b> es un estándar de gobernanza abierto y orientado "
            "por la comunidad para operaciones responsables de IA. Proporciona a las organizaciones "
            "un enfoque estructurado para desplegar, auditar y mantener sistemas de IA en cumplimiento "
            "con los requisitos regulatorios en evolución y las mejores prácticas del sector."
        ),
        "exec_body2": (
            "Este informe constituye un <b>artefacto de conformidad inmutable</b> — un registro de "
            "auditoría encadenado criptográficamente de todas las operaciones de gobernanza realizadas "
            "bajo el marco. Cada entrada está vinculada a su predecesora mediante hash SHA-256, creando "
            "una cadena de responsabilidad resistente a manipulaciones que puede verificarse de forma independiente."
        ),
        "core_pillars_heading": "Pilares Fundamentales",
        "pillar1_name": "1  |  Gobernanza como Código",
        "pillar1_desc": (
            "Todas las políticas de gobernanza, reglas de conformidad y restricciones operacionales son "
            "artefactos controlados por versiones — revisables, auditables y desplegables como software. "
            "Los cambios se rastrean con total procedencia."
        ),
        "pillar2_name": "2  |  Eliminación de Deuda Técnica en IA",
        "pillar2_desc": (
            "Identificación y remediación sistemáticas de la deriva de modelos, problemas de calidad de datos, "
            "IA no autorizada y dependencias de modelos no documentadas. El marco exige auditorías regulares "
            "de deuda y aplica SLAs de remediación."
        ),
        "pillar3_name": "3  |  Conformidad Operacional",
        "pillar3_desc": (
            "Verificación continua de que los sistemas de IA cumplen las regulaciones aplicables "
            "(Ley de IA de la UE, NIST AI RMF, ISO/IEC 42001). Las verificaciones de conformidad son "
            "automatizadas, registradas y vinculadas a pruebas criptográficas de ejecución."
        ),
        "pillar4_name": "4  |  Estándares Impulsados por la Comunidad",
        "pillar4_desc": (
            "Los estándares de gobernanza se desarrollan colaborativamente mediante procesos RFC públicos, "
            "revisión por pares y ratificación por consenso. Ningún proveedor único controla el estándar — "
            "pertenece a la comunidad de profesionales."
        ),
        "what_contains_heading": "Contenido de este informe",
        "bullet1": "Tabla de registro de auditoría — cada operación de gobernanza capturada con usuario, prompt, resultado y enlace de hash.",
        "bullet2": "Verificación de cadena de hash — prueba criptográfica de la integridad del registro con visualización del primer y último hash.",
        "bullet3": "Estado de verificación — resultado de aprobado/reprobado de la auditoría completa de la cadena, apto para envío regulatorio.",
        "footer_link_text": "Más información en",
        "audit_table_heading": "Registro de auditoría — Tabla de cadena de hash inmutable",
        "audit_table_intro":   "La siguiente tabla presenta todas las {n} entradas del registro de auditoría en orden cronológico. "
                               "Cada entrada registra el actor, la operación, el resultado y el vínculo criptográfico con "
                               "la entrada anterior. Los hashes se truncan a 15 caracteres para su visualización; "
                               "los hashes completos aparecen en la sección de verificación.",
        "col_num":        "Nº",
        "col_timestamp":  "Marca de tiempo",
        "col_user":       "Usuario",
        "col_prompt":     "Prompt",
        "col_results":    "Resultados",
        "col_prev_hash":  "Hash anterior",
        "col_curr_hash":  "Hash actual",
        "verify_heading": "Verificación de cadena de hash",
        "verify_body": (
            "El registro de auditoría AiGovOps emplea una cadena de hash criptográfico SHA-256 para garantizar "
            "la resistencia a manipulaciones. El <b>current_hash</b> de cada entrada se deriva de la "
            "concatenación de sus propios campos y del <b>current_hash</b> de la entrada anterior. "
            "Modificar cualquier entrada invalida todos los hashes posteriores, haciendo detectable "
            "cualquier alteración silenciosa."
        ),
        "chain_mechanism_heading": "Mecanismo de cadena",
        "verify_ok_msg":   "&#10003;  Cadena de hash VERIFICADA — Todas las entradas intactas, sin manipulación detectada.",
        "verify_fail_msg": "&#10007;  Cadena de hash ROTA — Fallo de integridad detectado en la entrada ID {id}. Este registro puede haber sido manipulado.",
        "chain_anchors_heading": "Anclas de cadena",
        "chain_anchors_body": (
            "Los hashes primero y último anclan la cadena. Cualquier tercero puede verificar la integridad "
            "recalculando la cadena a partir de los datos de origen y comparando estos valores."
        ),
        "anchor_col_entry":  "Entrada",
        "anchor_col_field":  "Campo",
        "anchor_col_hash":   "Hash SHA-256 completo",
        "anchor_first":      "Primera\n(ID: {id})",
        "anchor_last":       "Última\n(ID: {id})",
        "audit_summary_heading": "Resumen de auditoría",
        "summary_total":     "Total de entradas de auditoría",
        "summary_algorithm": "Algoritmo de hash",
        "summary_status":    "Estado de la cadena",
        "summary_genesis":   "Semilla hash de génesis",
        "summary_generated": "Informe generado",
        "summary_version":   "Versión del marco",
        "summary_cofounders":"Cofundadores",
        "status_verified":   "VERIFICADO",
        "status_broken":     "ROTA en entrada {id}",
        "version_value":     "Abril 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Este informe fue generado por la cadena de herramientas de auditoría de AiGovOps Foundation. '
            'Para herramientas de verificación y código fuente, visite '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"CONFIDENCIAL — Acceso exclusivo del propietario",
        "footer_page":        "Página",
        "footer_of":          "de",
    },

    "ar": {
        "framework_word":       "الإطار",
        "date_version":         "أبريل 2026 الإصدار 1",
        "immutable_subtitle":   "سجل تدقيق غير قابل للتغيير — أداة امتثال",
        "cofounders_label":     "المؤسسون المشاركون:",
        "report_generated":     "تاريخ إنشاء التقرير:",
        "audit_entries":        "إدخالات التدقيق",
        "confidential":         "سري — للمالك فقط",
        "exec_summary_heading": "الملخص التنفيذي",
        "exec_body1": (
            "يُعدّ <b>إطار AiGovOps Foundation</b> معيارًا مفتوحًا وقائمًا على المجتمع لحوكمة "
            "عمليات الذكاء الاصطناعي المسؤولة. يوفر للمؤسسات نهجًا منظمًا لنشر أنظمة الذكاء "
            "الاصطناعي ومراجعتها وصيانتها بما يتوافق مع المتطلبات التنظيمية المتطورة وأفضل "
            "الممارسات في الصناعة."
        ),
        "exec_body2": (
            "يشكّل هذا التقرير <b>أداةَ امتثال غير قابلة للتغيير</b> — سجل تدقيق مرتبط "
            "تشفيريًا بجميع عمليات الحوكمة المنفَّذة في إطار الإطار. كل إدخال مرتبط بسابقه "
            "عبر تجزئة SHA-256، مما يُنشئ سلسلة مساءلة محمية من التلاعب ويمكن التحقق منها بشكل مستقل."
        ),
        "core_pillars_heading": "الركائز الأساسية",
        "pillar1_name": "1  |  الحوكمة كرمز برمجي",
        "pillar1_desc": (
            "جميع سياسات الحوكمة وقواعد الامتثال والقيود التشغيلية عبارة عن أصول خاضعة للتحكم "
            "في الإصدار — قابلة للمراجعة والتدقيق والنشر مثل البرمجيات. يتم تتبع التغييرات "
            "بشكل كامل مع توثيق المصدر."
        ),
        "pillar2_name": "2  |  التخلص من الديون التقنية للذكاء الاصطناعي",
        "pillar2_desc": (
            "التحديد المنهجي ومعالجة انجراف النماذج ومشاكل جودة البيانات والذكاء الاصطناعي "
            "غير المعتمد والاعتماديات غير الموثقة. يفرض الإطار عمليات تدقيق منتظمة للديون "
            "ويُطبّق اتفاقيات مستوى خدمة المعالجة."
        ),
        "pillar3_name": "3  |  الامتثال التشغيلي",
        "pillar3_desc": (
            "التحقق المستمر من أن أنظمة الذكاء الاصطناعي تستوفي اللوائح المعمول بها "
            "(قانون الذكاء الاصطناعي الأوروبي، NIST AI RMF، ISO/IEC 42001). عمليات فحص "
            "الامتثال آلية ومسجلة ومرتبطة بأدلة تشفيرية للتنفيذ."
        ),
        "pillar4_name": "4  |  معايير مدفوعة بالمجتمع",
        "pillar4_desc": (
            "تُطوَّر معايير الحوكمة بشكل تعاوني عبر عمليات RFC العامة ومراجعة الأقران "
            "والتصديق بالإجماع. لا يسيطر أي مورد منفرد على المعيار — فهو يخص مجتمع الممارسين."
        ),
        "what_contains_heading": "محتويات هذا التقرير",
        "bullet1": "جدول سجل التدقيق — كل عملية حوكمة مسجلة مع المستخدم والمطالبة والنتيجة وارتباط التجزئة.",
        "bullet2": "التحقق من سلسلة التجزئة — دليل تشفيري على سلامة السجل مع عرض التجزئة الأولى والأخيرة.",
        "bullet3": "حالة التحقق — نتيجة نجاح/فشل تدقيق السلسلة الكامل، مناسبة للتقديم التنظيمي.",
        "footer_link_text": "مزيد من المعلومات على",
        "audit_table_heading": "سجل التدقيق — جدول سلسلة التجزئة غير القابل للتغيير",
        "audit_table_intro":   "يعرض الجدول التالي جميع {n} إدخالات سجل التدقيق بترتيب زمني. "
                               "يسجل كل إدخال الجهة المنفِّذة والعملية والنتيجة والرابط التشفيري بالإدخال السابق. "
                               "تُقتصر التجزئات على 15 حرفًا للعرض؛ تظهر التجزئات الكاملة في قسم التحقق.",
        "col_num":        "رقم",
        "col_timestamp":  "الطابع الزمني",
        "col_user":       "المستخدم",
        "col_prompt":     "المطالبة",
        "col_results":    "النتائج",
        "col_prev_hash":  "التجزئة السابقة",
        "col_curr_hash":  "التجزئة الحالية",
        "verify_heading": "التحقق من سلسلة التجزئة",
        "verify_body": (
            "يستخدم سجل تدقيق AiGovOps سلسلة تجزئة تشفيرية SHA-256 لضمان مقاومة التلاعب. "
            "يُشتق <b>current_hash</b> لكل إدخال من تسلسل حقوله الخاصة مع <b>current_hash</b> "
            "الإدخال السابق. إن تعديل أي إدخال يُبطل جميع التجزئات اللاحقة، "
            "مما يجعل التعديلات الخفية قابلة للاكتشاف."
        ),
        "chain_mechanism_heading": "آلية السلسلة",
        "verify_ok_msg":   "&#10003;  سلسلة التجزئة مُتحقَّق منها — جميع الإدخالات سليمة، لا يوجد تلاعب.",
        "verify_fail_msg": "&#10007;  سلسلة التجزئة مكسورة — تم اكتشاف فشل في النزاهة عند الإدخال ID {id}. قد يكون هذا السجل قد تم التلاعب به.",
        "chain_anchors_heading": "مرتكزات السلسلة",
        "chain_anchors_body": (
            "تُرسّخ التجزئتان الأولى والأخيرة السلسلة. يمكن لأي طرف ثالث التحقق من السلامة "
            "بإعادة احتساب السلسلة من البيانات المصدر ومقارنة هذه القيم."
        ),
        "anchor_col_entry":  "الإدخال",
        "anchor_col_field":  "الحقل",
        "anchor_col_hash":   "تجزئة SHA-256 الكاملة",
        "anchor_first":      "الأول\n(ID: {id})",
        "anchor_last":       "الأخير\n(ID: {id})",
        "audit_summary_heading": "ملخص التدقيق",
        "summary_total":     "إجمالي إدخالات التدقيق",
        "summary_algorithm": "خوارزمية التجزئة",
        "summary_status":    "حالة السلسلة",
        "summary_genesis":   "بذرة تجزئة النشأة",
        "summary_generated": "تاريخ إنشاء التقرير",
        "summary_version":   "إصدار الإطار",
        "summary_cofounders":"المؤسسون المشاركون",
        "status_verified":   "مُتحقَّق منه",
        "status_broken":     "مكسور عند الإدخال {id}",
        "version_value":     "أبريل 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'تم إنشاء هذا التقرير بواسطة سلسلة أدوات تدقيق AiGovOps Foundation. '
            'للحصول على أدوات التحقق والكود المصدري، تفضل بزيارة '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"سري — للمالك فقط",
        "footer_page":        "صفحة",
        "footer_of":          "من",
    },

    "ru": {
        "framework_word":       "Фреймворк",
        "date_version":         "Апрель 2026 v1",
        "immutable_subtitle":   "Неизменяемый журнал аудита — Артефакт соответствия",
        "cofounders_label":     "Сооснователи:",
        "report_generated":     "Отчёт создан:",
        "audit_entries":        "Записи аудита",
        "confidential":         "КОНФИДЕНЦИАЛЬНО — Только для владельца",
        "exec_summary_heading": "Краткое резюме",
        "exec_body1": (
            "<b>Фреймворк AiGovOps Foundation</b> — открытый стандарт управления, "
            "разработанный сообществом для ответственных операций с ИИ. Он предоставляет "
            "организациям структурированный подход к развёртыванию, аудиту и обслуживанию "
            "систем ИИ в соответствии с развивающимися нормативными требованиями и лучшими "
            "отраслевыми практиками."
        ),
        "exec_body2": (
            "Этот отчёт представляет собой <b>неизменяемый артефакт соответствия</b> — "
            "криптографически связанный журнал аудита всех операций управления, выполненных "
            "в рамках фреймворка. Каждая запись связана с предыдущей через хэш SHA-256, "
            "создавая цепочку ответственности, защищённую от подделок и поддающуюся "
            "независимой проверке."
        ),
        "core_pillars_heading": "Основные принципы",
        "pillar1_name": "1  |  Управление как код",
        "pillar1_desc": (
            "Все политики управления, правила соответствия и операционные ограничения — "
            "это версионируемые артефакты, пригодные для проверки, аудита и развёртывания "
            "как программное обеспечение. Изменения отслеживаются с полной историей происхождения."
        ),
        "pillar2_name": "2  |  Устранение технического долга ИИ",
        "pillar2_desc": (
            "Систематическая идентификация и устранение смещения моделей, проблем качества "
            "данных, теневого ИИ и недокументированных зависимостей моделей. Фреймворк "
            "обязывает проводить регулярные аудиты долга и обеспечивает соблюдение SLA по устранению."
        ),
        "pillar3_name": "3  |  Операционное соответствие",
        "pillar3_desc": (
            "Непрерывная проверка соответствия систем ИИ применимым нормативным актам "
            "(Акт ЕС об ИИ, NIST AI RMF, ISO/IEC 42001). Проверки соответствия автоматизированы, "
            "фиксируются и привязаны к криптографическим доказательствам выполнения."
        ),
        "pillar4_name": "4  |  Стандарты, формируемые сообществом",
        "pillar4_desc": (
            "Стандарты управления разрабатываются совместно через публичные RFC-процессы, "
            "экспертные проверки и ратификацию консенсусом. Ни один поставщик не контролирует "
            "стандарт — он принадлежит сообществу практиков."
        ),
        "what_contains_heading": "Содержание этого отчёта",
        "bullet1": "Таблица журнала аудита — каждая операция управления зафиксирована с пользователем, запросом, результатом и хэш-ссылкой.",
        "bullet2": "Проверка цепочки хэшей — криптографическое доказательство целостности журнала с отображением первого и последнего хэша.",
        "bullet3": "Статус проверки — результат прохождения/отказа полного аудита цепочки, пригодный для регуляторного представления.",
        "footer_link_text": "Подробнее на",
        "audit_table_heading": "Журнал аудита — Таблица неизменяемой цепочки хэшей",
        "audit_table_intro":   "В следующей таблице представлены все {n} записей журнала аудита в хронологическом порядке. "
                               "Каждая запись фиксирует субъект, операцию, результат и криптографическую связь с предыдущей записью. "
                               "Хэши усечены до 15 символов для отображения; полные хэши показаны в разделе проверки.",
        "col_num":        "№",
        "col_timestamp":  "Метка времени",
        "col_user":       "Пользователь",
        "col_prompt":     "Запрос",
        "col_results":    "Результаты",
        "col_prev_hash":  "Пред. хэш",
        "col_curr_hash":  "Тек. хэш",
        "verify_heading": "Проверка цепочки хэшей",
        "verify_body": (
            "Журнал аудита AiGovOps использует криптографическую цепочку хэшей SHA-256 для обеспечения "
            "защиты от подделок. <b>current_hash</b> каждой записи формируется путём конкатенации "
            "её собственных полей и <b>current_hash</b> предыдущей записи. Изменение любой записи "
            "делает недействительными все последующие хэши, делая скрытые изменения обнаруживаемыми."
        ),
        "chain_mechanism_heading": "Механизм цепочки",
        "verify_ok_msg":   "&#10003;  Цепочка хэшей ПРОВЕРЕНА — Все записи целы, подделок не обнаружено.",
        "verify_fail_msg": "&#10007;  Цепочка хэшей НАРУШЕНА — Обнаружен сбой целостности в записи ID {id}. Журнал мог быть подделан.",
        "chain_anchors_heading": "Якоря цепочки",
        "chain_anchors_body": (
            "Первый и последний хэши служат якорями цепочки. Любая третья сторона может "
            "проверить целостность, пересчитав цепочку из исходных данных и сравнив эти значения."
        ),
        "anchor_col_entry":  "Запись",
        "anchor_col_field":  "Поле",
        "anchor_col_hash":   "Полный хэш SHA-256",
        "anchor_first":      "Первая\n(ID: {id})",
        "anchor_last":       "Последняя\n(ID: {id})",
        "audit_summary_heading": "Сводка аудита",
        "summary_total":     "Всего записей аудита",
        "summary_algorithm": "Алгоритм хэширования",
        "summary_status":    "Статус цепочки",
        "summary_genesis":   "Начальное зерно хэша",
        "summary_generated": "Отчёт создан",
        "summary_version":   "Версия фреймворка",
        "summary_cofounders":"Сооснователи",
        "status_verified":   "ПРОВЕРЕНО",
        "status_broken":     "НАРУШЕНО в записи {id}",
        "version_value":     "Апрель 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Этот отчёт создан цепочкой инструментов аудита AiGovOps Foundation. '
            'Для инструментов проверки и исходного кода посетите '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"КОНФИДЕНЦИАЛЬНО — Только для владельца",
        "footer_page":        "Страница",
        "footer_of":          "из",
    },

    "tr": {
        "framework_word":       "Çerçeve",
        "date_version":         "Nisan 2026 v1",
        "immutable_subtitle":   "Değiştirilemez Denetim Günlüğü — Uyumluluk Eseri",
        "cofounders_label":     "Kurucu Ortaklar:",
        "report_generated":     "Rapor Oluşturuldu:",
        "audit_entries":        "Denetim Girişi",
        "confidential":         "GİZLİ — Yalnızca Sahip Erişimi",
        "exec_summary_heading": "Yönetici Özeti",
        "exec_body1": (
            "<b>AiGovOps Foundation Çerçevesi</b>, sorumlu yapay zeka operasyonları için açık, "
            "topluluk odaklı bir yönetişim standardıdır. Kuruluşlara, gelişen düzenleyici "
            "gereksinimler ve sektör en iyi uygulamalarına uygun şekilde yapay zeka sistemlerini "
            "dağıtmak, denetlemek ve sürdürmek için yapılandırılmış bir yaklaşım sunar."
        ),
        "exec_body2": (
            "Bu rapor, <b>değiştirilemez bir uyumluluk eseri</b> oluşturur — çerçeve kapsamında "
            "gerçekleştirilen tüm yönetişim operasyonlarının kriptografik olarak zincirlenmiş "
            "denetim günlüğü. Her giriş, SHA-256 hash yoluyla öncekiyle bağlantılıdır ve "
            "bağımsız olarak doğrulanabilen, kurcalamaya dayanıklı bir hesap verebilirlik zinciri oluşturur."
        ),
        "core_pillars_heading": "Temel Sütunlar",
        "pillar1_name": "1  |  Kod Olarak Yönetişim",
        "pillar1_desc": (
            "Tüm yönetişim politikaları, uyumluluk kuralları ve operasyonel kısıtlamalar, "
            "sürüm kontrollü eserlerdir — incelenebilir, denetlenebilir ve yazılım gibi dağıtılabilir. "
            "Değişiklikler eksiksiz köken bilgisiyle takip edilir."
        ),
        "pillar2_name": "2  |  Yapay Zeka Teknik Borcunun Ortadan Kaldırılması",
        "pillar2_desc": (
            "Model kayması, veri kalitesi sorunları, gölge yapay zeka ve belgelenmemiş model "
            "bağımlılıklarının sistematik olarak tanımlanması ve giderilmesi. Çerçeve, düzenli borç "
            "denetimlerini zorunlu kılar ve giderme SLA'larını uygular."
        ),
        "pillar3_name": "3  |  Operasyonel Uyumluluk",
        "pillar3_desc": (
            "Yapay zeka sistemlerinin geçerli düzenlemeleri karşıladığının sürekli doğrulanması "
            "(AB Yapay Zeka Yasası, NIST AI RMF, ISO/IEC 42001). Uyumluluk kontrolleri otomatik, "
            "günlüğe kaydedilmiş ve kriptografik yürütme kanıtlarına bağlıdır."
        ),
        "pillar4_name": "4  |  Topluluk Odaklı Standartlar",
        "pillar4_desc": (
            "Yönetişim standartları, kamuya açık RFC süreçleri, akran değerlendirmesi ve "
            "mutabakat onayı yoluyla işbirliğiyle geliştirilir. Hiçbir tek satıcı standardı "
            "kontrol etmez — uygulayıcılar topluluğuna aittir."
        ),
        "what_contains_heading": "Bu Rapor Neleri İçeriyor",
        "bullet1": "Denetim Günlüğü Tablosu — her yönetişim operasyonu kullanıcı, istem, sonuç ve hash bağlantısıyla kaydedilmiş.",
        "bullet2": "Hash Zinciri Doğrulaması — ilk/son hash gösterimiyle günlük bütünlüğünün kriptografik kanıtı.",
        "bullet3": "Doğrulama Durumu — düzenleyici kuruma gönderime uygun tam zincir denetiminin geçti/kaldı sonucu.",
        "footer_link_text": "Daha fazla bilgi için",
        "audit_table_heading": "Denetim Günlüğü — Değiştirilemez Hash Zinciri Tablosu",
        "audit_table_intro":   "Aşağıdaki tablo, tüm {n} denetim günlüğü girişini kronolojik sırayla sunar. "
                               "Her giriş, aktörü, operasyonu, sonucu ve önceki girişe kriptografik bağlantıyı kaydeder. "
                               "Hash'ler görüntüleme için 15 karaktere kısaltılır; tam hash'ler doğrulama bölümünde gösterilir.",
        "col_num":        "No",
        "col_timestamp":  "Zaman Damgası",
        "col_user":       "Kullanıcı",
        "col_prompt":     "İstem",
        "col_results":    "Sonuçlar",
        "col_prev_hash":  "Önceki Hash",
        "col_curr_hash":  "Geçerli Hash",
        "verify_heading": "Hash Zinciri Doğrulaması",
        "verify_body": (
            "AiGovOps denetim günlüğü, kurcalama kanıtı sağlamak için SHA-256 kriptografik hash "
            "zinciri kullanır. Her girişin <b>current_hash</b>'i, kendi alanlarının ve önceki "
            "girişin <b>current_hash</b>'inin birleşiminden türetilir. Herhangi bir girişi "
            "değiştirmek, tüm sonraki hash'leri geçersiz kılar ve sessiz değişiklikleri tespit edilebilir hale getirir."
        ),
        "chain_mechanism_heading": "Zincir Mekanizması",
        "verify_ok_msg":   "&#10003;  Hash Zinciri DOĞRULANDI — Tüm girişler sağlam, kurcalama tespit edilmedi.",
        "verify_fail_msg": "&#10007;  Hash Zinciri KIRIK — Giriş ID {id}'de bütünlük hatası tespit edildi. Bu günlük kurcalanmış olabilir.",
        "chain_anchors_heading": "Zincir Çapaları",
        "chain_anchors_body": (
            "İlk ve son hash'ler zinciri demirler. Herhangi bir üçüncü taraf, kaynak verilerden "
            "zinciri yeniden hesaplayarak ve bu değerleri karşılaştırarak bütünlüğü doğrulayabilir."
        ),
        "anchor_col_entry":  "Giriş",
        "anchor_col_field":  "Alan",
        "anchor_col_hash":   "Tam SHA-256 Hash",
        "anchor_first":      "İlk\n(ID: {id})",
        "anchor_last":       "Son\n(ID: {id})",
        "audit_summary_heading": "Denetim Özeti",
        "summary_total":     "Toplam Denetim Girişi",
        "summary_algorithm": "Hash Algoritması",
        "summary_status":    "Zincir Durumu",
        "summary_genesis":   "Başlangıç Hash Tohumu",
        "summary_generated": "Rapor Oluşturuldu",
        "summary_version":   "Çerçeve Sürümü",
        "summary_cofounders":"Kurucu Ortaklar",
        "status_verified":   "DOĞRULANDI",
        "status_broken":     "Giriş {id}'de KIRIK",
        "version_value":     "Nisan 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Bu rapor, AiGovOps Foundation denetim araç zinciri tarafından oluşturulmuştur. '
            'Doğrulama araçları ve kaynak kodu için şu adresi ziyaret edin: '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"GİZLİ — Yalnızca Sahip Erişimi",
        "footer_page":        "Sayfa",
        "footer_of":          "/",
    },

    "ur": {
        "framework_word":       "فریم ورک",
        "date_version":         "اپریل 2026 ورژن 1",
        "immutable_subtitle":   "ناقابل تبدیل آڈٹ لاگ — تعمیل آرٹیفیکٹ",
        "cofounders_label":     "شریک بانیان:",
        "report_generated":     "رپورٹ تیار ہوئی:",
        "audit_entries":        "آڈٹ اندراجات",
        "confidential":         "خفیہ — صرف مالک تک رسائی",
        "exec_summary_heading": "ایگزیکٹو خلاصہ",
        "exec_body1": (
            "<b>AiGovOps Foundation فریم ورک</b> ذمہ دارانہ AI آپریشنز کے لیے ایک کھلا، "
            "کمیونٹی پر مبنی گورننس معیار ہے۔ یہ تنظیموں کو ابھرتی ہوئی ریگولیٹری ضروریات "
            "اور صنعت کی بہترین طریقوں کے مطابق AI سسٹمز کو تعینات کرنے، آڈٹ کرنے اور "
            "برقرار رکھنے کے لیے ایک منظم نقطہ نظر فراہم کرتا ہے۔"
        ),
        "exec_body2": (
            "یہ رپورٹ ایک <b>ناقابل تبدیل تعمیل آرٹیفیکٹ</b> ہے — فریم ورک کے تحت "
            "انجام دی گئی تمام گورننس آپریشنز کا کرپٹوگرافک طور پر زنجیر بند آڈٹ لاگ۔ "
            "ہر اندراج SHA-256 ہیش کے ذریعے اپنے پیشرو سے منسلک ہے، جو ایک چھیڑ چھاڑ ظاہر "
            "کرنے والی احتساب کی زنجیر بناتا ہے جسے آزادانہ طور پر تصدیق کی جا سکتی ہے۔"
        ),
        "core_pillars_heading": "بنیادی ستون",
        "pillar1_name": "1  |  کوڈ کے طور پر گورننس",
        "pillar1_desc": (
            "تمام گورننس پالیسیاں، تعمیل کے قوانین اور آپریشنل پابندیاں ورژن کنٹرولڈ "
            "آرٹیفیکٹس ہیں — قابل جائزہ، آڈٹ کے قابل اور سافٹ ویئر کی طرح تعینات کرنے کے قابل۔ "
            "تبدیلیاں مکمل اصلیت کے ساتھ ٹریک کی جاتی ہیں۔"
        ),
        "pillar2_name": "2  |  AI تکنیکی قرض کا خاتمہ",
        "pillar2_desc": (
            "ماڈل ڈرفٹ، ڈیٹا کوالٹی مسائل، شیڈو AI اور غیر دستاویز شدہ ماڈل انحصار کی منظم "
            "شناخت اور تدارک۔ فریم ورک باقاعدہ قرض آڈٹ لازمی کرتا ہے اور تدارک SLAs نافذ کرتا ہے۔"
        ),
        "pillar3_name": "3  |  آپریشنل تعمیل",
        "pillar3_desc": (
            "مسلسل تصدیق کہ AI سسٹمز قابل اطلاق ضوابط کو پورا کرتے ہیں "
            "(EU AI ایکٹ، NIST AI RMF، ISO/IEC 42001)۔ تعمیل جانچیں خودکار، "
            "لاگ شدہ اور عملدرآمد کے کرپٹوگرافک ثبوت سے منسلک ہیں۔"
        ),
        "pillar4_name": "4  |  کمیونٹی پر مبنی معیارات",
        "pillar4_desc": (
            "گورننس معیارات عوامی RFC عمل، ہم مرتبہ جائزہ اور اتفاق رائے کی توثیق کے ذریعے "
            "باہمی تعاون سے تیار کیے جاتے ہیں۔ کوئی بھی واحد وینڈر معیار کو کنٹرول نہیں کرتا — "
            "یہ پریکٹیشنرز کی کمیونٹی کا ہے۔"
        ),
        "what_contains_heading": "اس رپورٹ میں کیا ہے",
        "bullet1": "آڈٹ لاگ ٹیبل — ہر گورننس آپریشن صارف، پرامپٹ، نتیجہ اور ہیش لنکیج کے ساتھ محفوظ۔",
        "bullet2": "ہیش چین تصدیق — پہلے/آخری ہیش ڈسپلے کے ساتھ لاگ سالمیت کا کرپٹوگرافک ثبوت۔",
        "bullet3": "تصدیق کی حیثیت — مکمل چین آڈٹ کا پاس/فیل نتیجہ، ریگولیٹری جمع کرانے کے لیے موزوں۔",
        "footer_link_text": "مزید معلومات",
        "audit_table_heading": "آڈٹ لاگ — ناقابل تبدیل ہیش چین ٹیبل",
        "audit_table_intro":   "درج ذیل ٹیبل تمام {n} آڈٹ لاگ اندراجات کو تاریخ کے مطابق ترتیب میں پیش کرتا ہے۔ "
                               "ہر اندراج اداکار، آپریشن، نتیجہ اور سابقہ اندراج سے کرپٹوگرافک ربط ریکارڈ کرتا ہے۔ "
                               "ہیش ڈسپلے کے لیے 15 حروف تک کاٹے جاتے ہیں؛ مکمل ہیش تصدیق سیکشن میں ظاہر ہوتے ہیں۔",
        "col_num":        "نمبر",
        "col_timestamp":  "ٹائم اسٹیمپ",
        "col_user":       "صارف",
        "col_prompt":     "پرامپٹ",
        "col_results":    "نتائج",
        "col_prev_hash":  "پچھلا ہیش",
        "col_curr_hash":  "موجودہ ہیش",
        "verify_heading": "ہیش چین تصدیق",
        "verify_body": (
            "AiGovOps آڈٹ لاگ چھیڑ چھاڑ ثبوت کی ضمانت کے لیے SHA-256 کرپٹوگرافک ہیش چین استعمال کرتا ہے۔ "
            "ہر اندراج کا <b>current_hash</b> اس کے اپنے فیلڈز اور سابقہ اندراج کے "
            "<b>current_hash</b> کے اشتراک سے حاصل ہوتا ہے۔ کسی بھی اندراج کو تبدیل کرنے سے "
            "تمام بعد کے ہیش ناکارہ ہو جاتے ہیں، جس سے خاموش تبدیلیاں قابل پتہ ہو جاتی ہیں۔"
        ),
        "chain_mechanism_heading": "چین میکانزم",
        "verify_ok_msg":   "&#10003;  ہیش چین تصدیق شدہ — تمام اندراجات سالم، کوئی چھیڑ چھاڑ نہیں۔",
        "verify_fail_msg": "&#10007;  ہیش چین ٹوٹی ہوئی — اندراج ID {id} پر سالمیت کی ناکامی۔ اس لاگ سے چھیڑ چھاڑ ہو سکتی ہے۔",
        "chain_anchors_heading": "چین اینکرز",
        "chain_anchors_body": (
            "پہلا اور آخری ہیش چین کو لنگر ڈالتے ہیں۔ کوئی بھی تیسرا فریق ماخذ ڈیٹا سے "
            "چین دوبارہ حساب کر کے اور ان اقدار کا موازنہ کر کے سالمیت کی تصدیق کر سکتا ہے۔"
        ),
        "anchor_col_entry":  "اندراج",
        "anchor_col_field":  "فیلڈ",
        "anchor_col_hash":   "مکمل SHA-256 ہیش",
        "anchor_first":      "پہلا\n(ID: {id})",
        "anchor_last":       "آخری\n(ID: {id})",
        "audit_summary_heading": "آڈٹ خلاصہ",
        "summary_total":     "کل آڈٹ اندراجات",
        "summary_algorithm": "ہیش الگورتھم",
        "summary_status":    "چین کی حیثیت",
        "summary_genesis":   "جینیسس ہیش بیج",
        "summary_generated": "رپورٹ تیار",
        "summary_version":   "فریم ورک ورژن",
        "summary_cofounders":"شریک بانیان",
        "status_verified":   "تصدیق شدہ",
        "status_broken":     "اندراج {id} پر ٹوٹی",
        "version_value":     "اپریل 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'یہ رپورٹ AiGovOps Foundation آڈٹ ٹول چین نے تیار کی۔ '
            'تصدیق کے ٹولز اور سورس کوڈ کے لیے دیکھیں '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>۔'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"خفیہ — صرف مالک تک رسائی",
        "footer_page":        "صفحہ",
        "footer_of":          "از",
    },

    "ps": {
        "framework_word":       "چوکاټ",
        "date_version":         "د اپریل 2026 نسخه 1",
        "immutable_subtitle":   "نه بدلیدونکی آډیټ لاګ — د پیروي اثر",
        "cofounders_label":     "ګډ بنسټګران:",
        "report_generated":     "راپور جوړ شو:",
        "audit_entries":        "د آډیټ ننوتنې",
        "confidential":         "محرمانه — یوازې د مالک لاسرسی",
        "exec_summary_heading": "اجرایوي لنډیز",
        "exec_body1": (
            "<b>AiGovOps Foundation چوکاټ</b> د مسؤلانه AI عملیاتو لپاره یو خلاص، "
            "د ټولنې لخوا چلول شوی حاکمیت معیار دی. دا سازمانونو ته د AI سیسټمونو د ځای پر ځای کولو، "
            "آډیټ کولو او ساتلو لپاره یو جوړښت لرونکی طریقه وړاندې کوي چې د پرمختللو تنظیمي "
            "اړتیاوو او د صنعت غوره کارونو سره سم وي."
        ),
        "exec_body2": (
            "دا راپور یو <b>نه بدلیدونکی د پیروي اثر</b> جوړوي — د چوکاټ لاندې د ټولو "
            "حاکمیتي عملیاتو کریپټوګرافیکي زنځیره شوی آډیټ لاګ. هره ننوتنه د SHA-256 هش "
            "له لارې خپل مخکیني سره تړلې ده، چې د سرغړونې پروړاندې مقاوم د احتسابولیت "
            "زنجیر رامنځته کوي چې خپلواکانه تصدیق کیدی شي."
        ),
        "core_pillars_heading": "اصلي ستنې",
        "pillar1_name": "1  |  د کوډ په توګه حاکمیت",
        "pillar1_desc": (
            "ټولې حاکمیتي پالیسۍ، د پیروي قوانین او عملیاتي محدودیتونه د نسخې کنټرول لاندې اثرونه دي — "
            "د بیاکتنې وړ، آډیټ وړ او د سافټویر په شان ځای پر ځای کیدونکي. "
            "بدلونونه د بشپړ اصلیت سره تعقیبیږي."
        ),
        "pillar2_name": "2  |  د AI تخنیکي پور له منځه وړل",
        "pillar2_desc": (
            "د ماډل ډرفټ، د معلوماتو کیفیت ستونزو، سیوری AI او غیر مستند ماډل انحصار "
            "منظم پیژندنه او سمول. چوکاټ منظم د پور آډیټونه اړین کوي او د سمون SLAs پلي کوي."
        ),
        "pillar3_name": "3  |  عملیاتي پیروي",
        "pillar3_desc": (
            "دوامداره تصدیق چې AI سیسټمونه د مطبق مقرراتو سره سم دي "
            "(د EU AI قانون، NIST AI RMF، ISO/IEC 42001). د پیروي بررسۍ اتوماتیکي، "
            "لاګ شوې او د اجرا کریپټوګرافیکي شواهدو سره تړلې دي."
        ),
        "pillar4_name": "4  |  د ټولنې لخوا چلول شوي معیارونه",
        "pillar4_desc": (
            "حاکمیتي معیارونه د ملګرتیا له لارې د عامه RFC پروسو، د همتایانو بیاکتنې "
            "او د اجماع تصویب له لارې رامنځته کیږي. هیڅ یو یواځینی پلورونکی معیار نه کنټرولوي — "
            "دا د عمل کوونکو ټولنې ته اړه لري."
        ),
        "what_contains_heading": "دا راپور څه لري",
        "bullet1": "د آډیټ لاګ جدول — هره حاکمیتي عملیات د کارونکي، پرامپټ، پایلې او هش لینکیج سره نیول شوي.",
        "bullet2": "د هش زنجیر تصدیق — د پیل/وروستي هش ښودلو سره د لاګ بشپړتیا کریپټوګرافیکي ثبوت.",
        "bullet3": "د تصدیق حالت — د بشپړ زنجیر آډیټ پاس/فیل پایله، د تنظیمي وړاندې کولو لپاره مناسبه.",
        "footer_link_text": "نور معلومات",
        "audit_table_heading": "آډیټ لاګ — د نه بدلیدونکي هش زنجیر جدول",
        "audit_table_intro":   "لاندې جدول ټولې {n} آډیټ لاګ ننوتنې د زمان له مخې ترتیب کې وړاندې کوي. "
                               "هره ننوتنه د عمل کوونکي، عملیات، پایلې او مخکیني ننوتنې سره کریپټوګرافیکي اړیکه ثبتوي. "
                               "هشونه د ښودلو لپاره 15 حروفو ته کمیږي؛ بشپړ هشونه د تصدیق برخه کې ښکاري.",
        "col_num":        "شمیره",
        "col_timestamp":  "وخت نښه",
        "col_user":       "کارونکی",
        "col_prompt":     "پرامپټ",
        "col_results":    "پایلې",
        "col_prev_hash":  "مخکیني هش",
        "col_curr_hash":  "اوسني هش",
        "verify_heading": "د هش زنجیر تصدیق",
        "verify_body": (
            "AiGovOps آډیټ لاګ د سرغړونې پروړاندې ضمانت لپاره SHA-256 کریپټوګرافیکي هش زنجیر کاروي. "
            "د هر ننوتنې <b>current_hash</b> د هغې د خپلو ساحو او مخکیني ننوتنې د "
            "<b>current_hash</b> د یوځای کیدو څخه اخیستل کیږي. د کومې ننوتنې بدلول "
            "ټولې وروسته هشونه باطلوي، د خاموشه بدلونونو کشف کیدل ممکن کوي."
        ),
        "chain_mechanism_heading": "د زنجیر میکانیزم",
        "verify_ok_msg":   "&#10003;  د هش زنجیر تصدیق شو — ټولې ننوتنې سالمې، هیڅ سرغړونه نه ده کشف شوې.",
        "verify_fail_msg": "&#10007;  د هش زنجیر مات شو — د ننوتنه ID {id} کې بشپړتیا ناکامي کشف شوه. دا لاګ ممکن سرغړونه شوی وي.",
        "chain_anchors_heading": "د زنجیر لنگرونه",
        "chain_anchors_body": (
            "لومړی او وروستی هشونه زنجیر لنگروي. هر درېیم ګوند کولای شي د سرچینې معلوماتو "
            "څخه زنجیر بیا محاسبه کولو او د دې ارزښتونو پرتله کولو سره بشپړتیا تصدیق کړي."
        ),
        "anchor_col_entry":  "ننوتنه",
        "anchor_col_field":  "ساحه",
        "anchor_col_hash":   "بشپړ SHA-256 هش",
        "anchor_first":      "لومړی\n(ID: {id})",
        "anchor_last":       "وروستی\n(ID: {id})",
        "audit_summary_heading": "د آډیټ لنډیز",
        "summary_total":     "ټول آډیټ ننوتنې",
        "summary_algorithm": "هش الګوریتم",
        "summary_status":    "د زنجیر حالت",
        "summary_genesis":   "د جینیسس هش تخم",
        "summary_generated": "راپور جوړ شو",
        "summary_version":   "د چوکاټ نسخه",
        "summary_cofounders":"ګډ بنسټګران",
        "status_verified":   "تصدیق شوی",
        "status_broken":     "د ننوتنه {id} کې ماتیدلی",
        "version_value":     "د اپریل 2026 نسخه 1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'دا راپور د AiGovOps Foundation آډیټ ټول چین لخوا جوړ شوی. '
            'د تصدیق وسیلو او سرچینه کوډ لپاره وګورئ '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"محرمانه — یوازې د مالک لاسرسی",
        "footer_page":        "مخ",
        "footer_of":          "له",
    },

    "sw": {
        "framework_word":       "Mfumo",
        "date_version":         "Aprili 2026 v1",
        "immutable_subtitle":   "Kumbukumbu ya Ukaguzi Isiyobadilika — Kielelezo cha Utiifu",
        "cofounders_label":     "Waanzilishi Wenza:",
        "report_generated":     "Ripoti Ilitengenezwa:",
        "audit_entries":        "Rekodi za Ukaguzi",
        "confidential":         "SIRI — Upatikanaji wa Mmiliki Pekee",
        "exec_summary_heading": "Muhtasari wa Utendaji",
        "exec_body1": (
            "<b>Mfumo wa AiGovOps Foundation</b> ni kiwango cha utawala wazi kinachosukumwa na jamii "
            "kwa ajili ya uendeshaji wa AI wenye uwajibikaji. Unatoa mashirika mbinu iliyopangwa ya "
            "kupeleka, kukagua na kudumisha mifumo ya AI kwa kufuata mahitaji ya udhibiti yanayobadilika "
            "na mbinu bora za tasnia."
        ),
        "exec_body2": (
            "Ripoti hii inaunda <b>kielelezo cha utiifu kisichobadilika</b> — kumbukumbu ya ukaguzi "
            "iliyounganishwa kwa kriptografia ya shughuli zote za utawala zilizofanywa chini ya mfumo. "
            "Kila rekodi imefungwa na mwenzake kupitia heshi SHA-256, na kuunda mnyororo wa uwajibikaji "
            "unaostahimili udanganyifu ambao unaweza kuthibitishwa kwa uhuru."
        ),
        "core_pillars_heading": "Nguzo Kuu",
        "pillar1_name": "1  |  Utawala kama Msimbo",
        "pillar1_desc": (
            "Sera zote za utawala, sheria za utiifu na vikwazo vya uendeshaji ni vielelezo "
            "vinavyodhibitiwa na toleo — vinavyoweza kukaguliwa, kupitiwa na kupelekwa kama programu. "
            "Mabadiliko yanafuatiliwa na asili kamili."
        ),
        "pillar2_name": "2  |  Kuondoa Deni la Kiufundi la AI",
        "pillar2_desc": (
            "Utambuzi na utatuzi wa kimfumo wa mgawanyiko wa modeli, matatizo ya ubora wa data, "
            "AI ya kivuli na tegemezi za modeli ambazo hazijadokumentwa. Mfumo unaagiza ukaguzi wa "
            "mara kwa mara wa deni na kutekeleza SLA za utatuzi."
        ),
        "pillar3_name": "3  |  Utiifu wa Uendeshaji",
        "pillar3_desc": (
            "Uthibitisho unaoendelea kwamba mifumo ya AI inakidhi kanuni zinazotumika "
            "(Sheria ya EU AI, NIST AI RMF, ISO/IEC 42001). Ukaguzi wa utiifu ni otomatiki, "
            "uliorekodiwa na umefungwa na ushahidi wa kriptografia wa utekelezaji."
        ),
        "pillar4_name": "4  |  Viwango Vinavyosukumwa na Jamii",
        "pillar4_desc": (
            "Viwango vya utawala vinaendelezwa kwa ushirikiano kupitia michakato ya RFC ya umma, "
            "ukaguzi wa rika na uthibitisho wa makubaliano. Hakuna muuzaji mmoja anayedhibiti kiwango "
            "— ni cha jamii ya watendaji."
        ),
        "what_contains_heading": "Maudhui ya Ripoti Hii",
        "bullet1": "Jedwali la Kumbukumbu ya Ukaguzi — kila operesheni ya utawala imerekodiwa na mtumiaji, msukumo, matokeo na kiunganishi cha heshi.",
        "bullet2": "Uthibitisho wa Mnyororo wa Heshi — ushahidi wa kriptografia wa uadilifu wa kumbukumbu na onyesho la heshi ya kwanza/ya mwisho.",
        "bullet3": "Hali ya Uthibitisho — matokeo ya kufaulu/kushindwa ya ukaguzi kamili wa mnyororo, yanayofaa kwa uwasilishaji wa udhibiti.",
        "footer_link_text": "Maelezo zaidi kwenye",
        "audit_table_heading": "Kumbukumbu ya Ukaguzi — Jedwali la Mnyororo wa Heshi Isiobadilika",
        "audit_table_intro":   "Jedwali lifuatalo linawasilisha rekodi zote {n} za kumbukumbu ya ukaguzi kwa mpangilio wa wakati. "
                               "Kila rekodi inarekodia mwigizaji, operesheni, matokeo na kiungo cha kriptografia na rekodi iliyotangulia. "
                               "Heshi zimefupishwa hadi herufi 15 kwa onyesho; heshi kamili zinaonekana katika sehemu ya uthibitisho.",
        "col_num":        "Namba",
        "col_timestamp":  "Muhuri wa Wakati",
        "col_user":       "Mtumiaji",
        "col_prompt":     "Msukumo",
        "col_results":    "Matokeo",
        "col_prev_hash":  "Heshi iliyotangulia",
        "col_curr_hash":  "Heshi ya Sasa",
        "verify_heading": "Uthibitisho wa Mnyororo wa Heshi",
        "verify_body": (
            "Kumbukumbu ya ukaguzi ya AiGovOps inatumia mnyororo wa heshi ya kriptografia SHA-256 "
            "kudhibitisha ukinzani wa udanganyifu. <b>current_hash</b> ya kila rekodi inatokana na "
            "mkusanyiko wa sehemu zake mwenyewe na <b>current_hash</b> ya rekodi iliyotangulia. "
            "Kubadilisha rekodi yoyote kunabatilisha heshi zote zinazofuata, na kufanya mabadiliko "
            "ya siri yaweze kugunduliwa."
        ),
        "chain_mechanism_heading": "Utaratibu wa Mnyororo",
        "verify_ok_msg":   "&#10003;  Mnyororo wa Heshi UMETHIBITISHWA — Rekodi zote ziko sawa, hakuna udanganyifu uliogunduliwa.",
        "verify_fail_msg": "&#10007;  Mnyororo wa Heshi UMEVUNJIKA — Kushindwa kwa uadilifu kumegunduliwa katika rekodi ya ID {id}. Kumbukumbu hii inaweza kuwa ilidanganywa.",
        "chain_anchors_heading": "Nanga za Mnyororo",
        "chain_anchors_body": (
            "Heshi za kwanza na za mwisho zinakodishwa mnyororo. Mtu yeyote wa tatu anaweza kuthibitisha "
            "uadilifu kwa kuhesabu upya mnyororo kutoka kwa data ya chanzo na kulinganisha thamani hizi."
        ),
        "anchor_col_entry":  "Rekodi",
        "anchor_col_field":  "Sehemu",
        "anchor_col_hash":   "Heshi Kamili ya SHA-256",
        "anchor_first":      "Ya Kwanza\n(ID: {id})",
        "anchor_last":       "Ya Mwisho\n(ID: {id})",
        "audit_summary_heading": "Muhtasari wa Ukaguzi",
        "summary_total":     "Jumla ya Rekodi za Ukaguzi",
        "summary_algorithm": "Algoriti ya Heshi",
        "summary_status":    "Hali ya Mnyororo",
        "summary_genesis":   "Mbegu ya Heshi ya Awali",
        "summary_generated": "Ripoti Ilitengenezwa",
        "summary_version":   "Toleo la Mfumo",
        "summary_cofounders":"Waanzilishi Wenza",
        "status_verified":   "IMETHIBITISHWA",
        "status_broken":     "IMEVUNJIKA kwenye rekodi {id}",
        "version_value":     "Aprili 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'Ripoti hii ilitengenezwa na msururu wa zana za ukaguzi wa AiGovOps Foundation. '
            'Kwa zana za uthibitisho na msimbo wa chanzo, tembelea '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"SIRI — Upatikanaji wa Mmiliki Pekee",
        "footer_page":        "Ukurasa",
        "footer_of":          "ya",
    },

    "chr": {
        # Cherokee — syllabary for short labels, English fallback for long technical text
        "framework_word":       "ᎦᏃᎮᏛ",           # "Framework" in Cherokee concept
        "date_version":         "April 2026 v1",
        "immutable_subtitle":   "ᏰᎵᏁ ᎪᎱᏍᏗ — Compliance Artifact",
        "cofounders_label":     "ᎠᏍᏓᏅᏅ:",
        "report_generated":     "ᎪᎱᏍᏗ ᎠᏏᏉᏍᏗ:",
        "audit_entries":        "ᎪᎱᏍᏗ ᎠᏍᏛᏗᏍᏗ",
        "confidential":         "ᎤᏅᏏᏓ — CONFIDENTIAL",
        "exec_summary_heading": "ᎪᎱᏍᏗ ᎠᏓᏅᏖᏗ",
        "exec_body1": (
            "The <b>AiGovOps Foundation Framework</b> is an open, community-driven governance standard "
            "for responsible AI operations. It provides organizations with a structured approach to "
            "deploying, auditing, and maintaining AI systems in compliance with evolving regulatory "
            "requirements and industry best practices."
        ),
        "exec_body2": (
            "This report constitutes an <b>immutable compliance artifact</b> — a cryptographically "
            "chained audit log of all governance operations performed under the framework. Each entry "
            "is linked to its predecessor via SHA-256 hash, creating a tamper-evident chain of "
            "accountability that can be independently verified."
        ),
        "core_pillars_heading": "ᎠᏆᏤᎵ ᎠᏂᏌᎳ",
        "pillar1_name": "1  |  Governance as Code",
        "pillar1_desc": (
            "All governance policies, compliance rules, and operational constraints are version-controlled "
            "artifacts — reviewable, auditable, and deployable like software. Changes are tracked with full provenance."
        ),
        "pillar2_name": "2  |  AI Technical Debt Elimination",
        "pillar2_desc": (
            "Systematic identification and remediation of model drift, data quality issues, shadow AI, "
            "and undocumented model dependencies. The framework mandates regular debt audits and enforces remediation SLAs."
        ),
        "pillar3_name": "3  |  Operational Compliance",
        "pillar3_desc": (
            "Continuous verification that AI systems meet applicable regulations (EU AI Act, NIST AI RMF, "
            "ISO/IEC 42001). Compliance checks are automated, logged, and tied to cryptographic proofs of execution."
        ),
        "pillar4_name": "4  |  Community-Driven Standards",
        "pillar4_desc": (
            "Governance standards are developed collaboratively via public RFC processes, peer review, "
            "and consensus ratification. No single vendor controls the standard — it belongs to the community of practitioners."
        ),
        "what_contains_heading": "ᏥᎪᎱᏍᏙᏗ",
        "bullet1": "Audit Log Table — every governance operation captured with user, prompt, outcome, and hash linkage.",
        "bullet2": "Hash Chain Verification — cryptographic proof of log integrity with first/last hash display.",
        "bullet3": "Verification Status — pass/fail result of the full chain audit, suitable for regulatory submission.",
        "footer_link_text": "More information at",
        "audit_table_heading": "ᎪᎱᏍᏗ ᏗᏜ — Immutable Hash Chain Table",
        "audit_table_intro":   "The following table presents all {n} audit log entries in chronological order. "
                               "Each entry records the actor, operation, outcome, and cryptographic link to the preceding entry. "
                               "Hashes are truncated to 15 characters for display; full hashes appear in the verification section.",
        "col_num":        "ᏅᏬ",
        "col_timestamp":  "ᏰᎵ",
        "col_user":       "ᎠᏍᎦᏯ",
        "col_prompt":     "Prompt",
        "col_results":    "ᏧᎾᏓᎴᏅᏛ",
        "col_prev_hash":  "Prev Hash",
        "col_curr_hash":  "Current Hash",
        "verify_heading": "ᎪᎱᏍᏗ ᏚᏓᏏᏕᏫᏍᏗᏍᎩ",
        "verify_body": (
            "The AiGovOps audit log employs a SHA-256 cryptographic hash chain to guarantee "
            "tamper-evidence. Each entry's <b>current_hash</b> is derived from the concatenation of "
            "its own fields and the <b>current_hash</b> of the preceding entry. Modifying any entry "
            "invalidates all subsequent hashes, making silent alterations detectable."
        ),
        "chain_mechanism_heading": "Chain Mechanism",
        "verify_ok_msg":   "&#10003;  Hash Chain VERIFIED — All entries intact, no tampering detected.",
        "verify_fail_msg": "&#10007;  Hash Chain BROKEN — Integrity failure detected at entry ID {id}. This log may have been tampered with.",
        "chain_anchors_heading": "ᎠᏓᏁᎸ ᎠᏂᏌᎳ",
        "chain_anchors_body": (
            "The first and last hashes anchor the chain. Any third party can verify integrity "
            "by recomputing the chain from source data and comparing these values."
        ),
        "anchor_col_entry":  "ᎠᏍᏛᏗᏍᏗ",
        "anchor_col_field":  "Field",
        "anchor_col_hash":   "Full SHA-256 Hash",
        "anchor_first":      "First\n(ID: {id})",
        "anchor_last":       "Last\n(ID: {id})",
        "audit_summary_heading": "ᎪᎱᏍᏗ ᎠᏓᏅᏖᏗ",
        "summary_total":     "Total Audit Entries",
        "summary_algorithm": "Hash Algorithm",
        "summary_status":    "Chain Status",
        "summary_genesis":   "Genesis Hash Seed",
        "summary_generated": "ᎪᎱᏍᏗ ᎠᏏᏉᏍᏗ",
        "summary_version":   "Framework Version",
        "summary_cofounders":"ᎠᏍᏓᏅᏅ",
        "status_verified":   "VERIFIED",
        "status_broken":     "BROKEN at entry {id}",
        "version_value":     "April 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'This report was generated by the AiGovOps Foundation audit toolchain. '
            'For verification tools and source code, visit '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"ᎤᏅᏏᏓ — CONFIDENTIAL",
        "footer_page":        "ᏧᏁᎢ",
        "footer_of":          "of",
    },

    "brl": {
        # Braille Unicode — short labels use Braille patterns, long text falls back to English
        # Grade 1 Braille Unicode block U+2800–U+28FF
        "framework_word":       "⠋⠗⠁⠍⠑⠺⠕⠗⠅",      # "framework"
        "date_version":         "April 2026 v1",
        "immutable_subtitle":   "⠊⠍⠍⠥⠞⠁⠃⠇⠑ ⠁⠥⠙⠊⠞ ⠇⠕⠛ — Compliance Artifact",
        "cofounders_label":     "⠉⠕⠤⠋⠕⠥⠝⠙⠑⠗⠎⠒",
        "report_generated":     "⠗⠑⠏⠕⠗⠞ ⠛⠑⠝⠑⠗⠁⠞⠑⠙⠒",
        "audit_entries":        "⠁⠥⠙⠊⠞ ⠑⠝⠞⠗⠊⠑⠎",
        "confidential":         "⠉⠕⠝⠋⠊⠙⠑⠝⠞⠊⠁⠇ — Owner Access Only",
        "exec_summary_heading": "⠑⠭⠑⠉⠥⠞⠊⠧⠑ ⠎⠥⠍⠍⠁⠗⠽",
        "exec_body1": (
            "The <b>AiGovOps Foundation Framework</b> is an open, community-driven governance standard "
            "for responsible AI operations. It provides organizations with a structured approach to "
            "deploying, auditing, and maintaining AI systems in compliance with evolving regulatory "
            "requirements and industry best practices."
        ),
        "exec_body2": (
            "This report constitutes an <b>immutable compliance artifact</b> — a cryptographically "
            "chained audit log of all governance operations performed under the framework. Each entry "
            "is linked to its predecessor via SHA-256 hash, creating a tamper-evident chain of "
            "accountability that can be independently verified."
        ),
        "core_pillars_heading": "⠉⠕⠗⠑ ⠏⠊⠇⠇⠁⠗⠎",
        "pillar1_name": "1  |  Governance as Code",
        "pillar1_desc": (
            "All governance policies, compliance rules, and operational constraints are version-controlled "
            "artifacts — reviewable, auditable, and deployable like software. Changes are tracked with full provenance."
        ),
        "pillar2_name": "2  |  AI Technical Debt Elimination",
        "pillar2_desc": (
            "Systematic identification and remediation of model drift, data quality issues, shadow AI, "
            "and undocumented model dependencies. The framework mandates regular debt audits and enforces remediation SLAs."
        ),
        "pillar3_name": "3  |  Operational Compliance",
        "pillar3_desc": (
            "Continuous verification that AI systems meet applicable regulations (EU AI Act, NIST AI RMF, "
            "ISO/IEC 42001). Compliance checks are automated, logged, and tied to cryptographic proofs of execution."
        ),
        "pillar4_name": "4  |  Community-Driven Standards",
        "pillar4_desc": (
            "Governance standards are developed collaboratively via public RFC processes, peer review, "
            "and consensus ratification. No single vendor controls the standard — it belongs to the community of practitioners."
        ),
        "what_contains_heading": "⠺⠓⠁⠞ ⠞⠓⠊⠎ ⠗⠑⠏⠕⠗⠞ ⠉⠕⠝⠞⠁⠊⠝⠎",
        "bullet1": "Audit Log Table — every governance operation captured with user, prompt, outcome, and hash linkage.",
        "bullet2": "Hash Chain Verification — cryptographic proof of log integrity with first/last hash display.",
        "bullet3": "Verification Status — pass/fail result of the full chain audit, suitable for regulatory submission.",
        "footer_link_text": "More information at",
        "audit_table_heading": "⠁⠥⠙⠊⠞ ⠇⠕⠛ — Immutable Hash Chain Table",
        "audit_table_intro":   "The following table presents all {n} audit log entries in chronological order. "
                               "Each entry records the actor, operation, outcome, and cryptographic link to the preceding entry. "
                               "Hashes are truncated to 15 characters for display; full hashes appear in the verification section.",
        "col_num":        "⠼⠁",
        "col_timestamp":  "⠞⠊⠍⠑",
        "col_user":       "⠥⠎⠑⠗",
        "col_prompt":     "⠏⠗⠕⠍⠏⠞",
        "col_results":    "⠗⠑⠎⠥⠇⠞⠎",
        "col_prev_hash":  "⠏⠗⠑⠧ ⠓⠁⠎⠓",
        "col_curr_hash":  "⠉⠥⠗⠗ ⠓⠁⠎⠓",
        "verify_heading": "⠓⠁⠎⠓ ⠉⠓⠁⠊⠝ ⠧⠑⠗⠊⠋⠊⠉⠁⠞⠊⠕⠝",
        "verify_body": (
            "The AiGovOps audit log employs a SHA-256 cryptographic hash chain to guarantee "
            "tamper-evidence. Each entry's <b>current_hash</b> is derived from the concatenation of "
            "its own fields and the <b>current_hash</b> of the preceding entry. Modifying any entry "
            "invalidates all subsequent hashes, making silent alterations detectable."
        ),
        "chain_mechanism_heading": "⠉⠓⠁⠊⠝ ⠍⠑⠉⠓⠁⠝⠊⠎⠍",
        "verify_ok_msg":   "&#10003;  ⠓⠁⠎⠓ ⠉⠓⠁⠊⠝ ⠧⠑⠗⠊⠋⠊⠑⠙ — All entries intact, no tampering detected.",
        "verify_fail_msg": "&#10007;  ⠓⠁⠎⠓ ⠉⠓⠁⠊⠝ ⠃⠗⠕⠅⠑⠝ — Integrity failure at entry ID {id}.",
        "chain_anchors_heading": "⠉⠓⠁⠊⠝ ⠁⠝⠉⠓⠕⠗⠎",
        "chain_anchors_body": (
            "The first and last hashes anchor the chain. Any third party can verify integrity "
            "by recomputing the chain from source data and comparing these values."
        ),
        "anchor_col_entry":  "⠑⠝⠞⠗⠽",
        "anchor_col_field":  "⠋⠊⠑⠇⠙",
        "anchor_col_hash":   "Full SHA-256 Hash",
        "anchor_first":      "First\n(ID: {id})",
        "anchor_last":       "Last\n(ID: {id})",
        "audit_summary_heading": "⠁⠥⠙⠊⠞ ⠎⠥⠍⠍⠁⠗⠽",
        "summary_total":     "⠞⠕⠞⠁⠇ ⠁⠥⠙⠊⠞ ⠑⠝⠞⠗⠊⠑⠎",
        "summary_algorithm": "⠓⠁⠎⠓ ⠁⠇⠛⠕⠗⠊⠞⠓⠍",
        "summary_status":    "⠉⠓⠁⠊⠝ ⠎⠞⠁⠞⠥⠎",
        "summary_genesis":   "Genesis Hash Seed",
        "summary_generated": "⠗⠑⠏⠕⠗⠞ ⠛⠑⠝⠑⠗⠁⠞⠑⠙",
        "summary_version":   "Framework Version",
        "summary_cofounders":"⠉⠕⠤⠋⠕⠥⠝⠙⠑⠗⠎",
        "status_verified":   "⠧⠑⠗⠊⠋⠊⠑⠙",
        "status_broken":     "⠃⠗⠕⠅⠑⠝ at entry {id}",
        "version_value":     "April 2026 v1",
        "cofounders_value":  "Bob Rapp & Ken Johnston",
        "verify_footer": (
            'This report was generated by the AiGovOps Foundation audit toolchain. '
            'For verification tools and source code, visit '
            '<a href="https://www.aigovopsfoundation.org/" color="#01696F">www.aigovopsfoundation.org</a>.'
        ),
        "footer_org":         "AiGovOps Foundation — www.aigovopsfoundation.org",
        "footer_confidential":"⠉⠕⠝⠋⠊⠙⠑⠝⠞⠊⠁⠇ — Owner Access Only",
        "footer_page":        "⠏⠁⠛⠑",
        "footer_of":          "⠕⠋",
    },
}

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
    try:
        cur.execute(
            """SELECT id, timestamp, date, user, prompt, results,
                      previous_hash, current_hash
               FROM audit_logs ORDER BY id ASC"""
        )
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            d["prev_hash"] = d.pop("previous_hash", d.get("prev_hash", ""))
            rows.append(d)
    except sqlite3.OperationalError:
        try:
            cur.execute("SELECT * FROM audit_logs ORDER BY rowid ASC")
            rows = []
            for r in cur.fetchall():
                d = dict(r)
                d["prev_hash"] = d.pop("previous_hash", d.get("prev_hash", ""))
                rows.append(d)
        except sqlite3.OperationalError as e:
            print(f"[WARN] Could not read audit_logs: {e}. Using demo data.", file=sys.stderr)
            rows = None
    conn.close()
    return rows


def verify_hash_chain(entries):
    """
    Verify the SHA-256 hash chain.
    Matches the Node.js verification: genesis prev_hash is "0" (single char),
    hash = SHA-256(timestamp|user|prompt|results|previousHash).
    Returns (is_valid, broken_at_id) where broken_at_id is None if valid.
    """
    for i, entry in enumerate(entries):
        expected_prev = "0" if i == 0 else entries[i - 1].get("current_hash", "")
        actual_prev = entry.get("prev_hash", "")
        if actual_prev != expected_prev:
            return False, entry.get("id", i + 1)
        payload = (
            f"{entry['timestamp']}|{entry['user']}|"
            f"{entry['prompt']}|{entry['results']}|{actual_prev}"
        )
        expected_hash = hashlib.sha256(payload.encode()).hexdigest()
        if entry.get("current_hash") and entry["current_hash"] != expected_hash:
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

    left = x - w / 2
    right = x + w / 2
    top = y + h
    mid_y = y + h * 0.45

    c.saveState()

    c.setFillColor(TEAL)
    c.setStrokeColor(white)
    c.setLineWidth(1.5)

    p = c.beginPath()
    radius = w * 0.18
    p.moveTo(left + radius, top)
    p.lineTo(right - radius, top)
    p.arcTo(right - 2 * radius, top - 2 * radius, right, top, 0, 90)
    p.lineTo(right, mid_y)
    p.lineTo(x, y)
    p.lineTo(left, mid_y)
    p.lineTo(left, top - radius)
    p.arcTo(left, top - 2 * radius, left + 2 * radius, top, 90, 90)
    p.close()
    c.drawPath(p, fill=1, stroke=1)

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


def make_footer(c, doc, total_pages=None, tr=None, lang="en"):
    """Draw the standard footer on a page."""
    if tr is None:
        tr = PDF_TRANSLATIONS["en"]
    is_rtl = lang in RTL_LANGS

    c.saveState()
    footer_y = MARGIN * 0.5
    page_w = PAGE_W

    # Thin rule above footer
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)
    c.line(MARGIN, footer_y + 10, page_w - MARGIN, footer_y + 10)

    if total_pages:
        page_text = f"{tr['footer_page']} {doc.page} {tr['footer_of']} {total_pages}"
    else:
        page_text = f"{tr['footer_page']} {doc.page}"

    org_text = tr["footer_org"]
    conf_text = tr["footer_confidential"]

    if is_rtl:
        # RTL: org name goes right, page number goes left
        right_text = _rtl_canvas_text(org_text, lang)
        left_text = page_text
        center_text = _rtl_canvas_text(conf_text, lang)
        reg_font, bold_font = get_font_for_lang(lang)

        c.setFont(reg_font, 7.5)
        c.setFillColor(TEXT_MUTED)
        c.drawRightString(page_w - MARGIN, footer_y, right_text)

        c.setFont(bold_font, 7.5)
        c.setFillColor(NAVY)
        c.drawCentredString(page_w / 2, footer_y, center_text)

        c.setFont("Helvetica", 7.5)
        c.setFillColor(TEXT_MUTED)
        c.drawString(MARGIN, footer_y, left_text)
    else:
        # LTR: org name goes left, page number goes right
        c.setFont("Helvetica", 7.5)
        c.setFillColor(TEXT_MUTED)
        c.drawString(MARGIN, footer_y, org_text)

        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(NAVY)
        c.drawCentredString(page_w / 2, footer_y, conf_text)

        c.setFont("Helvetica", 7.5)
        c.setFillColor(TEXT_MUTED)
        c.drawRightString(page_w - MARGIN, footer_y, page_text)

    c.restoreState()


def make_header_line(c, doc):
    """Draw a thin navy rule under the header area (non-cover pages)."""
    c.saveState()
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.5)
    c.line(MARGIN, PAGE_H - MARGIN + 4, PAGE_W - MARGIN, PAGE_H - MARGIN + 4)
    c.restoreState()


def cover_page_cb(c, doc, tr, lang):
    """Cover page: full navy background, no header rule."""
    make_footer(c, doc, total_pages=getattr(doc, "_total_pages", None), tr=tr, lang=lang)


def inner_page_cb(c, doc, tr, lang):
    """Interior pages: header rule + footer."""
    make_header_line(c, doc)
    make_footer(c, doc, total_pages=getattr(doc, "_total_pages", None), tr=tr, lang=lang)


# ── Style helpers ─────────────────────────────────────────────────────────────
def build_styles(lang="en"):
    base = getSampleStyleSheet()
    styles = {}

    reg_font, bold_font = get_font_for_lang(lang)
    is_rtl = lang in RTL_LANGS
    body_align = 2 if is_rtl else 0   # TA_RIGHT=2, TA_LEFT=0

    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName=bold_font,
        fontSize=26,
        leading=32,
        textColor=white,
        spaceAfter=10,
        alignment=1,  # center always
    )
    styles["cover_subtitle"] = ParagraphStyle(
        "cover_subtitle",
        fontName=reg_font,
        fontSize=13,
        leading=18,
        textColor=HexColor("#A8C4E0"),
        spaceAfter=6,
        alignment=1,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta",
        fontName=reg_font,
        fontSize=10,
        leading=14,
        textColor=HexColor("#C8D8EC"),
        alignment=1,
    )
    styles["section_heading"] = ParagraphStyle(
        "section_heading",
        fontName=bold_font,
        fontSize=15,
        leading=20,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=8,
        borderPadding=(0, 0, 4, 0),
        alignment=0,  # headings always left
    )
    styles["subsection"] = ParagraphStyle(
        "subsection",
        fontName=bold_font,
        fontSize=11,
        leading=15,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=4,
        alignment=body_align,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName=reg_font,
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        spaceAfter=6,
        alignment=body_align,
        wordWrap="CJK",
    )
    styles["body_muted"] = ParagraphStyle(
        "body_muted",
        fontName=reg_font,
        fontSize=9,
        leading=13,
        textColor=TEXT_MUTED,
        spaceAfter=4,
        alignment=body_align,
        wordWrap="CJK",
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName=reg_font,
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        leftIndent=16,
        spaceAfter=4,
        bulletIndent=4,
        alignment=body_align,
        wordWrap="CJK",
    )
    styles["pillar_name"] = ParagraphStyle(
        "pillar_name",
        fontName=bold_font,
        fontSize=10,
        leading=13,
        textColor=TEAL,
        spaceAfter=2,
        alignment=body_align,
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
        fontName=bold_font,
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
        fontName=bold_font,
        fontSize=8,
        leading=10,
        textColor=white,
        wordWrap="CJK",
    )
    styles["table_cell"] = ParagraphStyle(
        "table_cell",
        fontName=reg_font,
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
        fontName=bold_font,
        fontSize=11,
        leading=15,
        textColor=HexColor("#1A7A40"),
        spaceAfter=6,
        alignment=body_align,
    )
    styles["verify_fail"] = ParagraphStyle(
        "verify_fail",
        fontName=bold_font,
        fontSize=11,
        leading=15,
        textColor=HexColor("#A12C2C"),
        spaceAfter=6,
        alignment=body_align,
    )
    return styles


# ── Cover page (canvas-drawn, no Platypus frames) ─────────────────────────────
def draw_cover(c, doc, entries, qr_buf, tr=None, lang="en"):
    """Draw the full cover page directly on the canvas."""
    if tr is None:
        tr = PDF_TRANSLATIONS["en"]

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

    # "AiGovOps Foundation" above shield — brand name always in English
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(HexColor("#A8C4E0"))
    c.drawCentredString(w / 2, h * 0.78, "AiGovOps Foundation")

    # Title: "AiGovOps Foundation {Framework word}"
    title_y = h * 0.56
    reg_font, bold_font = get_font_for_lang(lang)

    # Try to draw translated framework word; title stays centered
    framework_str = _rtl_canvas_text(f"AiGovOps Foundation {tr['framework_word']}", lang)
    date_str_cover = _rtl_canvas_text(tr["date_version"], lang)

    c.setFont(bold_font, 22)
    c.setFillColor(white)
    c.drawCentredString(w / 2, title_y, framework_str)
    c.setFont(bold_font, 18)
    c.drawCentredString(w / 2, title_y - 26, date_str_cover)

    # Divider line
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.5)
    div_y = title_y - 42
    c.line(w * 0.25, div_y, w * 0.75, div_y)

    # Subtitle
    subtitle_str = _rtl_canvas_text(tr["immutable_subtitle"], lang)
    c.setFont(reg_font, 12)
    c.setFillColor(HexColor("#A8C4E0"))
    c.drawCentredString(w / 2, div_y - 18, subtitle_str)

    # Co-founder attribution
    attr_y = div_y - 48
    cofounder_line = _rtl_canvas_text(f"{tr['cofounders_label']} Bob Rapp & Ken Johnston", lang)
    c.setFont(bold_font, 9.5)
    c.setFillColor(HexColor("#C8D8EC"))
    c.drawCentredString(w / 2, attr_y, cofounder_line)

    # Date
    date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    report_gen_line = _rtl_canvas_text(f"{tr['report_generated']} {date_str} UTC", lang)
    c.setFont(reg_font, 9)
    c.setFillColor(HexColor("#8AAAC8"))
    c.drawCentredString(w / 2, attr_y - 16, report_gen_line)

    # Entry count badge
    c.setFillColor(TEAL)
    badge_x, badge_y, badge_w, badge_h = w / 2 - 60, attr_y - 50, 120, 24
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 5, fill=1, stroke=0)
    c.setFont(bold_font, 9)
    c.setFillColor(white)
    badge_text = _rtl_canvas_text(f"{len(entries)} {tr['audit_entries']}", lang)
    c.drawCentredString(w / 2, badge_y + 7, badge_text)

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
    is_rtl = lang in RTL_LANGS
    org_text = _rtl_canvas_text(tr["footer_org"], lang)
    conf_text = _rtl_canvas_text(tr["footer_confidential"], lang)

    if is_rtl:
        c.setFont(reg_font, 7.5)
        c.setFillColor(HexColor("#6A8AAC"))
        c.drawRightString(w - MARGIN, MARGIN * 0.7, org_text)
        c.setFont(bold_font, 7.5)
        c.setFillColor(HexColor("#8AAAC8"))
        c.drawCentredString(w / 2, MARGIN * 0.7, conf_text)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(HexColor("#6A8AAC"))
        c.drawString(MARGIN, MARGIN * 0.7, "Page 1")
    else:
        c.setFont("Helvetica", 7.5)
        c.setFillColor(HexColor("#6A8AAC"))
        c.drawString(MARGIN, MARGIN * 0.7, org_text)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(HexColor("#8AAAC8"))
        c.drawCentredString(w / 2, MARGIN * 0.7, conf_text)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(HexColor("#6A8AAC"))
        c.drawRightString(w - MARGIN, MARGIN * 0.7, "Page 1")

    c.restoreState()


# ── Section: Executive Summary ────────────────────────────────────────────────
def build_exec_summary(styles, tr=None):
    if tr is None:
        tr = PDF_TRANSLATIONS["en"]
    story = []

    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header(tr["exec_summary_heading"], styles))

    story.append(Paragraph(tr["exec_body1"], styles["body"]))
    story.append(Paragraph(tr["exec_body2"], styles["body"]))

    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(tr["core_pillars_heading"], styles["subsection"]))

    pillars = [
        (tr["pillar1_name"], tr["pillar1_desc"]),
        (tr["pillar2_name"], tr["pillar2_desc"]),
        (tr["pillar3_name"], tr["pillar3_desc"]),
        (tr["pillar4_name"], tr["pillar4_desc"]),
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
    story.append(Paragraph(tr["what_contains_heading"], styles["subsection"]))

    contents = [tr["bullet1"], tr["bullet2"], tr["bullet3"]]
    for item in contents:
        story.append(Paragraph(f"&#8226;  {item}", styles["bullet"]))

    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        f'{tr["footer_link_text"]} <a href="https://www.aigovopsfoundation.org/" color="#01696F">'
        'www.aigovopsfoundation.org</a>.',
        styles["body_muted"],
    ))

    return story


# ── Section: Audit Log Table ──────────────────────────────────────────────────
def build_audit_table(entries, styles, tr=None, lang="en"):
    if tr is None:
        tr = PDF_TRANSLATIONS["en"]
    story = []

    story.append(PageBreak())
    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header(tr["audit_table_heading"], styles))

    intro_text = tr["audit_table_intro"].format(n=len(entries))
    story.append(Paragraph(intro_text, styles["body"]))
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
        wrap(tr["col_num"], styles["table_header"]),
        wrap(tr["col_timestamp"], styles["table_header"]),
        wrap(tr["col_user"], styles["table_header"]),
        wrap(tr["col_prompt"], styles["table_header"]),
        wrap(tr["col_results"], styles["table_header"]),
        wrap(tr["col_prev_hash"], styles["table_header"]),
        wrap(tr["col_curr_hash"], styles["table_header"]),
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

    is_rtl = lang in RTL_LANGS
    lpad = "RIGHTPADDING" if is_rtl else "LEFTPADDING"
    rpad = "LEFTPADDING" if is_rtl else "RIGHTPADDING"

    style_cmds = [
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), get_font_for_lang(lang)[1]),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "RIGHT" if is_rtl else "LEFT"),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        (lpad, (0, 0), (-1, 0), 5),
        (rpad, (0, 0), (-1, 0), 5),
        # Body rows
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("FONTSIZE", (0, 1), (-1, -1), 7.5),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        (lpad, (0, 1), (-1, -1), 5),
        (rpad, (0, 1), (-1, -1), 5),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, TEAL),
    ]

    for (r, _) in alt_rows:
        style_cmds.append(("BACKGROUND", (0, r), (-1, r), ROW_ALT))

    table.setStyle(TableStyle(style_cmds))
    story.append(table)

    return story


# ── Section: Hash Chain Verification ─────────────────────────────────────────
def build_verification_section(entries, styles, tr=None, lang="en"):
    if tr is None:
        tr = PDF_TRANSLATIONS["en"]
    story = []

    story.append(PageBreak())
    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header(tr["verify_heading"], styles))

    story.append(Paragraph(tr["verify_body"], styles["body"]))

    # Mechanism diagram (text-based) — keep as monospace/English
    story.append(Spacer(1, 0.12 * inch))
    story.append(Paragraph(tr["chain_mechanism_heading"], styles["subsection"]))

    mechanism_text = (
        "Entry N fields: { id, timestamp, user, prompt, results, prev_hash }\n"
        "current_hash(N) = SHA-256( id | timestamp | user | prompt | results | current_hash(N-1) )\n"
        "prev_hash(N)     = current_hash(N-1)\n"
        "Genesis entry:   prev_hash = '0'"
    )
    story.append(Paragraph(mechanism_text, styles["mono"]))

    story.append(Spacer(1, 0.15 * inch))

    # Chain verification result
    chain_valid, broken_at = verify_hash_chain(entries)

    if chain_valid:
        story.append(Paragraph(tr["verify_ok_msg"], styles["verify_ok"]))
    else:
        fail_msg = tr["verify_fail_msg"].format(id=broken_at)
        story.append(Paragraph(fail_msg, styles["verify_fail"]))

    story.append(Spacer(1, 0.15 * inch))

    # First and last entry hashes
    story.append(Paragraph(tr["chain_anchors_heading"], styles["subsection"]))
    story.append(Paragraph(tr["chain_anchors_body"], styles["body"]))
    story.append(Spacer(1, 0.08 * inch))

    reg_font, bold_font = get_font_for_lang(lang)

    if entries:
        first = entries[0]
        last = entries[-1]

        def wrap_anchor(text, font="Helvetica", size=8.5, color=TEXT_DARK):
            st = ParagraphStyle(
                "a", fontName=font, fontSize=size, leading=12, textColor=color,
                wordWrap="CJK",
            )
            return Paragraph(str(text), st)

        anchor_display = [
            [
                wrap_anchor(tr["anchor_col_entry"], bold_font, color=white),
                wrap_anchor(tr["anchor_col_field"], bold_font, color=white),
                wrap_anchor(tr["anchor_col_hash"], bold_font, color=white),
            ],
            [
                wrap_anchor(tr["anchor_first"].format(id=first.get("id", "?")), bold_font, color=NAVY),
                wrap_anchor("current_hash", reg_font),
                wrap_anchor(str(first.get("current_hash", "N/A")), "Courier", 7.5, TEAL),
            ],
            [
                wrap_anchor(tr["anchor_last"].format(id=last.get("id", "?")), bold_font, color=NAVY),
                wrap_anchor("current_hash", reg_font),
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
            ("FONTNAME", (0, 0), (-1, 0), bold_font),
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

    # Audit Summary
    story.append(Paragraph(tr["audit_summary_heading"], styles["subsection"]))

    status_color = HexColor("#1A7A40") if chain_valid else HexColor("#A12C2C")
    status_val = (
        tr["status_verified"] if chain_valid
        else tr["status_broken"].format(id=broken_at)
    )

    summary_rows = [
        (tr["summary_total"],      str(len(entries))),
        (tr["summary_algorithm"],  "SHA-256"),
        (tr["summary_status"],     status_val),
        (tr["summary_genesis"],    "0 (single character — genesis seed)"),
        (tr["summary_generated"],  datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")),
        (tr["summary_version"],    tr["version_value"]),
        (tr["summary_cofounders"], tr["cofounders_value"]),
    ]

    summary_table_data = []
    for label, value in summary_rows:
        val_color = status_color if label == tr["summary_status"] else TEXT_DARK
        val_font = bold_font if label == tr["summary_status"] else reg_font
        summary_table_data.append([
            Paragraph(label, ParagraphStyle(
                "sl", fontName=bold_font, fontSize=9, leading=12, textColor=TEXT_MUTED,
                wordWrap="CJK",
            )),
            Paragraph(value, ParagraphStyle(
                "sv", fontName=val_font, fontSize=9, leading=12, textColor=val_color,
                wordWrap="CJK",
            )),
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
    story.append(Paragraph(tr["verify_footer"], styles["body_muted"]))

    return story


# ── Section: SBOM Dependency Diff ─────────────────────────────────────────────
def build_sbom_diff_section(sbom_diff, styles):
    """Render SBOM diff as a PDF section with added/removed/changed tables."""
    story = []

    story.append(PageBreak())
    story.append(Spacer(1, 0.1 * inch))
    story.append(_section_header("Supply-Chain SBOM Diff", styles))

    s = sbom_diff.get("summary", {})
    old_tag = sbom_diff.get("old_tag", "previous")
    new_tag = sbom_diff.get("new_tag", "current")

    story.append(Paragraph(
        f"Dependency inventory comparison between <b>{old_tag}</b> and <b>{new_tag}</b>. "
        f"This diff highlights new, removed, and version-changed components to support "
        f"supply-chain risk assessment and compliance review.",
        styles["body"],
    ))
    story.append(Spacer(1, 0.12 * inch))

    story.append(Paragraph("Diff Summary", styles["subsection"]))

    GREEN = HexColor("#1A7A40")
    RED = HexColor("#A12C2C")
    AMBER = HexColor("#B8860B")

    def _styled(text, color=TEXT_DARK, bold=False):
        font = "Helvetica-Bold" if bold else "Helvetica"
        return Paragraph(
            str(text),
            ParagraphStyle("_s", fontName=font, fontSize=9, leading=12, textColor=color),
        )

    summary_rows = [
        [_styled("Metric", bold=True), _styled("Value", bold=True)],
        [_styled("Previous release"), _styled(f"{old_tag}  ({s.get('old_count', '?')} components)")],
        [_styled("Current release"), _styled(f"{new_tag}  ({s.get('new_count', '?')} components)")],
        [_styled("Added"), _styled(f"+{s.get('added', 0)}", GREEN if s.get('added', 0) > 0 else TEXT_DARK, bold=True)],
        [_styled("Removed"), _styled(f"-{s.get('removed', 0)}", RED if s.get('removed', 0) > 0 else TEXT_DARK, bold=True)],
        [_styled("Version changed"), _styled(f"~{s.get('version_changed', 0)}", AMBER if s.get('version_changed', 0) > 0 else TEXT_DARK, bold=True)],
        [_styled("Unchanged"), _styled(f"={s.get('unchanged', 0)}")],
    ]

    sum_table = Table(summary_rows, colWidths=[2.2 * inch, 4.8 * inch])
    sum_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("BACKGROUND", (0, 1), (0, -1), HexColor("#F3F5FA")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 0.15 * inch))

    def _comp_table(heading, items, columns, col_widths, accent_color):
        if not items:
            return
        story.append(Paragraph(heading, styles["subsection"]))
        story.append(Paragraph(
            f"{len(items)} component{'s' if len(items) != 1 else ''}.",
            styles["body_muted"],
        ))

        hdr = [Paragraph(c, ParagraphStyle(
            "th", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=white,
        )) for c in columns]
        rows = [hdr]

        for item in items:
            pkg = item.get("group", "")
            if pkg:
                pkg += "/"
            pkg += item.get("name", "?")

            row_cells = [Paragraph(pkg, styles["table_cell"])]

            if "old_version" in item:
                row_cells.append(Paragraph(item.get("old_version", ""), styles["table_cell_mono"]))
                row_cells.append(Paragraph(item.get("new_version", ""), styles["table_cell_mono"]))
            else:
                row_cells.append(Paragraph(item.get("version", ""), styles["table_cell_mono"]))

            row_cells.append(Paragraph(item.get("type", "library"), styles["table_cell"]))
            rows.append(row_cells)

        t = Table(rows, colWidths=col_widths, repeatRows=1)
        cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), accent_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("LINEBELOW", (0, 0), (-1, 0), 1.5, accent_color),
        ]
        for r in range(2, len(rows), 2):
            cmds.append(("BACKGROUND", (0, r), (-1, r), ROW_ALT))
        t.setStyle(TableStyle(cmds))
        story.append(t)
        story.append(Spacer(1, 0.12 * inch))

    _comp_table(
        f"\u2795  Added Components ({len(sbom_diff.get('added', []))})",
        sbom_diff.get("added", []),
        ["Package", "Version", "Type"],
        [3.5 * inch, 1.8 * inch, 1.7 * inch],
        HexColor("#1A7A40"),
    )

    _comp_table(
        f"\u274C  Removed Components ({len(sbom_diff.get('removed', []))})",
        sbom_diff.get("removed", []),
        ["Package", "Version", "Type"],
        [3.5 * inch, 1.8 * inch, 1.7 * inch],
        HexColor("#A12C2C"),
    )

    _comp_table(
        f"\u2B06  Version Changes ({len(sbom_diff.get('version_changed', []))})",
        sbom_diff.get("version_changed", []),
        ["Package", "Old Version", "New Version", "Type"],
        [2.8 * inch, 1.4 * inch, 1.4 * inch, 1.4 * inch],
        AMBER,
    )

    if not sbom_diff.get("added") and not sbom_diff.get("removed") and not sbom_diff.get("version_changed"):
        story.append(Paragraph(
            "No dependency changes detected between releases. The supply chain is unchanged.",
            styles["body_muted"],
        ))

    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        "SBOM generated using CycloneDX for npm. Diff computed by the AiGovOps sbom-diff tool. "
        'For verification, see <a href="https://www.aigovopsfoundation.org/" color="#01696F">'
        "www.aigovopsfoundation.org</a>.",
        styles["body_muted"],
    ))

    return story


# ── Utility ───────────────────────────────────────────────────────────────────
def _section_header(title, styles):
    """Returns a styled section header paragraph with a teal accent line above."""
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
def generate_pdf(entries, output_path, sbom_diff=None, lang="en"):
    """Build the full multi-page audit PDF."""

    # Register fonts for the requested language
    register_fonts()

    # Look up translations
    tr = PDF_TRANSLATIONS.get(lang, PDF_TRANSLATIONS["en"])

    # Generate QR code
    qr_buf_pil = make_qr_image("https://www.aigovopsfoundation.org/")
    qr_tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    qr_tmp.write(qr_buf_pil.read())
    qr_tmp.flush()
    qr_tmp_path = qr_tmp.name
    qr_tmp.close()

    styles = build_styles(lang=lang)

    # Build the Platypus story (pages 2+)
    story = []

    # Page 2: Executive Summary
    story.extend(build_exec_summary(styles, tr=tr))

    # Pages 3+: Audit Log Table
    story.extend(build_audit_table(entries, styles, tr=tr, lang=lang))

    # Pages N+: Hash Verification
    story.extend(build_verification_section(entries, styles, tr=tr, lang=lang))

    # Pages N+: SBOM Diff (if provided)
    if sbom_diff:
        story.extend(build_sbom_diff_section(sbom_diff, styles))

    # PDF title includes language tag (for non-English)
    lang_tag = f" [{lang.upper()}]" if lang != "en" else ""
    pdf_title = f"AiGovOps Foundation Framework — April 2026 v1{lang_tag}"

    doc = AuditDocTemplate(
        output_path,
        pagesize=letter,
        title=pdf_title,
        author="Perplexity Computer",
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN * 1.2,
    )

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
        onPage=lambda c, d: draw_cover(c, d, entries, qr_tmp_path, tr=tr, lang=lang),
    )
    inner_template = PageTemplate(
        id="Inner",
        frames=[content_frame],
        onPage=lambda c, d: inner_page_cb(c, d, tr=tr, lang=lang),
    )

    doc.addPageTemplates([cover_template, inner_template])

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
    parser.add_argument(
        "--sbom-diff",
        default=None,
        help="Path to SBOM diff JSON (from sbom-diff.py). If provided, appends a supply-chain diff section.",
    )
    parser.add_argument(
        "--lang",
        default="en",
        choices=["en", "fr", "de", "zh", "pt", "hi", "es", "ar", "ru", "tr", "ur", "ps", "sw", "chr", "brl"],
        help="Language for the PDF output (default: en)",
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

    # Load SBOM diff if provided
    sbom_diff = None
    if args.sbom_diff and os.path.exists(args.sbom_diff):
        print(f"[INFO] Loading SBOM diff from: {args.sbom_diff}")
        with open(args.sbom_diff) as f:
            sbom_diff = json.load(f)
        s = sbom_diff.get("summary", {})
        print(f"[INFO]   +{s.get('added',0)} added, -{s.get('removed',0)} removed, ~{s.get('version_changed',0)} changed")

    generate_pdf(entries, args.output, sbom_diff=sbom_diff, lang=args.lang)


if __name__ == "__main__":
    main()
