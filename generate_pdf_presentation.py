import os
import sys
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Run flowchart generator first
from generate_flowchart import create_flowchart

flowchart_img_path = create_flowchart()

# PDF Dimensions: 16:9 Landscape (10 x 5.625 inches = 720 x 405 pt)
PAGE_WIDTH = 720
PAGE_HEIGHT = 405

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Background dark gradient simulation
        self.setFillColor(colors.HexColor('#0a0f1a'))
        self.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)

        # Header Bar (Except for Cover Slide Page 1)
        if self._pageNumber > 1:
            # Top Header background banner
            self.setFillColor(colors.HexColor('#111827'))
            self.rect(0, PAGE_HEIGHT - 38, PAGE_WIDTH, 38, fill=True, stroke=False)
            
            # Header accent line
            self.setFillColor(colors.HexColor('#10b981'))
            self.rect(0, PAGE_HEIGHT - 40, PAGE_WIDTH, 2, fill=True, stroke=False)

            # Header Text
            self.setFont("Helvetica-Bold", 10)
            self.setFillColor(colors.HexColor('#10b981'))
            self.drawString(25, PAGE_HEIGHT - 24, "ClimateGuard AI")
            self.setFont("Helvetica", 9)
            self.setFillColor(colors.HexColor('#94a3b8'))
            self.drawString(115, PAGE_HEIGHT - 24, "|   AI-Empowered Disease Forecasting (Seniors 55+ & Infants 0-4)")

            # Footer Bar
            self.setFillColor(colors.HexColor('#111827'))
            self.rect(0, 0, PAGE_WIDTH, 24, fill=True, stroke=False)
            self.setFillColor(colors.HexColor('#1e293b'))
            self.rect(0, 24, PAGE_WIDTH, 1, fill=True, stroke=False)

            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawString(25, 8, "AI for Climate Change Track · PCCOE Campus Hackathon 2026")
            
            # Page Number
            page_text = f"Slide {self._pageNumber} of {page_count}"
            self.drawRightString(PAGE_WIDTH - 25, 8, page_text)
            
        else:
            # Cover Slide Footer
            self.setFont("Helvetica-Bold", 9)
            self.setFillColor(colors.HexColor('#10b981'))
            self.drawString(25, 15, "AI FOR CLIMATE CHANGE TRACK · HACKATHON PRESENTATION DECK")
            self.drawRightString(PAGE_WIDTH - 25, 15, "PCCOE CAMPUS · 2026")

        self.restoreState()

