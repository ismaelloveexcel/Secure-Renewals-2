"""Email service for sending notifications via SMTP"""
import asyncio
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        self.settings = get_settings()
    
    def is_configured(self) -> bool:
        """Check if SMTP is properly configured"""
        return bool(self.settings.smtp_host and self.settings.smtp_user)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send an email asynchronously.
        Returns True if successful, False otherwise.
        """
        if not self.is_configured():
            logger.warning("SMTP not configured. Email not sent to %s", to_email)
            return False
        
        try:
            # Run SMTP in thread pool to not block async loop
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                self._send_email_sync,
                to_email,
                subject,
                html_body,
                text_body
            )
        except Exception as e:
            logger.error("Failed to send email to %s: %s", to_email, str(e))
            return False
    
    def _send_email_sync(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Synchronous email sending (runs in thread pool)"""
        server = None
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.settings.smtp_from_name} <{self.settings.smtp_from_email}>"
            msg["To"] = to_email
            
            # Add plain text version
            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            
            # Add HTML version
            msg.attach(MIMEText(html_body, "html"))
            
            # Connect and send
            server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port)
            if self.settings.smtp_use_tls:
                server.starttls()
            
            if self.settings.smtp_user and self.settings.smtp_password:
                server.login(self.settings.smtp_user, self.settings.smtp_password)
            
            server.sendmail(
                self.settings.smtp_from_email,
                to_email,
                msg.as_string()
            )
            
            logger.info("Email sent successfully to %s", to_email)
            return True
            
        except Exception as e:
            logger.error("SMTP error sending to %s: %s", to_email, str(e))
            return False
        finally:
            if server:
                try:
                    server.quit()
                except Exception:
                    pass


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get or create the email service singleton"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


async def send_nomination_confirmation_email(
    manager_email: str,
    manager_name: str,
    nominee_name: str,
    nomination_year: int,
    nomination_id: int
) -> bool:
    """
    Send confirmation email to manager after nomination submission.
    Includes link to view/revise the nomination.
    """
    settings = get_settings()
    email_service = get_email_service()
    
    view_url = f"{settings.app_base_url}/nomination-pass?view={nomination_id}"
    
    subject = f"EOY Nomination Submitted - {nominee_name}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
            .footer {{ background-color: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }}
            .button {{ display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }}
            .details {{ background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✨ Nomination Submitted</h1>
            </div>
            <div class="content">
                <p>Dear {manager_name},</p>
                <p>Your Employee of the Year {nomination_year} nomination has been successfully submitted.</p>
                
                <div class="details">
                    <strong>Nominee:</strong> {nominee_name}<br>
                    <strong>Year:</strong> {nomination_year}<br>
                    <strong>Status:</strong> Pending Review
                </div>
                
                <p>You can view your nomination details or make revisions using the link below:</p>
                
                <p style="text-align: center;">
                    <a href="{view_url}" class="button">View Nomination</a>
                </p>
                
                <p><strong>Note:</strong> Only one nomination per manager is allowed per year.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from Baynunah HR.<br>
                For questions, contact <a href="mailto:hr@baynunah.ae" style="color: #94a3b8;">hr@baynunah.ae</a></p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Dear {manager_name},
    
    Your Employee of the Year {nomination_year} nomination has been successfully submitted.
    
    Nominee: {nominee_name}
    Year: {nomination_year}
    Status: Pending Review
    
    View your nomination: {view_url}
    
    Note: Only one nomination per manager is allowed per year.
    
    ---
    This is an automated message from Baynunah HR.
    For questions, contact hr@baynunah.ae
    """
    
    return await email_service.send_email(manager_email, subject, html_body, text_body)
