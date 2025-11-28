"""
Email service for sending verification codes and other emails using SendGrid
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service class for sending emails via SendGrid"""
    
    @staticmethod
    def send_verification_email(to_email, verification_code, user_name):
        """
        Send email verification code to user
        
        Args:
            to_email (str): Recipient email address
            verification_code (str): 6-digit verification code
            user_name (str): User's display name
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Get SendGrid API key from settings
            api_key = settings.SENDGRID_API_KEY
            if not api_key:
                logger.error("SendGrid API key not configured")
                return False
            
            # Create email content
            from_email = Email(settings.FROM_EMAIL)
            to_email_obj = To(to_email)
            subject = "Verify Your Email - PixelTales"
            
            # HTML email template
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .code-box {{
                        background: white;
                        border: 2px dashed #667eea;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 20px 0;
                    }}
                    .code {{
                        font-size: 32px;
                        font-weight: bold;
                        color: #667eea;
                        letter-spacing: 8px;
                        font-family: monospace;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 20px;
                        color: #666;
                        font-size: 12px;
                    }}
                    .warning {{
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 10px;
                        margin-top: 20px;
                        border-radius: 4px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎨 Pixel Tales</h1>
                    <p>Email Verification</p>
                </div>
                <div class="content">
                    <h2>Hello {user_name}! 👋</h2>
                    <p>Welcome to Pixel Tales! We're excited to have you join our creative storytelling community.</p>
                    <p>To complete your registration, please enter the verification code below:</p>
                    
                    <div class="code-box">
                        <p style="margin: 0; color: #666;">Your Verification Code</p>
                        <div class="code">{verification_code}</div>
                        <p style="margin: 0; color: #666; font-size: 12px;">Valid for {settings.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes</p>
                    </div>
                    
                    <p>If you didn't create an account with Pixel Tales, please ignore this email.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Tip:</strong> Never share this code with anyone. Our team will never ask for your verification code.
                    </div>
                </div>
                <div class="footer">
                    <p>© 2025 Pixel Tales. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </body>
            </html>
            """
            
            # Plain text version (fallback)
            text_content = f"""
            Hello {user_name}!
            
            Welcome to Pixel Tales!
            
            Your verification code is: {verification_code}
            
            This code will expire in {settings.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes.
            
            If you didn't create an account, please ignore this email.
            
            © 2025 PixelTales
            """
            
            # Create the email message
            message = Mail(
                from_email=from_email,
                to_emails=to_email_obj,
                subject=subject,
                plain_text_content=text_content,
                html_content=html_content
            )
            
            # Send the email
            sg = SendGridAPIClient(api_key)
            response = sg.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Verification email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"SendGrid returned status code: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending verification email: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_email(to_email, reset_code, user_name):
        """
        Send password reset code to user
        
        Args:
            to_email (str): Recipient email address
            reset_code (str): 6-digit reset code
            user_name (str): User's display name
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            api_key = settings.SENDGRID_API_KEY
            if not api_key:
                logger.error("SendGrid API key not configured")
                return False
            
            from_email = Email(settings.FROM_EMAIL)
            to_email_obj = To(to_email)
            subject = "Password Reset Code - PixelTales"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .code-box {{
                        background: white;
                        border: 2px dashed #dc3545;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 20px 0;
                    }}
                    .code {{
                        font-size: 32px;
                        font-weight: bold;
                        color: #dc3545;
                        letter-spacing: 8px;
                        font-family: monospace;
                    }}
                    .warning {{
                        background: #f8d7da;
                        border-left: 4px solid #dc3545;
                        padding: 10px;
                        margin-top: 20px;
                        border-radius: 4px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎨 Pixel Tales</h1>
                    <p>Password Reset</p>
                </div>
                <div class="content">
                    <h2>Hello {user_name}! 👋</h2>
                    <p>We received a request to reset your password. Use the code below to proceed:</p>
                    
                    <div class="code-box">
                        <p style="margin: 0; color: #666;">Your Reset Code</p>
                        <div class="code">{reset_code}</div>
                        <p style="margin: 0; color: #666; font-size: 12px;">Valid for {settings.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes</p>
                    </div>
                    
                    <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Alert:</strong> Never share this code with anyone. If you didn't request this reset, please secure your account immediately.
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
            Hello {user_name}!
            
            Password Reset Code: {reset_code}
            
            This code will expire in {settings.EMAIL_VERIFICATION_EXPIRY_MINUTES} minutes.
            
            If you didn't request this, please ignore this email.
            
            © 2025 Pixel Tales
            """
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email_obj,
                subject=subject,
                plain_text_content=text_content,
                html_content=html_content
            )
            
            sg = SendGridAPIClient(api_key)
            response = sg.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Password reset email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"SendGrid returned status code: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return False