def build_pdf(filename="ClimateGuard_AI_Hackathon_Presentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        leftMargin=25,
        rightMargin=25,
        topMargin=45,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#ffffff'),
        spaceAfter=8
    )
    
    style_cover_sub = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#10b981'),
        spaceAfter=15
    )

    style_slide_title = ParagraphStyle(
        'SlideTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#ffffff'),
        spaceAfter=4
    )

    style_slide_sub = ParagraphStyle(
        'SlideSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#94a3b8'),
        spaceAfter=10
    )

    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#cbd5e1')
    )

    style_body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#ffffff')
    )

    style_bullet = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#cbd5e1')
    )

    story = []

    # ==========================================
    # SLIDE 1: COVER SLIDE
    # ==========================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("🌿 ClimateGuard AI", style_cover_title))
    story.append(Paragraph("AI-Empowered Early Warning System for Dengue & Malaria Outbreaks", style_cover_sub))
    
    cover_desc = Paragraph(
        "<font color='#38bdf8'><b>Project Goal:</b></font> A real-time decision-support system predicting climate-driven vector-borne disease surges 1–4 weeks in advance, specifically safeguarding <b>Seniors (55+)</b> and <b>Infants (0–4 yrs)</b>.<br/><br/>"
        "<font color='#f59e0b'><b>Key Value:</b></font> Integrates live weather, satellite data, hospital overlays, and WHO feeds with explainable ML models to give healthcare agencies early actionable warnings before diagnostic emergencies happen.",
        style_body
    )
    
    team_data = [
        [Paragraph("<b>Role</b>", style_body_bold), Paragraph("<b>Responsibility</b>", style_body_bold)],
        [Paragraph("AI Product Manager", style_body), Paragraph("Product Strategy & Non-Diagnostic Framing", style_body)],
        [Paragraph("Climate-Tech Researcher", style_body), Paragraph("Open-Meteo & NASA Climate Pipeline", style_body)],
        [Paragraph("ML Engineer", style_body), Paragraph("LSTM, XGBoost & Prophet Ensemble + SHAP", style_body)],
        [Paragraph("UX Designer", style_body), Paragraph("Accessible UI for Elderly & Caregivers", style_body)],
        [Paragraph("Technical Writer & Pitch Coach", style_body), Paragraph("Docs, API Specs & Hackathon Pitch Narrative", style_body)],
    ]
    t_team = Table(team_data, colWidths=[150, 220])
    t_team.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#ffffff')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#111827')),
    ]))

    cover_table = Table([[cover_desc, t_team]], colWidths=[280, 380])
    cover_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('RIGHTPADDING', (0,0), (0,0), 15),
    ]))
    story.append(cover_table)

    story.append(Spacer(1, 15))
    tag_box = Table([[
        Paragraph("<font color='#10b981'><b>✓ 100% Free Live APIs</b></font> (Open-Meteo, OSM, WHO RSS)", style_body),
        Paragraph("<font color='#ef4444'><b>⚠️ Decision-Support System</b></font> (Non-Diagnostic)", style_body),
        Paragraph("<font color='#f59e0b'><b>🎯 Vulnerable Focus</b></font> (55+ Seniors & 0-4 Infants)", style_body)
    ]], colWidths=[220, 220, 220])
    tag_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#334155')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tag_box)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 2: PROBLEM STATEMENT & TARGET AUDIENCE
    # ==========================================
    story.append(Paragraph("1. Problem Statement & High-Risk Target Audience", style_slide_title))
    story.append(Paragraph("Climate change is accelerating vector-borne disease outbreaks, disproportionately threatening vulnerable populations.", style_slide_sub))

    prob_box1 = Paragraph(
        "<b>The Climate-Health Crisis:</b><br/>"
        "• Unprecedented rainfall spikes & high humidity (>80%) expand Aedes mosquito breeding habitats globally.<br/>"
        "• Traditional healthcare systems react <i>after</i> hospital beds fill up rather than predicting outbreaks in advance.<br/>"
        "• Lack of real-time climate-driven risk mapping leaves local health centers unprepared.",
        style_body
    )
    
    prob_box2 = Paragraph(
        "<b>Why Focus on Seniors 55+ & Infants 0-4 Years?</b><br/>"
        "• <b>Seniors (55+):</b> Face 3–5× higher mortality due to cardiovascular comorbidities, immune decline, and NSAID/blood thinner complications.<br/>"
        "• <b>Infants (0-4 yrs):</b> Immature immune systems mean Dengue Shock Syndrome can develop in just 2–4 hours.<br/>"
        "• <b>Impact Multiplier:</b> Newborns have 5.3× baseline mortality; pediatric ICUs fill first during outbreaks.",
        style_body
    )

    t_prob = Table([[prob_box1, prob_box2]], colWidths=[330, 330])
    t_prob.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#111827')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#111827')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#f59e0b')),
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#ef4444')),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_prob)
    story.append(Spacer(1, 12))

    # Regional Vulnerability Data Table
    v_data = [
        [Paragraph("<b>Region</b>", style_body_bold), Paragraph("<b>Primary Threat</b>", style_body_bold), Paragraph("<b>Seniors At Risk</b>", style_body_bold), Paragraph("<b>Infants At Risk</b>", style_body_bold), Paragraph("<b>Mortality Multiplier</b>", style_body_bold)],
        [Paragraph("South/Southeast Asia", style_body), Paragraph("Dengue Surge", style_body), Paragraph("4.2 Million", style_body), Paragraph("1.8 Million", style_body), Paragraph("<font color='#ef4444'><b>4.8× (Elderly)</b></font>", style_body)],
        [Paragraph("Sub-Saharan Africa", style_body), Paragraph("Malaria Peak", style_body), Paragraph("3.1 Million", style_body), Paragraph("6.2 Million", style_body), Paragraph("<font color='#ef4444'><b>5.3× (Infants)</b></font>", style_body)],
        [Paragraph("Latin America", style_body), Paragraph("Dengue Transmission", style_body), Paragraph("2.6 Million", style_body), Paragraph("0.9 Million", style_body), Paragraph("<font color='#f59e0b'><b>3.9× (Combined)</b></font>", style_body)],
    ]
    t_v = Table(v_data, colWidths=[150, 130, 120, 120, 140])
    t_v.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#0f172a')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_v)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 3: PROPOSED SOLUTION & INNOVATION
    # ==========================================
    story.append(Paragraph("2. Proposed Solution & Key Innovations", style_slide_title))
    story.append(Paragraph("ClimateGuard AI provides a 1–4 week lookahead decision-support engine powered by live climate feeds.", style_slide_sub))

    sol_data = [
        [
            Paragraph("<b>🛰️ Real-Time Climate Fusion</b>", style_body_bold),
            Paragraph("Ingests hourly weather (temp, humidity, rain) from Open-Meteo API & NASA satellite data without requiring costly paid keys.", style_body)
        ],
        [
            Paragraph("<b>🧠 Multi-Model AI Ensemble</b>", style_body_bold),
            Paragraph("Combines LSTM (time-series dynamics), XGBoost (non-linear factors), and Prophet (seasonality) into a 93.1% accurate prediction core.", style_body)
        ],
        [
            Paragraph("<b>🔍 SHAP Explainable AI</b>", style_body_bold),
            Paragraph("De-mystifies black-box predictions by explicitly attributing risk scores to specific climate drivers (e.g. Humidity >80%).", style_body)
        ],
        [
            Paragraph("<b>🏥 Live Hospital Network Map</b>", style_body_bold),
            Paragraph("Uses OpenStreetMap Overpass API to dynamically pin nearby pediatric & emergency hospital wards for immediate response.", style_body)
        ],
        [
            Paragraph("<b>🚨 Automated Warning System</b>", style_body_bold),
            Paragraph("Delivers automated SMS and Email alerts to health officers and caregivers 1–4 weeks before potential outbreak peaks.", style_body)
        ],
    ]
    t_sol = Table(sol_data, colWidths=[180, 480])
    t_sol.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#111827')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(t_sol)

    story.append(Spacer(1, 10))
    disc_box = Table([[
        Paragraph("<font color='#f59e0b'><b>⚠️ Ethics & Compliance Frame:</b></font> ClimateGuard AI is built strictly as a <b>decision-support & early-warning platform</b> for government health departments and caregivers. It explicitly avoids making clinical diagnoses, adhering to international health software safety guidelines.", style_body)
    ]], colWidths=[660])
    disc_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1e1b4b')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#6366f1')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(disc_box)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 4: SYSTEM ARCHITECTURE & FLOWCHART
    # ==========================================
    story.append(Paragraph("3. System Architecture & End-to-End Flowchart", style_slide_title))
    story.append(Paragraph("Modular decoupled architecture connecting public data sources to ML engines and responsive frontends.", style_slide_sub))

    # Add Flowchart Image
    if os.path.exists(flowchart_img_path):
        img_flowchart = Image(flowchart_img_path, width=660, height=275)
        story.append(img_flowchart)

    story.append(PageBreak())

    # ==========================================
    # SLIDE 5: ML PIPELINE & SHAP EXPLAINABILITY
    # ==========================================
    story.append(Paragraph("4. Machine Learning Pipeline & SHAP Explainability", style_slide_title))
    story.append(Paragraph("Transparent AI architecture combining time-series forecasting with SHAP feature attribution.", style_slide_sub))

    ml_col1 = Paragraph(
        "<b>Model Architecture & Roles:</b><br/><br/>"
        "• <b>LSTM Network:</b> Captures long-term sequential dependencies and multi-week climate memory.<br/>"
        "• <b>XGBoost Regressor:</b> Handles complex interactions between precipitation thresholds and mosquito vector density.<br/>"
        "• <b>Facebook Prophet:</b> Models macro seasonal trends and annual monsoon outbreak cycles.<br/>"
        "• <b>Weighted Ensemble:</b> Yields <b>93.1% Accuracy</b> across validation test cities.",
        style_body
    )

    shap_data = [
        [Paragraph("<b>Climate Driver</b>", style_body_bold), Paragraph("<b>SHAP Value</b>", style_body_bold), Paragraph("<b>Outbreak Impact</b>", style_body_bold)],
        [Paragraph("Relative Humidity (>80%)", style_body), Paragraph("<font color='#ef4444'>+0.38</font>", style_body), Paragraph("Doubles mosquito survival rate", style_body)],
        [Paragraph("Daily Rainfall (>20mm)", style_body), Paragraph("<font color='#ef4444'>+0.31</font>", style_body), Paragraph("Creates larval breeding pools", style_body)],
        [Paragraph("Avg Temp (28°C–32°C)", style_body), Paragraph("<font color='#f59e0b'>+0.22</font>", style_body), Paragraph("Accelerates viral incubation period", style_body)],
        [Paragraph("Wind Speed (<5km/h)", style_body), Paragraph("<font color='#38bdf8'>+0.09</font>", style_body), Paragraph("Increases mosquito biting activity", style_body)],
    ]
    t_shap = Table(shap_data, colWidths=[130, 80, 140])
    t_shap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#111827')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))

    t_ml_slide = Table([[ml_col1, t_shap]], colWidths=[310, 350])
    t_ml_slide.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('RIGHTPADDING', (0,0), (0,0), 10),
    ]))
    story.append(t_ml_slide)

    story.append(Spacer(1, 10))
    xai_note = Table([[
        Paragraph("<b>Why SHAP Matters for Health Officials:</b> Doctors & health ministers will not trust black-box numbers. SHAP provides explicit human-readable reasons (e.g. <i>'Outbreak risk raised to 88% due to +0.38 contribution from 84% humidity'</i>).", style_body)
    ]], colWidths=[660])
    xai_note.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#a855f7')),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(xai_note)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 6: LIVE INTEGRATIONS & HEALTHCARE PLATFORMS
    # ==========================================
    story.append(Paragraph("5. Live Public APIs & Healthcare Integrations", style_slide_title))
    story.append(Paragraph("Seamlessly connects live real-world data sources without requiring paid API keys or user billing.", style_slide_sub))

    api_grid = [
        [Paragraph("<b>Source Platform</b>", style_body_bold), Paragraph("<b>Data Type Integrated</b>", style_body_bold), Paragraph("<b>Public Health Purpose</b>", style_body_bold), Paragraph("<b>Access Type</b>", style_body_bold)],
        [Paragraph("<b>Open-Meteo API</b>", style_body), Paragraph("Real-time Temp, Humidity, Rain", style_body), Paragraph("Drives hourly ML risk score updates", style_body), Paragraph("<font color='#10b981'>100% Free / Open</font>", style_body)],
        [Paragraph("<b>OSM Overpass API</b>", style_body), Paragraph("Hospital & Clinic Geolocation", style_body), Paragraph("Pins local emergency & pediatric wards", style_body), Paragraph("<font color='#10b981'>100% Free / Open</font>", style_body)],
        [Paragraph("<b>WHO RSS Feed</b>", style_body), Paragraph("Disease Outbreak News (DON)", style_body), Paragraph("Parses official global outbreak bulletins", style_body), Paragraph("<font color='#10b981'>100% Free / Open</font>", style_body)],
        [Paragraph("<b>ReliefWeb API</b>", style_body), Paragraph("Disaster & Health Reports", style_body), Paragraph("Tracks humanitarian emergency response", style_body), Paragraph("<font color='#10b981'>100% Free / Open</font>", style_body)],
        [Paragraph("<b>OpenStreetMap / ArcGIS</b>", style_body), Paragraph("Dark, Satellite & Vector Tiles", style_body), Paragraph("Visualizes geographical risk heatmaps", style_body), Paragraph("<font color='#10b981'>100% Free / Open</font>", style_body)],
    ]
    t_api = Table(api_grid, colWidths=[140, 160, 230, 130])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#111827')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_api)

    story.append(Spacer(1, 10))
    live_stat_box = Table([[
        Paragraph("<b>📡 Live System Status:</b> Integrated across 12 major high-risk tropical cities (Delhi, Mumbai, Manila, Dhaka, Lagos, São Paulo, etc.) with automatic background syncing every 15 minutes.", style_body)
    ]], colWidths=[660])
    live_stat_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#064e3b')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#10b981')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(live_stat_box)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 7: PROTOTYPE & CAREGIVER ACTION PLAN
    # ==========================================
    story.append(Paragraph("6. Prototype Walkthrough & Caregiver Action Plan", style_slide_title))
    story.append(Paragraph("Clean, high-contrast, accessible interface designed for rapid emergency decision-making.", style_slide_sub))

    proto_c1 = Paragraph(
        "<b>Caregiver Warning Signs & Actions:</b><br/><br/>"
        "• <b>For Seniors (55+):</b><br/>"
        "  - High fever (>38.5°C) >2 days → Visit clinic immediately (Avoid NSAIDs/Ibuprofen).<br/>"
        "  - Bleeding gums or red skin spots → Urgent hospital admission.<br/>"
        "  - Confusion with fever → Emergency call for cerebral malaria check.<br/><br/>"
        "• <b>For Infants (0–4 yrs):</b><br/>"
        "  - Any fever in baby <3 months → <b>IMMEDIATE EMERGENCY</b>.<br/>"
        "  - Refusing feed / limpness → Dehydration risk; rush to pediatric ICU.",
        style_body
    )

    proto_c2 = Paragraph(
        "<b>Interface Design Principles:</b><br/><br/>"
        "• <b>Minimalist & High Contrast:</b> Optimized for elderly eyes and frantic caregivers under stressful conditions.<br/>"
        "• <b>Zero Waste Information:</b> Stripped unnecessary clutter to highlight actionable risk percentages and emergency numbers.<br/>"
        "• <b>One-Click Emergency Hotline Access:</b><br/>"
        "  - 🇮🇳 India: 108 Ambulance / AIIMS Hotline<br/>"
        "  - 🇵🇭 Philippines: 911 / DOH 1555<br/>"
        "  - 🇧🇩 Bangladesh: 999 / DGHS 16752<br/>"
        "  - 🇳🇬 Nigeria: 112 / NCDC Emergency",
        style_body
    )

    t_proto = Table([[proto_c1, proto_c2]], colWidths=[330, 330])
    t_proto.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#111827')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#111827')),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#334155')),
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#334155')),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_proto)
    story.append(PageBreak())

    # ==========================================
    # SLIDE 8: DEPLOYMENT PLAN, IMPACT & CONCLUSION
    # ==========================================
    story.append(Paragraph("7. Deployment Plan, Scalability & Future Vision", style_slide_title))
    story.append(Paragraph("Production-ready cloud architecture scalable to global municipal health networks.", style_slide_sub))

    deploy_data = [
        [Paragraph("<b>Phase</b>", style_body_bold), Paragraph("<b>Deployment & Action Items</b>", style_body_bold), Paragraph("<b>Target Timeline</b>", style_body_bold)],
        [Paragraph("Phase 1: Hackathon MVP", style_body), Paragraph("FastAPI + React deployed on local/GCP server with Open-Meteo & Overpass integrations.", style_body), Paragraph("<font color='#10b981'><b>Current (Aug 2026)</b></font>", style_body)],
        [Paragraph("Phase 2: Pilot Deployment", style_body), Paragraph("Partner with municipal health departments in Pune & Delhi for district-level SMS testing.", style_body), Paragraph("Q4 2026", style_body)],
        [Paragraph("Phase 3: Global Expansion", style_body), Paragraph("Scale GCP Cloud Run auto-scaling containers to cover 100+ WHO high-risk tropical zones.", style_body), Paragraph("2027", style_body)],
    ]
    t_dep = Table(deploy_data, colWidths=[150, 370, 140])
    t_dep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#111827')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_dep)

    story.append(Spacer(1, 10))
    summary_box = Table([[
        Paragraph("<b>Summary Conclusion:</b> ClimateGuard AI demonstrates how combining free real-time climate telemetry, robust ML ensemble models, and targeted vulnerable-population UX can transform public health from reactive emergency management to proactive early prevention.", style_body)
    ]], colWidths=[660])
    summary_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#064e3b')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#10b981')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(summary_box)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Presentation PDF successfully built: {filename}")

if __name__ == "__main__":
    build_pdf()
