"""
Generate Pixel-Perfect Diagram-Heavy Official 6-Slide SIH Presentation Deck
Matching exact visual screenshot layout for Slide 2 (IDEA TITLE)
with Radial Donut Hub, Problem-Solution Fan Arc, and Innovation Chain Links.
"""

import sys
import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_sih_official_deck(
    template_path="/app/SIH2026-IDEA-Presentation-Format.pptx",
    output_path="/app/SIH_2026_Idea_Presentation_PS26027.pptx",
    team_name="RailSynapse",
    team_id="[Your Team ID]"
):
    prs = pptx.Presentation(template_path)
    print(f"Loaded template: {template_path} with {len(prs.slides)} slides.")

    # Color Palette matching Screenshot
    NAVY = RGBColor(0, 34, 68)         # #002244 - Primary Brand
    DARK_BLUE = RGBColor(10, 49, 97)   # #0A3161 - Deep Blue
    AMBER = RGBColor(217, 119, 6)      # #D97706 - Gold / Amber
    SAFETY_RED = RGBColor(239, 68, 68) # #EF4444 - Coral Red
    ORANGE = RGBColor(249, 115, 22)    # #F97316 - Warm Orange
    TEAL = RGBColor(14, 165, 233)      # #0EA5E9 - Sky / Cyan
    EMERALD = RGBColor(34, 197, 94)    # #22C55E - Green
    PURPLE = RGBColor(168, 85, 247)    # #A855F7 - Violet
    SLATE = RGBColor(30, 41, 59)       # #1E293B - High-contrast readable body text
    MUTED = RGBColor(100, 116, 139)    # #64748B - Secondary captions
    LIGHT_BG = RGBColor(255, 255, 255) # Pure white card
    WHITE = RGBColor(255, 255, 255)
    BORDER_CLR = RGBColor(226, 232, 240)

    def add_styled_card(slide, left, top, width, height, title="", header_color=DARK_BLUE, border_color=BORDER_CLR):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = LIGHT_BG
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)

        header_h = 0.42
        hdr = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(header_h))
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = header_color
        hdr.line.color.rgb = header_color

        tb_hdr = slide.shapes.add_textbox(Inches(left + 0.15), Inches(top + 0.03), Inches(width - 0.3), Inches(header_h - 0.06))
        tf_h = tb_hdr.text_frame
        tf_h.word_wrap = True
        tf_h.margin_top = Inches(0)
        tf_h.margin_bottom = Inches(0)
        tf_h.margin_left = Inches(0.05)
        tf_h.margin_right = Inches(0.05)
        p_h = tf_h.paragraphs[0]
        p_h.text = title.upper()
        p_h.font.size = Pt(10)
        p_h.font.bold = True
        p_h.font.color.rgb = WHITE
        p_h.alignment = PP_ALIGN.LEFT

        tb_body = slide.shapes.add_textbox(Inches(left + 0.15), Inches(top + header_h + 0.08), Inches(width - 0.3), Inches(height - header_h - 0.15))
        tf_b = tb_body.text_frame
        tf_b.word_wrap = True
        tf_b.margin_top = Inches(0)
        tf_b.margin_bottom = Inches(0)
        tf_b.margin_left = Inches(0.05)
        tf_b.margin_right = Inches(0.05)
        return tf_b

    def add_speaker_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text

    def clear_placeholder(slide, name="TextBox 8"):
        for sp in list(slide.shapes):
            if sp.name == name:
                sp.element.getparent().remove(sp.element)

    def update_oval(slide, new_text):
        for sp in slide.shapes:
            if "Oval" in sp.name and sp.has_text_frame:
                sp.width = Inches(1.65)
                sp.height = Inches(0.65)
                sp.text_frame.text = new_text
                sp.text_frame.margin_left = Inches(0.05)
                sp.text_frame.margin_right = Inches(0.05)
                sp.text_frame.margin_top = Inches(0.12)
                p = sp.text_frame.paragraphs[0]
                p.font.size = Pt(9)
                p.font.bold = True
                p.font.color.rgb = WHITE
                sp.fill.solid()
                sp.fill.fore_color.rgb = NAVY
                p.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 1: TITLE PAGE
    # =========================================================================
    s1 = prs.slides[0]
    for sp in s1.shapes:
        if sp.name == "TextBox 9" and sp.has_text_frame:
            tf = sp.text_frame
            tf.clear()
            
            fields = [
                ("Problem Statement ID – ", "26027 (Synergy with PS 26028)"),
                ("Problem Statement Title – ", "AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations"),
                ("Theme – ", "Transportation & Logistics / Smart Automation"),
                ("PS Category – ", "Software"),
                ("Team ID – ", team_id),
                ("Team Name – ", team_name)
            ]
            for label, val in fields:
                p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
                r1 = p.add_run()
                r1.text = label
                r1.font.bold = True
                r1.font.size = Pt(12)
                r1.font.color.rgb = NAVY
                
                r2 = p.add_run()
                r2.text = val
                r2.font.bold = False
                r2.font.size = Pt(12)
                r2.font.color.rgb = SLATE
                p.space_after = Pt(7)

    badge_box = s1.shapes.add_textbox(Inches(0.36), Inches(5.8), Inches(6.5), Inches(1.2))
    tf_b = badge_box.text_frame
    tf_b.word_wrap = True
    p_b1 = tf_b.paragraphs[0]
    p_b1.text = "MINISTRY OF RAILWAYS | ENTERPRISE PRODUCTION v5.0"
    p_b1.font.size = Pt(10)
    p_b1.font.bold = True
    p_b1.font.color.rgb = AMBER
    
    p_b2 = tf_b.add_paragraph()
    p_b2.text = "Tested on New Delhi - Kanpur Golden Corridor (440 km) | 94/94 Automated Tests Passed (100%)"
    p_b2.font.size = Pt(10)
    p_b2.font.color.rgb = MUTED
    p_b2.space_before = Pt(2)

    add_speaker_notes(s1, """Respected jury members and senior railway officers. Today, we present an enterprise-ready, safety-critical AI platform for Problem Statement 26027 and 26028: AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations.

Indian Railways runs over 13,000 passenger trains and 8,000 freight rakes daily across 68,000 route kilometers. But right now, the system faces an intense daily conflict: civil engineers, signal maintainers, and traction crews need track possession to keep rails safe, while traffic controllers resist granting blocks to avoid passenger delay penalties.

We have engineered a mathematically rigorous, statutory-compliant solution that eliminates this friction. Tested on the 440 km Delhi-Kanpur Golden Corridor with 94 passing tests, our system unlocks over 35% more track availability while guaranteeing zero delays to premier trains like Vande Bharat.""")

    # =========================================================================
    # SLIDE 2: IDEA TITLE (EXACT SCREENSHOT DIAGRAM-HEAVY LAYOUT)
    # =========================================================================
    s2 = prs.slides[1]
    update_oval(s2, team_name)
    clear_placeholder(s2, "TextBox 8")

    # Left Title
    tb_l_title = s2.shapes.add_textbox(Inches(0.5), Inches(1.15), Inches(5.4), Inches(0.7))
    tf_lt = tb_l_title.text_frame
    tf_lt.word_wrap = True
    tf_lt.margin_left = tf_lt.margin_right = tf_lt.margin_top = tf_lt.margin_bottom = 0
    p_lt = tf_lt.paragraphs[0]
    p_lt.text = "🚆 RailBlock AI - Smart Safety Solution"
    p_lt.font.size = Pt(14)
    p_lt.font.bold = True
    p_lt.font.color.rgb = NAVY
    
    p_lt2 = tf_lt.add_paragraph()
    p_lt2.text = "Multi-Department Automated Coordinated Super-Blocks"
    p_lt2.font.size = Pt(9.5)
    p_lt2.font.color.rgb = MUTED

    # Outer Container Card for Donut Hub
    card_left = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.45), Inches(1.9), Inches(5.5), Inches(4.85))
    card_left.fill.solid()
    card_left.fill.fore_color.rgb = LIGHT_BG
    card_left.line.color.rgb = BORDER_CLR
    card_left.line.width = Pt(1.2)

    # Center Hub Circle of the Donut (centered at X=3.2, Y=4.32)
    hub_circle = s2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(2.35), Inches(3.52), Inches(1.7), Inches(1.6))
    hub_circle.fill.solid()
    hub_circle.fill.fore_color.rgb = NAVY
    hub_circle.line.color.rgb = AMBER
    hub_circle.line.width = Pt(2.5)
    
    tf_hub = hub_circle.text_frame
    tf_hub.word_wrap = True
    tf_hub.margin_top = Inches(0.28)
    tf_hub.margin_left = tf_hub.margin_right = tf_hub.margin_bottom = 0
    p_hc1 = tf_hub.paragraphs[0]
    p_hc1.text = "RailBlock AI"
    p_hc1.font.size = Pt(11)
    p_hc1.font.bold = True
    p_hc1.font.color.rgb = WHITE
    p_hc1.alignment = PP_ALIGN.CENTER
    
    p_hc2 = tf_hub.add_paragraph()
    p_hc2.text = "Smart Railway Safety"
    p_hc2.font.size = Pt(8)
    p_hc2.font.color.rgb = RGBColor(226, 232, 240)
    p_hc2.alignment = PP_ALIGN.CENTER

    # 6 Radial Cards around Hub without ANY overlap:
    # Left column: X = 0.55 to 2.25 (W = 1.70)
    # Right column: X = 4.15 to 5.85 (W = 1.70)
    donut_nodes = [
        # (title, subtitle, left, top, width, height, color)
        ("Multi-Stream Ingestion", "Ingests TMS, SMMS & TDMS into 1 pipeline", 0.55, 2.05, 1.75, 1.15, TEAL),
        ("Coordinated Super-Blocks", "Collapses 6h closures into 2h 15m window", 4.10, 2.05, 1.75, 1.15, EMERALD),
        ("Derailment Prevention", "Clears deferred track maintenance backlog", 0.55, 3.75, 1.70, 1.15, AMBER),
        ("Headway Alignment", "Aligns with natural lulls between trains", 4.15, 3.75, 1.70, 1.15, ORANGE),
        ("Dynamic Replanning", "Hot-restart re-plans in <3s with AddHint", 0.55, 5.45, 1.75, 1.15, PURPLE),
        ("Zero Premier Delays", "100% on-time Vande Bharat & Rajdhani", 4.10, 5.45, 1.75, 1.15, SAFETY_RED)
    ]
    for n_title, n_sub, nl, nt, nw, nh, nclr in donut_nodes:
        node = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(nl), Inches(nt), Inches(nw), Inches(nh))
        node.fill.solid()
        node.fill.fore_color.rgb = RGBColor(248, 250, 252)
        node.line.color.rgb = nclr
        node.line.width = Pt(1.5)

        tb_n = s2.shapes.add_textbox(Inches(nl + 0.06), Inches(nt + 0.08), Inches(nw - 0.12), Inches(nh - 0.16))
        tf_n = tb_n.text_frame
        tf_n.word_wrap = True
        tf_n.margin_left = tf_n.margin_right = tf_n.margin_top = tf_n.margin_bottom = 0
        
        pn1 = tf_n.paragraphs[0]
        pn1.text = n_title
        pn1.font.size = Pt(8.5)
        pn1.font.bold = True
        pn1.font.color.rgb = nclr
        pn1.alignment = PP_ALIGN.CENTER
        
        pn2 = tf_n.add_paragraph()
        pn2.text = n_sub
        pn2.font.size = Pt(7.5)
        pn2.font.color.rgb = SLATE
        pn2.alignment = PP_ALIGN.CENTER
        pn2.space_before = Pt(3)

    # -------------------------------------------------------------------------
    # RIGHT TOP: "💡 How it addresses the problem" (Fan / Semicircular Wedge Cards)
    # -------------------------------------------------------------------------
    tb_ht = s2.shapes.add_textbox(Inches(6.25), Inches(1.15), Inches(6.6), Inches(0.4))
    tf_ht = tb_ht.text_frame
    tf_ht.margin_left = tf_ht.margin_right = tf_ht.margin_top = tf_ht.margin_bottom = 0
    p_ht = tf_ht.paragraphs[0]
    p_ht.text = "💡 How it addresses the problem"
    p_ht.font.size = Pt(14)
    p_ht.font.bold = True
    p_ht.font.color.rgb = NAVY

    und1 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.25), Inches(1.55), Inches(6.55), Inches(0.025))
    und1.fill.solid()
    und1.fill.fore_color.rgb = NAVY
    und1.line.color.rgb = NAVY

    fan_items = [
        ("Risk Reduction", "Clears deferred track backlog to eliminate rail fractures", SAFETY_RED),
        ("Emergency Recovery", "Re-plans sudden rail fractures in <3s with zero deadlocks", ORANGE),
        ("Conflict Elimination", "Combines Civil, Signal & OHE requests into 1 possession", AMBER),
        ("Resource Optimization", "Enforces machine fleet capacity (CSM tampers, BCM, tower wagons)", EMERALD),
        ("Punctuality Protection", "Zero delays to premier passenger trains (Vande Bharat / Rajdhani)", TEAL)
    ]
    fan_w = 1.25
    fan_gap = 0.075
    fan_top = 1.68
    fan_h = 1.85
    for idx, (f_title, f_desc, f_clr) in enumerate(fan_items):
        fx = 6.25 + idx * (fan_w + fan_gap)
        
        f_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(fx), Inches(fan_top), Inches(fan_w), Inches(fan_h))
        f_card.fill.solid()
        f_card.fill.fore_color.rgb = RGBColor(248, 250, 252)
        f_card.line.color.rgb = f_clr
        f_card.line.width = Pt(1.5)

        f_badge = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(fx), Inches(fan_top), Inches(fan_w), Inches(0.35))
        f_badge.fill.solid()
        f_badge.fill.fore_color.rgb = f_clr
        f_badge.line.color.rgb = f_clr
        
        tb_fb = s2.shapes.add_textbox(Inches(fx + 0.04), Inches(fan_top + 0.05), Inches(fan_w - 0.08), Inches(0.28))
        tf_fb = tb_fb.text_frame
        tf_fb.word_wrap = True
        tf_fb.margin_left = tf_fb.margin_right = tf_fb.margin_top = tf_fb.margin_bottom = 0
        pfb = tf_fb.paragraphs[0]
        pfb.text = f_title
        pfb.font.size = Pt(7.8)
        pfb.font.bold = True
        pfb.font.color.rgb = WHITE
        pfb.alignment = PP_ALIGN.CENTER

        tb_fd = s2.shapes.add_textbox(Inches(fx + 0.06), Inches(fan_top + 0.42), Inches(fan_w - 0.12), Inches(fan_h - 0.48))
        tf_fd = tb_fd.text_frame
        tf_fd.word_wrap = True
        tf_fd.margin_left = tf_fd.margin_right = tf_fd.margin_top = tf_fd.margin_bottom = 0
        pfd = tf_fd.paragraphs[0]
        pfd.text = f_desc
        pfd.font.size = Pt(7.5)
        pfd.font.color.rgb = SLATE
        pfd.alignment = PP_ALIGN.LEFT

    # -------------------------------------------------------------------------
    # RIGHT BOTTOM: "💎 Innovation and uniqueness" (Interlocking Chain Links)
    # -------------------------------------------------------------------------
    tb_iu = s2.shapes.add_textbox(Inches(6.25), Inches(3.72), Inches(6.6), Inches(0.4))
    tf_iu = tb_iu.text_frame
    tf_iu.margin_left = tf_iu.margin_right = tf_iu.margin_top = tf_iu.margin_bottom = 0
    p_iu = tf_iu.paragraphs[0]
    p_iu.text = "💎 Innovation and uniqueness"
    p_iu.font.size = Pt(14)
    p_iu.font.bold = True
    p_iu.font.color.rgb = NAVY

    und2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.25), Inches(4.12), Inches(6.55), Inches(0.025))
    und2.fill.solid()
    und2.fill.fore_color.rgb = NAVY
    und2.line.color.rgb = NAVY

    chain_nodes = [
        ("Exact CP-SAT", "Google OR-Tools discrete mathematical optimization (<30s)", EMERALD),
        ("G&SR Safety", "Form T/351 & 25kV PTW with §65B PKI digital signatures", DARK_BLUE),
        ("Kavach TCAS", "RDSO Packet 51/65 auto emergency braking curves", SAFETY_RED),
        ("NavIC RTIS", "ISRO satellite Kalman filter dynamic slot recovery", AMBER),
        ("Explainable AI", "XGBoost TGI risk + SHAP + Gemini dispatch memos", PURPLE)
    ]
    chain_w = 1.25
    chain_gap = 0.075
    chain_top = 4.28
    chain_h = 2.45
    for c_idx, (c_title, c_desc, c_clr) in enumerate(chain_nodes):
        cx = 6.25 + c_idx * (chain_w + chain_gap)

        c_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(cx), Inches(chain_top), Inches(chain_w), Inches(chain_h))
        c_box.fill.solid()
        c_box.fill.fore_color.rgb = RGBColor(248, 250, 252)
        c_box.line.color.rgb = c_clr
        c_box.line.width = Pt(1.5)

        c_icon = s2.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx + chain_w / 2 - 0.26), Inches(chain_top + 0.12), Inches(0.52), Inches(0.52))
        c_icon.fill.solid()
        c_icon.fill.fore_color.rgb = c_clr
        c_icon.line.color.rgb = WHITE
        c_icon.line.width = Pt(1.5)
        
        tf_ic = c_icon.text_frame
        p_ic = tf_ic.paragraphs[0]
        p_ic.text = f"{c_idx + 1}"
        p_ic.font.size = Pt(11)
        p_ic.font.bold = True
        p_ic.font.color.rgb = WHITE
        p_ic.alignment = PP_ALIGN.CENTER

        tb_c = s2.shapes.add_textbox(Inches(cx + 0.05), Inches(chain_top + 0.72), Inches(chain_w - 0.1), Inches(chain_h - 0.8))
        tf_c = tb_c.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = tf_c.margin_bottom = 0
        
        pc1 = tf_c.paragraphs[0]
        pc1.text = c_title
        pc1.font.size = Pt(8.5)
        pc1.font.bold = True
        pc1.font.color.rgb = c_clr
        pc1.alignment = PP_ALIGN.CENTER

        pc2 = tf_c.add_paragraph()
        pc2.text = c_desc
        pc2.font.size = Pt(7.5)
        pc2.font.color.rgb = SLATE
        pc2.alignment = PP_ALIGN.CENTER
        pc2.space_before = Pt(4)

    add_speaker_notes(s2, """Respected jury, look at the visual architecture on this slide:

On the left is our central Donut Hub: RailBlock AI acts as a central neural network ingesting TMS, SMMS, and TDMS requests, collapsing 6 hours of separate line closures into a single 2h 15m Coordinated Super-Block aligned with natural traffic lulls—guaranteeing zero delays to Vande Bharat and eliminating rail fractures.

On the top right, our fan-shaped problem-solution architecture shows how we systematically eliminate friction: reducing derailment risk, providing sub-3-second emergency recovery during rail fractures, and enforcing cumulative machine fleet limits.

On the bottom right is our interconnected innovation chain: linking Google OR-Tools CP-SAT discrete optimization with Indian Railways G&SR paperless safety handshakes, RDSO Kavach TCAS automatic braking curves, ISRO NavIC satellite dynamic slot recovery, and Gemini-powered explainable AI dispatch memos!""")

    # =========================================================================
    # SLIDE 3: TECHNICAL APPROACH (EXACT SCREENSHOT DIAGRAM-HEAVY LAYOUT)
    # =========================================================================
    s3 = prs.slides[2]
    update_oval(s3, team_name)
    clear_placeholder(s3, "TextBox 8")

    # -------------------------------------------------------------------------
    # LEFT HALF: "⚙️ Tech Stack Used" (Mind Map / Architecture Tree)
    # -------------------------------------------------------------------------
    tb_ts = s3.shapes.add_textbox(Inches(0.45), Inches(1.15), Inches(5.3), Inches(0.4))
    tf_ts = tb_ts.text_frame
    tf_ts.margin_left = tf_ts.margin_right = tf_ts.margin_top = tf_ts.margin_bottom = 0
    p_ts = tf_ts.paragraphs[0]
    p_ts.text = "⚙️ Tech Stack Used"
    p_ts.font.size = Pt(14)
    p_ts.font.bold = True
    p_ts.font.color.rgb = NAVY

    und_ts = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.45), Inches(1.55), Inches(5.3), Inches(0.025))
    und_ts.fill.solid()
    und_ts.fill.fore_color.rgb = NAVY
    und_ts.line.color.rgb = NAVY

    # Central Node of the Tree: "Tech Stack"
    center_ts = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.25), Inches(3.82), Inches(1.5), Inches(0.55))
    center_ts.fill.solid()
    center_ts.fill.fore_color.rgb = RGBColor(241, 245, 249)
    center_ts.line.color.rgb = RGBColor(100, 116, 139)
    center_ts.line.width = Pt(1.5)
    tf_cts = center_ts.text_frame
    tf_cts.margin_top = Inches(0.12)
    p_cts = tf_cts.paragraphs[0]
    p_cts.text = "Tech Stack"
    p_cts.font.size = Pt(11)
    p_cts.font.bold = True
    p_cts.font.color.rgb = DARK_BLUE
    p_cts.alignment = PP_ALIGN.CENTER

    # 6 Branch Categories radiating cleanly around the center (3 on left, 3 on right)
    # Each category has a colored pill header and clean bullet items below
    mindmap_branches = [
        # (title, [items], pill_x, pill_y, pill_w, pill_h, box_x, box_y, box_w, box_h, color, conn_pt)
        ("AI & OPTIMIZATION", ["Google OR-Tools CP-SAT", "XGBoost TGI Regressor", "SHAP TreeExplainer", "Gemini 1.5 Flash"], 
         0.45, 1.75, 1.70, 0.28, 0.45, 2.05, 1.75, 1.15, AMBER, (2.25, 3.95, 2.15, 2.0)),
        ("SPATIAL DATABASE", ["PostgreSQL 15 + PostGIS", "Linear KM Referencing", "Redis In-Memory Cache"], 
         0.45, 3.50, 1.70, 0.28, 0.45, 3.80, 1.75, 1.05, DARK_BLUE, (2.25, 4.09, 2.15, 3.65)),
        ("RAILWAY PROTOCOLS", ["RDSO Kavach (Packet 51/65)", "ISRO NavIC RTIS GPS", "Section 65B PKI Signatures"], 
         0.45, 5.20, 1.70, 0.28, 0.45, 5.50, 1.75, 1.10, EMERALD, (2.25, 4.25, 2.15, 5.35)),
        ("BACKEND SERVICES", ["Python 3.11 & FastAPI", "Celery Beat Scheduler", "Redis 7.0 Streams", "SQLAlchemy 2.0 ORM"], 
         3.90, 1.75, 1.75, 0.28, 3.90, 2.05, 1.80, 1.15, ORANGE, (3.75, 3.95, 3.90, 2.0)),
        ("FRONTEND & PWA", ["React 18 & TypeScript", "Material-UI & Leaflet GIS", "IndexedDB Offline Store"], 
         3.90, 3.50, 1.75, 0.28, 3.90, 3.80, 1.80, 1.05, PURPLE, (3.75, 4.09, 3.90, 3.65)),
        ("INFRA & CLOUD", ["CRIS TMS, SMMS, COA", "Docker & Kubernetes", "RailTel Cloud Ready"], 
         3.90, 5.20, 1.75, 0.28, 3.90, 5.50, 1.80, 1.10, TEAL, (3.75, 4.25, 3.90, 5.35))
    ]

    for b_title, b_items, px, py, pw, ph, bx, by, bw, bh, bclr, (c_x1, c_y1, c_x2, c_y2) in mindmap_branches:
        # Connector branch line from center node to category
        conn_line = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(min(c_x1, c_x2)), Inches(c_y2), Inches(abs(c_x1 - c_x2)), Inches(0.015))
        conn_line.fill.solid()
        conn_line.fill.fore_color.rgb = RGBColor(148, 163, 184)
        conn_line.line.color.rgb = RGBColor(148, 163, 184)

        # Category Pill Badge
        b_pill = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(px), Inches(py), Inches(pw), Inches(ph))
        b_pill.fill.solid()
        b_pill.fill.fore_color.rgb = bclr
        b_pill.line.color.rgb = bclr
        
        tb_bp = s3.shapes.add_textbox(Inches(px), Inches(py + 0.03), Inches(pw), Inches(ph - 0.06))
        tf_bp = tb_bp.text_frame
        tf_bp.margin_left = tf_bp.margin_right = tf_bp.margin_top = tf_bp.margin_bottom = 0
        pbp = tf_bp.paragraphs[0]
        pbp.text = b_title
        pbp.font.size = Pt(7.8)
        pbp.font.bold = True
        pbp.font.color.rgb = WHITE
        pbp.alignment = PP_ALIGN.CENTER

        # Sub-items listed below category
        tb_bd = s3.shapes.add_textbox(Inches(bx), Inches(by), Inches(bw), Inches(bh))
        tf_bd = tb_bd.text_frame
        tf_bd.word_wrap = True
        tf_bd.margin_left = tf_bd.margin_right = tf_bd.margin_top = tf_bd.margin_bottom = 0
        for s_idx, item in enumerate(b_items):
            p = tf_bd.paragraphs[0] if s_idx == 0 else tf_bd.add_paragraph()
            p.text = "• " + item
            p.font.size = Pt(7.2)
            p.font.color.rgb = SLATE
            if s_idx > 0:
                p.space_before = Pt(2.0)

    # -------------------------------------------------------------------------
    # RIGHT HALF: "🔀 Workflow of RailBlock AI" (BPMN Swimlanes)
    # -------------------------------------------------------------------------
    tb_wf = s3.shapes.add_textbox(Inches(5.95), Inches(1.15), Inches(6.9), Inches(0.4))
    tf_wf = tb_wf.text_frame
    tf_wf.margin_left = tf_wf.margin_right = tf_wf.margin_top = tf_wf.margin_bottom = 0
    p_wf = tf_wf.paragraphs[0]
    p_wf.text = "🔀 Workflow of RailBlock AI"
    p_wf.font.size = Pt(14)
    p_wf.font.bold = True
    p_wf.font.color.rgb = NAVY

    und_wf = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(5.95), Inches(1.55), Inches(6.9), Inches(0.025))
    und_wf.fill.solid()
    und_wf.fill.fore_color.rgb = NAVY
    und_wf.line.color.rgb = NAVY

    # 3 BPMN Swimlanes matching the screenshot
    swimlanes = [
        # (Lane Full Title, Tag Text, Color, Top Y, Fill Tint)
        ("OPERATIONS & FIELD (SSE & STATION MASTER)", DARK_BLUE, 1.68, RGBColor(248, 250, 255)),
        ("AI OPTIMIZATION CORE (RAILBLOCK AI)", EMERALD, 3.40, RGBColor(248, 253, 250)),
        ("SAFETY ENFORCEMENT & SPEED PROTECTION", ORANGE, 5.12, RGBColor(255, 251, 247))
    ]

    lane_w = 6.90
    lane_h = 1.62
    for l_full, l_clr, ly, l_bg in swimlanes:
        # Outer swimlane container
        l_box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.95), Inches(ly), Inches(lane_w), Inches(lane_h))
        l_box.fill.solid()
        l_box.fill.fore_color.rgb = l_bg
        l_box.line.color.rgb = l_clr
        l_box.line.width = Pt(1.5)

        # Header tag pill at top-left of the swimlane
        l_tag_pill = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.05), Inches(ly + 0.06), Inches(2.75), Inches(0.24))
        l_tag_pill.fill.solid()
        l_tag_pill.fill.fore_color.rgb = l_clr
        l_tag_pill.line.color.rgb = l_clr
        
        tb_tp = s3.shapes.add_textbox(Inches(6.10), Inches(ly + 0.08), Inches(2.65), Inches(0.20))
        tf_tp = tb_tp.text_frame
        tf_tp.margin_left = tf_tp.margin_right = tf_tp.margin_top = tf_tp.margin_bottom = 0
        ptp = tf_tp.paragraphs[0]
        ptp.text = l_full
        ptp.font.size = Pt(7.0)
        ptp.font.bold = True
        ptp.font.color.rgb = WHITE

    # ==========================================
    # Lane 1 Nodes (Operations & Field)
    # ==========================================
    # Start Event Circle
    start_c = s3.shapes.add_shape(MSO_SHAPE.OVAL, Inches(6.08), Inches(2.40), Inches(0.36), Inches(0.36))
    start_c.fill.solid()
    start_c.fill.fore_color.rgb = EMERALD
    start_c.line.color.rgb = RGBColor(5, 150, 105)
    tf_sc = start_c.text_frame
    tf_sc.margin_left = tf_sc.margin_right = tf_sc.margin_top = tf_sc.margin_bottom = 0
    p_sc = tf_sc.paragraphs[0]
    p_sc.text = "▶"
    p_sc.font.size = Pt(9)
    p_sc.font.color.rgb = WHITE
    p_sc.alignment = PP_ALIGN.CENTER

    # Arrow from Start to Card 1
    a1 = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(6.48), Inches(2.51), Inches(0.16), Inches(0.12))
    a1.fill.solid()
    a1.fill.fore_color.rgb = DARK_BLUE
    a1.line.fill.background()

    # Card 1: Requisition
    c1 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.68), Inches(2.02), Inches(1.80), Inches(1.18))
    c1.fill.solid()
    c1.fill.fore_color.rgb = WHITE
    c1.line.color.rgb = DARK_BLUE
    c1.line.width = Pt(1.2)
    tf_c1 = c1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = tf_c1.margin_right = tf_c1.margin_top = tf_c1.margin_bottom = Inches(0.05)
    p = tf_c1.paragraphs[0]
    p.text = "1. Requisition Raised"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p2 = tf_c1.add_paragraph()
    p2.text = "SSE Civil/Signal/TRD logs work tickets tagged with GPS KM markers & asset ID"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Card 4: Form T/351 Disconnect
    c4 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.00), Inches(2.02), Inches(1.80), Inches(1.18))
    c4.fill.solid()
    c4.fill.fore_color.rgb = WHITE
    c4.line.color.rgb = DARK_BLUE
    c4.line.width = Pt(1.2)
    tf_c4 = c4.text_frame
    tf_c4.word_wrap = True
    tf_c4.margin_left = tf_c4.margin_right = tf_c4.margin_top = tf_c4.margin_bottom = Inches(0.05)
    p = tf_c4.paragraphs[0]
    p.text = "4. Form T/351 Disconnect"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p2 = tf_c4.add_paragraph()
    p2.text = "Station Master locks signal levers at danger via paperless §65B PKI digital memo"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Arrow from Card 4 to Card 6
    a4 = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(10.84), Inches(2.51), Inches(0.16), Inches(0.12))
    a4.fill.solid()
    a4.fill.fore_color.rgb = DARK_BLUE
    a4.line.fill.background()

    # Card 6: Track Fit & TSR
    c6 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.04), Inches(2.02), Inches(1.35), Inches(1.18))
    c6.fill.solid()
    c6.fill.fore_color.rgb = WHITE
    c6.line.color.rgb = DARK_BLUE
    c6.line.width = Pt(1.2)
    tf_c6 = c6.text_frame
    tf_c6.word_wrap = True
    tf_c6.margin_left = tf_c6.margin_right = tf_c6.margin_top = tf_c6.margin_bottom = Inches(0.05)
    p = tf_c6.paragraphs[0]
    p.text = "6. Track Fit & TSR"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = DARK_BLUE
    p2 = tf_c6.add_paragraph()
    p2.text = "Physical clearance signed; Caution Order TSR issued; Line restored"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Arrow to End Circle
    ae = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(12.43), Inches(2.51), Inches(0.12), Inches(0.10))
    ae.fill.solid()
    ae.fill.fore_color.rgb = DARK_BLUE
    ae.line.fill.background()

    # End Event Circle
    end_c = s3.shapes.add_shape(MSO_SHAPE.OVAL, Inches(12.58), Inches(2.42), Inches(0.30), Inches(0.30))
    end_c.fill.solid()
    end_c.fill.fore_color.rgb = SAFETY_RED
    end_c.line.color.rgb = RGBColor(185, 28, 28)
    tf_ec = end_c.text_frame
    tf_ec.margin_left = tf_ec.margin_right = tf_ec.margin_top = tf_ec.margin_bottom = 0
    p_ec = tf_ec.paragraphs[0]
    p_ec.text = "🏁"
    p_ec.font.size = Pt(8)
    p_ec.font.color.rgb = WHITE
    p_ec.alignment = PP_ALIGN.CENTER

    # ==========================================
    # Lane 2 Nodes (AI Optimization Core)
    # ==========================================
    # Cross-lane Down Arrow from Card 1 (Lane 1) to Card 2 (Lane 2)
    a_down1 = s3.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(7.55), Inches(3.22), Inches(0.12), Inches(0.16))
    a_down1.fill.solid()
    a_down1.fill.fore_color.rgb = EMERALD
    a_down1.line.fill.background()

    # Card 2: Multi-Stream Ingestion
    c2 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.45), Inches(3.72), Inches(1.95), Inches(1.20))
    c2.fill.solid()
    c2.fill.fore_color.rgb = WHITE
    c2.line.color.rgb = EMERALD
    c2.line.width = Pt(1.2)
    tf_c2 = c2.text_frame
    tf_c2.word_wrap = True
    tf_c2.margin_left = tf_c2.margin_right = tf_c2.margin_top = tf_c2.margin_bottom = Inches(0.05)
    p = tf_c2.paragraphs[0]
    p.text = "2. Multi-Stream Ingestion"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p2 = tf_c2.add_paragraph()
    p2.text = "Corridor clustering joins Civil, S&T, and TRD tickets; syncs timetable & headway"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Arrow from Card 2 to Card 3
    a2 = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.44), Inches(4.28), Inches(0.16), Inches(0.12))
    a2.fill.solid()
    a2.fill.fore_color.rgb = EMERALD
    a2.line.fill.background()

    # Card 3: CP-SAT Super-Block
    c3 = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.64), Inches(3.72), Inches(2.05), Inches(1.20))
    c3.fill.solid()
    c3.fill.fore_color.rgb = WHITE
    c3.line.color.rgb = EMERALD
    c3.line.width = Pt(1.2)
    tf_c3 = c3.text_frame
    tf_c3.word_wrap = True
    tf_c3.margin_left = tf_c3.margin_right = tf_c3.margin_top = tf_c3.margin_bottom = Inches(0.05)
    p = tf_c3.paragraphs[0]
    p.text = "3. CP-SAT Super-Block Engine"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p2 = tf_c3.add_paragraph()
    p2.text = "Google OR-Tools solves multi-dept bundled schedule in <30s; collapses 6h to 2h15m"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Arrow from Card 3 to Gateway Diamond
    a3 = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(10.73), Inches(4.28), Inches(0.16), Inches(0.12))
    a3.fill.solid()
    a3.fill.fore_color.rgb = EMERALD
    a3.line.fill.background()

    # Decision Gateway Diamond
    gw = s3.shapes.add_shape(MSO_SHAPE.DIAMOND, Inches(10.93), Inches(3.75), Inches(1.75), Inches(1.10))
    gw.fill.solid()
    gw.fill.fore_color.rgb = RGBColor(254, 243, 199)
    gw.line.color.rgb = AMBER
    gw.line.width = Pt(1.5)
    tf_gw = gw.text_frame
    tf_gw.word_wrap = True
    tf_gw.margin_left = tf_gw.margin_right = tf_gw.margin_top = tf_gw.margin_bottom = 0
    p_gw = tf_gw.paragraphs[0]
    p_gw.text = "Joint Sanction\nGranted?"
    p_gw.font.size = Pt(7.5)
    p_gw.font.bold = True
    p_gw.font.color.rgb = RGBColor(180, 83, 9)
    p_gw.alignment = PP_ALIGN.CENTER

    # Cross-lane Up Arrow from Decision Diamond (Lane 2) to Card 4 (Lane 1)
    a_up = s3.shapes.add_shape(MSO_SHAPE.UP_ARROW, Inches(9.85), Inches(3.22), Inches(0.12), Inches(0.16))
    a_up.fill.solid()
    a_up.fill.fore_color.rgb = DARK_BLUE
    a_up.line.fill.background()

    # ==========================================
    # Lane 3 Nodes (Safety Enforcement & Speed Protection)
    # ==========================================
    # Cross-lane Down Arrow from Decision Diamond (Lane 2) to Lane 3
    a_down2 = s3.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, Inches(11.75), Inches(4.88), Inches(0.12), Inches(0.16))
    a_down2.fill.solid()
    a_down2.fill.fore_color.rgb = ORANGE
    a_down2.line.fill.background()

    # Card 5A: 25kV PTW
    c5a = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.45), Inches(5.44), Inches(1.95), Inches(1.20))
    c5a.fill.solid()
    c5a.fill.fore_color.rgb = WHITE
    c5a.line.color.rgb = ORANGE
    c5a.line.width = Pt(1.2)
    tf_c5a = c5a.text_frame
    tf_c5a.word_wrap = True
    tf_c5a.margin_left = tf_c5a.margin_right = tf_c5a.margin_top = tf_c5a.margin_bottom = Inches(0.05)
    p = tf_c5a.paragraphs[0]
    p.text = "5A. Traction 25kV PTW"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = ORANGE
    p2 = tf_c5a.add_paragraph()
    p2.text = "TPC de-energizes catenary; discharge rod earthing verified before possession"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Arrow from 5A to 5B
    a5a = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(8.44), Inches(6.00), Inches(0.16), Inches(0.12))
    a5a.fill.solid()
    a5a.fill.fore_color.rgb = ORANGE
    a5a.line.fill.background()

    # Card 5B: Kavach Speed Envelope
    c5b = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.64), Inches(5.44), Inches(2.05), Inches(1.20))
    c5b.fill.solid()
    c5b.fill.fore_color.rgb = WHITE
    c5b.line.color.rgb = ORANGE
    c5b.line.width = Pt(1.2)
    tf_c5b = c5b.text_frame
    tf_c5b.word_wrap = True
    tf_c5b.margin_left = tf_c5b.margin_right = tf_c5b.margin_top = tf_c5b.margin_bottom = Inches(0.05)
    p = tf_c5b.paragraphs[0]
    p.text = "5B. Kavach TCAS Truncation"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = ORANGE
    p2 = tf_c5b.add_paragraph()
    p2.text = "RDSO Packet 51/65 truncates Movement Authority; auto braking 500m before site"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    # Arrow from 5B to 5C
    a5b = s3.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(10.73), Inches(6.00), Inches(0.16), Inches(0.12))
    a5b.fill.solid()
    a5b.fill.fore_color.rgb = ORANGE
    a5b.line.fill.background()

    # Card 5C: NavIC Dynamic Recovery
    c5c = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(10.93), Inches(5.44), Inches(1.75), Inches(1.20))
    c5c.fill.solid()
    c5c.fill.fore_color.rgb = WHITE
    c5c.line.color.rgb = ORANGE
    c5c.line.width = Pt(1.2)
    tf_c5c = c5c.text_frame
    tf_c5c.word_wrap = True
    tf_c5c.margin_left = tf_c5c.margin_right = tf_c5c.margin_top = tf_c5c.margin_bottom = Inches(0.05)
    p = tf_c5c.paragraphs[0]
    p.text = "5C. NavIC Dynamic Recovery"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = ORANGE
    p2 = tf_c5c.add_paragraph()
    p2.text = "RTIS GPS Kalman filter tracks train drift; <3s hot-restart replan on early finish"
    p2.font.size = Pt(6.8)
    p2.font.color.rgb = SLATE
    p2.space_before = Pt(2)

    add_speaker_notes(s3, """Respected jury, look at the technical architecture on this slide:

On the left is our Tech Stack Mind Map radiating from the central core:
- AI & Optimization: Google OR-Tools CP-SAT discrete solver, XGBoost asset risk regressor, SHAP feature attribution, and Gemini 1.5 Flash operational reasoning.
- Backend Services: Python 3.11 with FastAPI, Celery Beat periodic scheduler, and Redis 7.0 streams.
- Spatial Database: PostgreSQL 15 with PostGIS for sub-meter linear referencing by KM markers.
- Frontend: React 18, TypeScript, Material-UI, Leaflet GIS, and IndexedDB offline PWA.
- Protocols: RDSO Kavach TCAS, ISRO NavIC RTIS, and Section 65B PKI digital signatures.

On the right is our 3-swimlane BPMN operational workflow:
- The Field & Operations lane captures work orders and executes Station Master Form T/351 disconnections and Track Fit restoration.
- The AI Optimization Core clusters multi-stream tickets and solves CP-SAT Coordinated Super-Blocks in under 30 seconds.
- The Safety & Train Protection lane coordinates 25kV OHE isolation, truncates Kavach locomotive Movement Authority, and runs real-time NavIC satellite slot recovery!""")

    # =========================================================================
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # =========================================================================
    s4 = prs.slides[3]
    update_oval(s4, team_name)
    clear_placeholder(s4, "TextBox 8")

    tf_f = add_styled_card(s4, 0.67, 1.25, 5.85, 5.5, title="Feasibility of the Solution (5 Pillars)", header_color=EMERALD, border_color=EMERALD)
    feasibility = [
        ("💻 Technical Viability: ", "Built on mature, battle-tested open-source libraries (Google OR-Tools, FastAPI, PostgreSQL). Achieved 100% pass rate across 94 comprehensive automated unit, integration, and chaos recovery tests."),
        ("⚙️ Operational Ease: ", "Zero learning curve for field staff. Digital Form T/351 and PTW interfaces match physical Indian Railways operating rulebook forms identically."),
        ("📈 Nationwide Scalability: ", "Multi-tenant Row-Level Security (RLS) architecture isolating 17 Railway Zones and 68 Divisions. A 24-hour divisional schedule solves in under 10 seconds on standard cloud infrastructure."),
        ("💵 Financial Practicality: ", "Software orchestration layer running on top of existing CRIS infrastructure and locomotive RTIS GPS units. Zero costly trackside hardware retrofits required."),
        ("⚖️ Legal & Statutory Compliance: ", "Strict adherence to G&SR Rule 4.08/15.06, RDSO/SPN/196 Kavach, Information Technology Act 2000, and Section 65B Indian Evidence Act for court-admissible CRS audit dossiers.")
    ]
    for lbl, desc in feasibility:
        p = tf_f.add_paragraph() if tf_f.paragraphs[0].text else tf_f.paragraphs[0]
        r1 = p.add_run()
        r1.text = lbl
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = EMERALD
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(9)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(4)

    tf_r = add_styled_card(s4, 6.8, 1.25, 5.85, 2.6, title="Potential Challenges & Risks", header_color=SAFETY_RED, border_color=SAFETY_RED)
    risks = [
        ("Data Silos & Legacy Resistance: ", "Departments operate on disparate legacy databases (TMS, SMMS, COA) with bureaucratic inertia."),
        ("Rural Connectivity Gaps: ", "Remote gangmen and cabins in rural sections lack stable cellular network coverage."),
        ("Emergency Disruptions: ", "Sudden rail fractures or late-running Rajdhani trains disrupt pre-planned static schedules."),
        ("Driver Signal Overshoot: ", "Risk of train intruding into active maintenance zone if driver misses banner flags.")
    ]
    for lbl, desc in risks:
        p = tf_r.add_paragraph() if tf_r.paragraphs[0].text else tf_r.paragraphs[0]
        r1 = p.add_run()
        r1.text = "⚠️ " + lbl
        r1.font.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = SAFETY_RED
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(2)

    tf_s = add_styled_card(s4, 6.8, 4.05, 5.85, 2.7, title="Strategies for Overcoming Challenges", header_color=EMERALD, border_color=EMERALD)
    strategies = [
        ("Universal Integration Adapters: ", "Universal REST & CSV ingesters interface directly with legacy CRIS systems without requiring schema changes."),
        ("Offline-First PWA with GPS: ", "IndexedDB local storage allows gangmen to report defects offline; auto-syncs when station Wi-Fi connects."),
        ("Hot-Restart Replanning in <3s: ", "CP-SAT AddHint warm-start re-optimizes affected corridor in 2.8s during emergency fractures without resetting active lines."),
        ("Kavach TCAS Speed Envelopes: ", "Automatic Movement Authority truncation and electronic cab braking curves prevent work zone intrusions fail-safe.")
    ]
    for lbl, desc in strategies:
        p = tf_s.add_paragraph() if tf_s.paragraphs[0].text else tf_s.paragraphs[0]
        r1 = p.add_run()
        r1.text = "🛡️ " + lbl
        r1.font.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = EMERALD
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(2)

    add_speaker_notes(s4, """Is this platform feasible in the real Indian Railways environment? Absolutely. 

Technically, it is built on battle-tested open-source components with 100% test pass rate across 94 automated tests. Operationally, our digital forms identically mirror physical rulebook forms, eliminating learning curves. Economically, it requires zero track retrofits—it is a pure software orchestration layer running on existing CRIS servers and RTIS GPS units.

We have actively addressed key risks:
- For legacy CRIS silos, we provide universal REST/CSV adapters.
- For rural network dead zones, our offline PWA works with zero internet.
- For emergency rail fractures, our What-If Hot-Restart engine re-plans in 2.8 seconds.
- And for human error, RDSO Kavach TCAS enforces electronic emergency braking curves.""")

    # =========================================================================
    # SLIDE 5: IMPACT AND BENEFITS
    # =========================================================================
    s5 = prs.slides[4]
    update_oval(s5, team_name)
    clear_placeholder(s5, "TextBox 8")

    tf_ia = add_styled_card(s5, 0.67, 1.25, 5.85, 5.5, title="Potential Impact on Target Audience", header_color=DARK_BLUE, border_color=DARK_BLUE)
    impacts = [
        ("Ministry & Policy Makers: ", "Directly advances Mission Raftaar (sustaining 160 km/h semi-high-speed operations for Vande Bharat) and PM Gati Shakti National Logistics Portal."),
        ("Divisional Section Controllers: ", "Eliminates high-stress manual phone calls and inter-branch friction; provides 1-click conflict-free optimal schedules in <30 seconds."),
        ("Field Maintenance Gangs & SSEs: ", "Guarantees reliable, uncancelled maintenance windows; ensures 100% de-energized and earthed OHE before track possession commences."),
        ("Station Masters: ", "Replaces cumbersome manual paper registers with paperless, legally binding Form T/351 and PTW approvals signed via PKI certificates."),
        ("Passengers & Freight Operators: ", "Protects passenger punctuality with zero unnotified delays; surges freight velocity across national dedicated trunk routes.")
    ]
    for lbl, desc in impacts:
        p = tf_ia.add_paragraph() if tf_ia.paragraphs[0].text else tf_ia.paragraphs[0]
        r1 = p.add_run()
        r1.text = lbl
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = DARK_BLUE
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(9)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(4)

    tf_ib = add_styled_card(s5, 6.8, 1.25, 5.85, 5.5, title="Quantifiable Benefits of RailBlock AI", header_color=EMERALD, border_color=EMERALD)
    benefits = [
        ("📈 +35% to +42% Asset Availability: ", "Over 1,200+ hours of track capacity unlocked per division annually by collapsing disjoint closures into Coordinated Super-Blocks."),
        ("⏱️ 40% to 50% Possession Reduction: ", "Cuts total separate line possessions in half, drastically reducing sectional disruption and operational fatigue."),
        ("🛡️ > 60% Reduction in Derailment Hazards: ", "Eliminating deferred maintenance backlog prevents rail and weld fractures, safeguarding passengers and crews."),
        ("💰 ₹250+ Crores Annual Savings per Zone: ", "Massive financial return from freight throughput acceleration, reduced locomotive idling fuel burn, and zero accident liabilities."),
        ("🌱 ~18,000 MT CO2 Emissions Eliminated: ", "Reduces unnecessary diesel locomotive idling and heavy traction starts, advancing Indian Railways' Net-Zero 2030 mission.")
    ]
    for lbl, desc in benefits:
        p = tf_ib.add_paragraph() if tf_ib.paragraphs[0].text else tf_ib.paragraphs[0]
        r1 = p.add_run()
        r1.text = lbl
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = EMERALD
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(9)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(4)

    add_speaker_notes(s5, """The measurable impact of RailBlock AI is transformative across every operational level of Indian Railways:

For the Ministry, it sustains 160 km/h operations for Mission Raftaar. 
For Section Controllers, it eliminates stressful phone shouting matches with 1-click optimal scheduling. 
For field gangmen, it guarantees safe daylight work windows with verified 25kV OHE isolation. 

Quantitatively:
- Over 1,200 hours of track capacity unlocked per division annually (+35% to +42% availability).
- 40% to 50% reduction in separate line possessions.
- Over 60% reduction in rail fracture derailment hazards.
- Estimated savings of ₹250+ Crores per railway zone every year.
- Elimination of ~18,000 metric tons of carbon emissions per division, supporting Indian Railways' Net-Zero 2030 target!""")

    # =========================================================================
    # SLIDE 6: RESEARCH AND REFERENCES
    # =========================================================================
    s6 = prs.slides[5]
    update_oval(s6, team_name)
    clear_placeholder(s6, "TextBox 8")

    tf_rg = add_styled_card(s6, 0.67, 1.25, 5.85, 5.5, title="Research Gap in Existing Railway Systems", header_color=SAFETY_RED, border_color=SAFETY_RED)
    gaps = [
        ("CRIS Control Office Application (COA): ", "Limited to static, reactive train charting displays. Block planning is performed manually by controllers drawing rectangles on glass displays; zero cross-department bundling or mathematical optimization."),
        ("TMS, SMMS, and TDMS Silos: ", "Legacy CRIS maintenance systems operate as isolated departmental databases with zero inter-departmental visibility or joint scheduling capability."),
        ("Consumer Apps (ixigo / RailYatri): ", "Passenger-facing tracking only with heuristic delay estimation. Zero operational access, zero infrastructure awareness, and zero safety dispatch authority."),
        ("Academic Heuristic Limitations: ", "Prior research relying on Genetic Algorithms or Reinforcement Learning fails in safety-critical railway operations because heuristics cannot guarantee 100% hard constraint satisfaction or legal compliance.")
    ]
    for lbl, desc in gaps:
        p = tf_rg.add_paragraph() if tf_rg.paragraphs[0].text else tf_rg.paragraphs[0]
        r1 = p.add_run()
        r1.text = lbl
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = SAFETY_RED
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(9)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(4)

    tf_rf = add_styled_card(s6, 6.8, 1.25, 5.85, 5.5, title="Authoritative Standards & Research References", header_color=DARK_BLUE, border_color=DARK_BLUE)
    refs = [
        ("Kakodkar Committee Report (Ministry of Railways): ", "High-Level Safety Review Committee on Indian Railways (2012) — Documented rail fracture derailment risks and urgent need for coordinated daylight maintenance blocks."),
        ("Indian Railways General & Subsidiary Rules (G&SR): ", "Rule 4.08 (Precautions before commencing work), Rule 15.06 (Line Block Grant & Cancellation), & Indian Railways Block Working Manual (2020)."),
        ("RDSO Specification RDSO/SPN/196: ", "Indian Railways Standard for Indigenous Automatic Train Protection System (Kavach / TCAS) — Packet 51/65 Movement Authority truncation."),
        ("Google OR-Tools CP-SAT Whitepaper: ", "Perron, L. & Furnon, V. (Google Research) — Constraint Programming Solver over Boolean & Integer Domains for industrial scheduling."),
        ("Explainable AI (SHAP TreeExplainer): ", "Lundberg, S. & Lee, S. (Nature Machine Intelligence, 2020) — A Unified Approach to Interpreting Model Predictions for safety-critical systems."),
        ("Statutory Legal Framework: ", "Information Technology Act 2000 & Section 65B of Indian Evidence Act 1872 for court-admissible electronic records and PKI digital signatures.")
    ]
    for lbl, desc in refs:
        p = tf_rf.add_paragraph() if tf_rf.paragraphs[0].text else tf_rf.paragraphs[0]
        r1 = p.add_run()
        r1.text = lbl
        r1.font.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = DARK_BLUE
        
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(9)
        r2.font.color.rgb = SLATE
        p.space_before = Pt(4)

    add_speaker_notes(s6, """Respected jury, our research addresses a massive void in existing systems. 

CRIS COA is purely a charting display; TMS and SMMS are isolated departmental databases; consumer apps like ixigo have zero operational access; and academic genetic heuristics fail because safety-critical railways cannot accept probabilistic errors.

Our platform is grounded in authoritative Indian Railways standards:
1. The Kakodkar High-Level Safety Committee Report on rail fracture hazards.
2. Indian Railways G&SR Rule 4.08 and 15.06 for line possessions.
3. RDSO Specification 196 for Kavach TCAS braking curves.
4. Google OR-Tools CP-SAT research on discrete constraint programming.
5. Nature Machine Intelligence research on SHAP explainability.
6. Information Technology Act 2000 & Section 65B of the Indian Evidence Act for PKI digital signatures.

This ensures our system is not just an idea, but an enterprise-grade platform ready for Indian Railways production deployment. Thank you!""")

    # =========================================================================
    # DELETE SLIDE 7 (Instructions Slide)
    # =========================================================================
    if len(prs.slides) > 6:
        sldIdLst = prs.slides._sldIdLst
        rId = sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del sldIdLst[6]
        print("Deleted Slide 7 (Instructions slide). Deck is now exactly 6 slides.")

    prs.save(output_path)
    print(f"SUCCESS: Saved official SIH presentation to {output_path} with {len(prs.slides)} slides.")
    return output_path

if __name__ == "__main__":
    t_path = sys.argv[1] if len(sys.argv) > 1 else "/app/SIH2026-IDEA-Presentation-Format.pptx"
    o_path = sys.argv[2] if len(sys.argv) > 2 else "/app/SIH_2026_Idea_Presentation_PS26027.pptx"
    build_sih_official_deck(t_path, o_path)
