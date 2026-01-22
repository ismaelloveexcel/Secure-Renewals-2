"""PDF Generation Service for HR Portal.

Generates professional PDF documents for:
- Candidate profiles
- Job requisitions
- Recruitment reports
- Interview schedules
- Offer letters (template-based)

No approval workflows - instant generation with download/email options.
"""
from datetime import datetime
from io import BytesIO
from typing import Optional, Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, PageBreak, Image, KeepTogether
)
from reportlab.pdfgen import canvas


class PDFGenerationService:
    """Service for generating HR-related PDF documents."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Subheader style
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#374151'),
            spaceBefore=12,
            spaceAfter=6,
            leftIndent=0
        ))
        
        # Body style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=10,
            textColor=colors.HexColor('#4b5563'),
            spaceAfter=6,
            alignment=TA_LEFT
        ))
        
        # Small text style
        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#6b7280')
        ))
    
    def _add_header(self, canvas_obj, doc):
        """Add header to each page."""
        canvas_obj.saveState()
        canvas_obj.setFont('Helvetica-Bold', 10)
        canvas_obj.setFillColor(colors.HexColor('#6b7280'))
        canvas_obj.drawString(inch, doc.height + doc.topMargin - 0.3*inch, 
                            "Baynunah HR Portal")
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.drawRightString(doc.width + inch, doc.height + doc.topMargin - 0.3*inch,
                                  f"Generated: {datetime.now().strftime('%d %b %Y')}")
        canvas_obj.restoreState()
    
    def _add_footer(self, canvas_obj, doc):
        """Add footer to each page."""
        canvas_obj.saveState()
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.HexColor('#9ca3af'))
        page_num = canvas_obj.getPageNumber()
        text = f"Page {page_num}"
        canvas_obj.drawCentredString(doc.width/2 + inch, 0.5*inch, text)
        canvas_obj.restoreState()
    
    def _on_page(self, canvas_obj, doc):
        """Page callback for headers and footers."""
        self._add_header(canvas_obj, doc)
        self._add_footer(canvas_obj, doc)
    
    async def generate_candidate_profile_pdf(
        self,
        candidate_data: Dict[str, Any],
        position_title: str
    ) -> BytesIO:
        """Generate candidate profile PDF.
        
        Args:
            candidate_data: Dictionary containing candidate information
            position_title: Job position title
            
        Returns:
            BytesIO: PDF file buffer
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=inch, bottomMargin=inch)
        story = []
        
        # Title
        story.append(Paragraph("Candidate Profile", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Candidate Info
        story.append(Paragraph(f"<b>{candidate_data.get('full_name', 'N/A')}</b>", self.styles['CustomHeading']))
        story.append(Paragraph(f"Applied for: {position_title}", self.styles['CustomBody']))
        story.append(Paragraph(f"Candidate #: {candidate_data.get('candidate_number', 'N/A')}", self.styles['CustomBody']))
        story.append(Spacer(1, 0.2*inch))
        
        # Contact Information
        story.append(Paragraph("Contact Information", self.styles['CustomHeading']))
        contact_data = [
            ['Email:', candidate_data.get('email', 'N/A')],
            ['Phone:', candidate_data.get('phone', 'N/A')],
            ['Location:', candidate_data.get('current_location', 'N/A')],
            ['Nationality:', candidate_data.get('nationality', 'N/A')]
        ]
        contact_table = Table(contact_data, colWidths=[1.5*inch, 4*inch])
        contact_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(contact_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Professional Summary
        if candidate_data.get('current_job_title') or candidate_data.get('current_company'):
            story.append(Paragraph("Current Position", self.styles['CustomHeading']))
            story.append(Paragraph(
                f"{candidate_data.get('current_job_title', 'N/A')} at {candidate_data.get('current_company', 'N/A')}",
                self.styles['CustomBody']
            ))
            if candidate_data.get('years_experience'):
                story.append(Paragraph(
                    f"Total Experience: {candidate_data.get('years_experience')} years",
                    self.styles['CustomBody']
                ))
            story.append(Spacer(1, 0.2*inch))
        
        # Application Details
        story.append(Paragraph("Application Status", self.styles['CustomHeading']))
        app_data = [
            ['Stage:', candidate_data.get('stage', 'N/A').title()],
            ['Status:', candidate_data.get('status', 'N/A').title()],
            ['Applied:', candidate_data.get('applied_at', 'N/A')[:10] if candidate_data.get('applied_at') else 'N/A'],
            ['Source:', candidate_data.get('source', 'N/A')]
        ]
        app_table = Table(app_data, colWidths=[1.5*inch, 4*inch])
        app_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(app_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Expectations
        story.append(Paragraph("Availability & Expectations", self.styles['CustomHeading']))
        expect_data = []
        if candidate_data.get('notice_period'):
            expect_data.append(['Notice Period:', candidate_data['notice_period']])
        if candidate_data.get('availability_date'):
            expect_data.append(['Available From:', candidate_data['availability_date']])
        if candidate_data.get('salary_expectation_min') and candidate_data.get('salary_expectation_max'):
            expect_data.append([
                'Salary Expectation:',
                f"AED {candidate_data['salary_expectation_min']:,} - {candidate_data['salary_expectation_max']:,}"
            ])
        if candidate_data.get('work_mode_preference'):
            expect_data.append(['Work Mode:', candidate_data['work_mode_preference'].title()])
        
        if expect_data:
            expect_table = Table(expect_data, colWidths=[1.5*inch, 4*inch])
            expect_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
                ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(expect_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self._on_page, onLaterPages=self._on_page)
        buffer.seek(0)
        return buffer
    
    async def generate_job_requisition_pdf(
        self,
        requisition_data: Dict[str, Any]
    ) -> BytesIO:
        """Generate job requisition PDF.
        
        Args:
            requisition_data: Dictionary containing requisition information
            
        Returns:
            BytesIO: PDF file buffer
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=inch, bottomMargin=inch)
        story = []
        
        # Title
        story.append(Paragraph("Job Requisition Form", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Position Details
        story.append(Paragraph(f"<b>{requisition_data.get('position_title', 'N/A')}</b>", self.styles['CustomHeading']))
        story.append(Paragraph(f"Request #: {requisition_data.get('request_number', 'N/A')}", self.styles['CustomBody']))
        story.append(Spacer(1, 0.2*inch))
        
        # Basic Information
        story.append(Paragraph("Position Information", self.styles['CustomHeading']))
        basic_data = [
            ['Department:', requisition_data.get('department', 'N/A')],
            ['Employment Type:', requisition_data.get('employment_type', 'N/A')],
            ['Headcount:', str(requisition_data.get('headcount', 1))],
            ['Location:', requisition_data.get('location', 'N/A')],
            ['Status:', requisition_data.get('status', 'N/A').replace('_', ' ').title()]
        ]
        basic_table = Table(basic_data, colWidths=[1.8*inch, 4*inch])
        basic_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(basic_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Salary Range
        if requisition_data.get('salary_range_min') and requisition_data.get('salary_range_max'):
            story.append(Paragraph("Compensation", self.styles['CustomHeading']))
            salary_text = f"AED {requisition_data['salary_range_min']:,} - {requisition_data['salary_range_max']:,} per month"
            story.append(Paragraph(salary_text, self.styles['CustomBody']))
            story.append(Spacer(1, 0.2*inch))
        
        # Job Description
        if requisition_data.get('job_description'):
            story.append(Paragraph("Job Description", self.styles['CustomHeading']))
            story.append(Paragraph(requisition_data['job_description'], self.styles['CustomBody']))
            story.append(Spacer(1, 0.2*inch))
        
        # Requirements
        if requisition_data.get('requirements'):
            story.append(Paragraph("Requirements", self.styles['CustomHeading']))
            story.append(Paragraph(requisition_data['requirements'], self.styles['CustomBody']))
            story.append(Spacer(1, 0.2*inch))
        
        # Required Skills
        if requisition_data.get('required_skills'):
            story.append(Paragraph("Required Skills", self.styles['CustomHeading']))
            skills_text = ", ".join(requisition_data['required_skills'])
            story.append(Paragraph(skills_text, self.styles['CustomBody']))
            story.append(Spacer(1, 0.2*inch))
        
        # Timeline
        story.append(Paragraph("Timeline", self.styles['CustomHeading']))
        timeline_data = [
            ['Request Date:', requisition_data.get('request_date', 'N/A')[:10] if requisition_data.get('request_date') else 'N/A'],
            ['Target Hire Date:', requisition_data.get('target_hire_date', 'N/A')[:10] if requisition_data.get('target_hire_date') else 'N/A']
        ]
        timeline_table = Table(timeline_data, colWidths=[1.8*inch, 4*inch])
        timeline_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(timeline_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self._on_page, onLaterPages=self._on_page)
        buffer.seek(0)
        return buffer
    
    async def generate_recruitment_report_pdf(
        self,
        stats: Dict[str, Any],
        positions: List[Dict[str, Any]],
        candidates_summary: List[Dict[str, Any]]
    ) -> BytesIO:
        """Generate recruitment pipeline report PDF.
        
        Args:
            stats: Recruitment statistics
            positions: List of open positions
            candidates_summary: Summary of candidates by stage
            
        Returns:
            BytesIO: PDF file buffer
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=inch, bottomMargin=inch)
        story = []
        
        # Title
        story.append(Paragraph("Recruitment Pipeline Report", self.styles['CustomTitle']))
        story.append(Paragraph(
            f"Report Date: {datetime.now().strftime('%d %B %Y')}",
            self.styles['SmallText']
        ))
        story.append(Spacer(1, 0.3*inch))
        
        # Summary Statistics
        story.append(Paragraph("Executive Summary", self.styles['CustomHeading']))
        stats_data = [
            ['Active Positions', str(stats.get('active_positions', 0))],
            ['Total Candidates', str(stats.get('total_candidates', 0))],
            ['In Interview', str(stats.get('in_interview', 0))],
            ['Hired (30 days)', str(stats.get('hired_30_days', 0))]
        ]
        stats_table = Table(stats_data, colWidths=[2*inch, 1.5*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3f4f6')),
            ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 11),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Open Positions
        if positions:
            story.append(Paragraph(f"Open Positions ({len(positions)})", self.styles['CustomHeading']))
            position_data = [['Position', 'Department', 'Type', 'Headcount', 'Status']]
            for pos in positions[:10]:  # Limit to 10 positions
                position_data.append([
                    pos.get('position_title', 'N/A')[:30],
                    pos.get('department', 'N/A'),
                    pos.get('employment_type', 'N/A'),
                    str(pos.get('headcount', 1)),
                    pos.get('status', 'N/A').replace('_', ' ').title()
                ])
            
            positions_table = Table(position_data, colWidths=[2*inch, 1.2*inch, 1*inch, 0.8*inch, 1*inch])
            positions_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6366f1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
                ('FONT', (0, 1), (-1, -1), 'Helvetica', 9),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (3, 0), (3, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            story.append(positions_table)
            story.append(Spacer(1, 0.3*inch))
        
        # Candidate Pipeline by Stage
        if candidates_summary:
            story.append(Paragraph("Candidate Pipeline", self.styles['CustomHeading']))
            pipeline_data = [['Stage', 'Count', 'Percentage']]
            total_candidates = sum(c.get('count', 0) for c in candidates_summary)
            for stage in candidates_summary:
                count = stage.get('count', 0)
                percentage = f"{(count/total_candidates*100):.1f}%" if total_candidates > 0 else "0%"
                pipeline_data.append([
                    stage.get('stage', 'N/A').title(),
                    str(count),
                    percentage
                ])
            
            pipeline_table = Table(pipeline_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
            pipeline_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
                ('FONT', (0, 1), (-1, -1), 'Helvetica', 10),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            story.append(pipeline_table)
        
        # Build PDF
        doc.build(story, onFirstPage=self._on_page, onLaterPages=self._on_page)
        buffer.seek(0)
        return buffer


# Singleton instance
pdf_service = PDFGenerationService()
