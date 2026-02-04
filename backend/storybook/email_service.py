"""
Email service for sending verification codes and other emails
Supports SendGrid, Brevo (Sendinblue), and Gmail SMTP (Django's email backend)
"""
import os
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Try to import SendGrid (optional)
try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    logger.info("SendGrid not installed")

# Try to import Brevo (optional)
try:
    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException
    BREVO_AVAILABLE = True
except ImportError:
    BREVO_AVAILABLE = False
    logger.info("Brevo not installed")


class EmailService:
    """Service class for sending emails via SendGrid"""
    
    @staticmethod
    def send_verification_email(to_email, verification_code, user_name):
        """
        Send email verification code to user
        Automatically uses SendGrid if available, otherwise uses Gmail SMTP
        
        Args:
            to_email (str): Recipient email address
            verification_code (str): 6-digit verification code
            user_name (str): User's display name
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
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
            
            # Try Brevo first, then SendGrid, then Gmail SMTP
            brevo_key = getattr(settings, 'BREVO_API_KEY', None)
            sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', None)
            
            if brevo_key and BREVO_AVAILABLE:
                # Use Brevo (Sendinblue)
                logger.info("Sending email via Brevo")
                try:
                    configuration = sib_api_v3_sdk.Configuration()
                    configuration.api_key['api-key'] = brevo_key
                    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                        sib_api_v3_sdk.ApiClient(configuration)
                    )
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        to=[{"email": to_email, "name": user_name}],
                        sender={"name": "Imaginary Worlds", "email": settings.FROM_EMAIL},
                        subject=subject,
                        html_content=html_content,
                        text_content=text_content.strip()
                    )
                    
                    response = api_instance.send_transac_email(send_smtp_email)
                    logger.info(f"Verification email sent successfully via Brevo to {to_email}")
                    return True
                except ApiException as e:
                    logger.error(f"Brevo API error: {str(e)}")
                    return False
                    
            elif sendgrid_key and SENDGRID_AVAILABLE:
                # Use SendGrid
                logger.info("Sending email via SendGrid")
                from_email_obj = Email(settings.FROM_EMAIL)
                to_email_obj = To(to_email)
                
                message = Mail(
                    from_email=from_email_obj,
                    to_emails=to_email_obj,
                    subject=subject,
                    plain_text_content=text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(sendgrid_key)
                response = sg.send(message)
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Verification email sent successfully via SendGrid to {to_email}")
                    return True
                else:
                    logger.error(f"SendGrid returned status code: {response.status_code}")
                    return False
            else:
                # Use Gmail SMTP (Django's email backend)
                logger.info("Sending email via Gmail SMTP (Django email backend)")
                send_mail(
                    subject=subject,
                    message=text_content,
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
                logger.info(f"Verification email sent successfully via Gmail SMTP to {to_email}")
                return True
                
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
            
            # Try Brevo first, then SendGrid, then Gmail SMTP
            brevo_key = getattr(settings, 'BREVO_API_KEY', None)
            sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', None)
            
            if brevo_key and BREVO_AVAILABLE:
                # Use Brevo (Sendinblue)
                logger.info("Sending password reset email via Brevo")
                try:
                    configuration = sib_api_v3_sdk.Configuration()
                    configuration.api_key['api-key'] = brevo_key
                    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                        sib_api_v3_sdk.ApiClient(configuration)
                    )
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        to=[{"email": to_email, "name": user_name}],
                        sender={"name": "Imaginary Worlds", "email": settings.FROM_EMAIL},
                        subject=subject,
                        html_content=html_content,
                        text_content=text_content.strip()
                    )
                    
                    response = api_instance.send_transac_email(send_smtp_email)
                    logger.info(f"Password reset email sent successfully via Brevo to {to_email}")
                    return True
                except ApiException as e:
                    logger.error(f"Brevo API error: {str(e)}")
                    return False
                    
            elif sendgrid_key and SENDGRID_AVAILABLE:
                # Use SendGrid
                logger.info("Sending password reset email via SendGrid")
                from_email = Email(settings.FROM_EMAIL)
                to_email_obj = To(to_email)
                
                message = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject,
                    plain_text_content=text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(sendgrid_key)
                response = sg.send(message)
                
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Password reset email sent successfully via SendGrid to {to_email}")
                    return True
                else:
                    logger.error(f"SendGrid returned status code: {response.status_code}")
                    return False
            else:
                # Use Gmail SMTP (Django's email backend)
                logger.info("Sending password reset email via Gmail SMTP")
                send_mail(
                    subject=subject,
                    message=text_content,
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
                logger.info(f"Password reset email sent successfully via Gmail SMTP to {to_email}")
                return True
                
        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return False
    
    @staticmethod
    def send_achievement_alert(to_email, child_name, achievement_name, achievement_description):
        """
        Send achievement alert email to parent/teacher
        
        Args:
            to_email (str): Recipient email address
            child_name (str): Name of the child
            achievement_name (str): Name of the achievement
            achievement_description (str): Description of the achievement
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            subject = f"🎉 {child_name} Earned an Achievement!"
            
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
                        background: #f5f5f5;
                    }}
                    .container {{
                        background: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                    }}
                    .achievement-badge {{
                        font-size: 80px;
                        margin: 20px 0 10px 0;
                    }}
                    .content {{
                        padding: 40px 30px;
                    }}
                    .achievement-box {{
                        background: #f8f9fa;
                        border-left: 5px solid #667eea;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }}
                    .achievement-name {{
                        font-size: 24px;
                        font-weight: bold;
                        color: #667eea;
                        margin: 0 0 10px 0;
                    }}
                    .achievement-desc {{
                        color: #666;
                        margin: 0;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-weight: bold;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 12px;
                        background: #f8f9fa;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎨 Pixel Tales</h1>
                        <div class="achievement-badge">🏆</div>
                        <h2>New Achievement Unlocked!</h2>
                    </div>
                    <div class="content">
                        <p>Great news! <strong>{child_name}</strong> has earned a new achievement!</p>
                        
                        <div class="achievement-box">
                            <p class="achievement-name">{achievement_name}</p>
                            <p class="achievement-desc">{achievement_description}</p>
                        </div>
                        
                        <p>Keep encouraging {child_name} to explore more stories and unlock new achievements!</p>
                        
                        <center>
                            <a href="#" class="cta-button">View Progress Dashboard</a>
                        </center>
                    </div>
                    <div class="footer">
                        <p>You're receiving this because you enabled Achievement Alerts in your notification settings.</p>
                        <p>© 2024 Pixel Tales. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Pixel Tales - New Achievement Unlocked!
            
            Great news! {child_name} has earned a new achievement!
            
            Achievement: {achievement_name}
            {achievement_description}
            
            Keep encouraging {child_name} to explore more stories and unlock new achievements!
            
            ---
            You're receiving this because you enabled Achievement Alerts in your notification settings.
            © 2024 Pixel Tales. All rights reserved.
            """
            
            # Try Brevo first, then SendGrid, then Gmail SMTP
            brevo_key = getattr(settings, 'BREVO_API_KEY', None)
            sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', None)
            
            if brevo_key and BREVO_AVAILABLE:
                # Use Brevo (Sendinblue)
                logger.info("Sending achievement alert via Brevo")
                try:
                    configuration = sib_api_v3_sdk.Configuration()
                    configuration.api_key['api-key'] = brevo_key
                    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                        sib_api_v3_sdk.ApiClient(configuration)
                    )
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        to=[{"email": to_email, "name": child_name}],
                        sender={"name": "Imaginary Worlds", "email": settings.FROM_EMAIL},
                        subject=subject,
                        html_content=html_content,
                        text_content=plain_text_content.strip()
                    )
                    
                    response = api_instance.send_transac_email(send_smtp_email)
                    logger.info(f"Achievement alert email sent successfully via Brevo to {to_email}")
                    return True
                except ApiException as e:
                    logger.error(f"Brevo API error: {str(e)}")
                    return False
                    
            elif sendgrid_key and SENDGRID_AVAILABLE:
                # Use SendGrid
                logger.info("Sending achievement alert via SendGrid")
                from_email = Email(settings.FROM_EMAIL)
                to_email_obj = To(to_email)
                
                message = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject,
                    plain_text_content=plain_text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(sendgrid_key)
                response = sg.send(message)
                
                logger.info(f"Achievement alert email sent successfully via SendGrid to {to_email}. Status: {response.status_code}")
                return True
            else:
                # Use Gmail SMTP (Django's email backend)
                logger.info("Sending achievement alert via Gmail SMTP")
                send_mail(
                    subject=subject,
                    message=plain_text_content,
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
                logger.info(f"Achievement alert email sent successfully via Gmail SMTP to {to_email}")
                return True
            
        except Exception as e:
            logger.error(f"Error sending achievement alert email: {str(e)}")
            return False
    
    @staticmethod
    def send_goal_completion_alert(to_email, child_name, goal_name, goal_details):
        """
        Send goal completion alert email to parent/teacher
        
        Args:
            to_email (str): Recipient email address
            child_name (str): Name of the child
            goal_name (str): Name of the completed goal
            goal_details (str): Details about the goal
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            subject = f"🎯 {child_name} Completed a Learning Goal!"
            
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
                        background: #f5f5f5;
                    }}
                    .container {{
                        background: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                    }}
                    .goal-badge {{
                        font-size: 80px;
                        margin: 20px 0 10px 0;
                    }}
                    .content {{
                        padding: 40px 30px;
                    }}
                    .goal-box {{
                        background: #d4edda;
                        border-left: 5px solid #28a745;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }}
                    .goal-name {{
                        font-size: 24px;
                        font-weight: bold;
                        color: #28a745;
                        margin: 0 0 10px 0;
                    }}
                    .goal-details {{
                        color: #666;
                        margin: 0;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-weight: bold;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 12px;
                        background: #f8f9fa;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎨 Pixel Tales</h1>
                        <div class="goal-badge">🎯</div>
                        <h2>Learning Goal Completed!</h2>
                    </div>
                    <div class="content">
                        <p>Congratulations! <strong>{child_name}</strong> has completed a learning goal!</p>
                        
                        <div class="goal-box">
                            <p class="goal-name">{goal_name}</p>
                            <p class="goal-details">{goal_details}</p>
                        </div>
                        
                        <p>This is a great milestone! {child_name} is making excellent progress in their learning journey.</p>
                        
                        <center>
                            <a href="#" class="cta-button">View Progress Dashboard</a>
                        </center>
                    </div>
                    <div class="footer">
                        <p>You're receiving this because you enabled Goal Completion alerts in your notification settings.</p>
                        <p>© 2024 Pixel Tales. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Pixel Tales - Learning Goal Completed!
            
            Congratulations! {child_name} has completed a learning goal!
            
            Goal: {goal_name}
            {goal_details}
            
            This is a great milestone! {child_name} is making excellent progress in their learning journey.
            
            ---
            You're receiving this because you enabled Goal Completion alerts in your notification settings.
            © 2024 Pixel Tales. All rights reserved.
            """
            
            # Try Brevo first, then SendGrid, then Gmail SMTP
            brevo_key = getattr(settings, 'BREVO_API_KEY', None)
            sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', None)
            
            if brevo_key and BREVO_AVAILABLE:
                # Use Brevo (Sendinblue)
                logger.info("Sending goal completion alert via Brevo")
                try:
                    configuration = sib_api_v3_sdk.Configuration()
                    configuration.api_key['api-key'] = brevo_key
                    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                        sib_api_v3_sdk.ApiClient(configuration)
                    )
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        to=[{"email": to_email, "name": child_name}],
                        sender={"name": "Imaginary Worlds", "email": settings.FROM_EMAIL},
                        subject=subject,
                        html_content=html_content,
                        text_content=plain_text_content.strip()
                    )
                    
                    response = api_instance.send_transac_email(send_smtp_email)
                    logger.info(f"Goal completion alert email sent successfully via Brevo to {to_email}")
                    return True
                except ApiException as e:
                    logger.error(f"Brevo API error: {str(e)}")
                    return False
                    
            elif sendgrid_key and SENDGRID_AVAILABLE:
                # Use SendGrid
                logger.info("Sending goal completion alert via SendGrid")
                from_email = Email(settings.FROM_EMAIL)
                to_email_obj = To(to_email)
                
                message = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject,
                    plain_text_content=plain_text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(sendgrid_key)
                response = sg.send(message)
                
                logger.info(f"Goal completion alert email sent successfully via SendGrid to {to_email}. Status: {response.status_code}")
                return True
            else:
                # Use Gmail SMTP (Django's email backend)
                logger.info("Sending goal completion alert via Gmail SMTP")
                send_mail(
                    subject=subject,
                    message=plain_text_content,
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
                logger.info(f"Goal completion alert email sent successfully via Gmail SMTP to {to_email}")
                return True
            
        except Exception as e:
            logger.error(f"Error sending goal completion alert email: {str(e)}")
            return False
    
    @staticmethod
    def send_weekly_progress_report(to_email, parent_name, child_name, stats):
        """
        Send weekly progress report email to parent/teacher
        
        Args:
            to_email (str): Recipient email address
            parent_name (str): Name of the parent/teacher
            child_name (str): Name of the child
            stats (dict): Dictionary containing weekly statistics
                - stories_read (int): Number of stories read this week
                - stories_created (int): Number of stories created this week
                - achievements_earned (int): Number of achievements earned
                - total_reading_time (str): Total reading time (e.g., "2h 30m")
                - games_completed (int): Number of games completed
                
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            subject = f"📊 Weekly Progress Report for {child_name}"
            
            # Extract stats with defaults
            stories_read = stats.get('stories_read', 0)
            stories_created = stats.get('stories_created', 0)
            achievements_earned = stats.get('achievements_earned', 0)
            reading_time = stats.get('total_reading_time', '0m')
            games_completed = stats.get('games_completed', 0)
            
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
                        background: #f5f5f5;
                    }}
                    .container {{
                        background: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 28px;
                    }}
                    .report-icon {{
                        font-size: 80px;
                        margin: 20px 0 10px 0;
                    }}
                    .content {{
                        padding: 40px 30px;
                    }}
                    .stats-grid {{
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 30px 0;
                    }}
                    .stat-card {{
                        background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        border: 2px solid #667eea30;
                    }}
                    .stat-number {{
                        font-size: 36px;
                        font-weight: bold;
                        color: #667eea;
                        margin: 10px 0;
                    }}
                    .stat-label {{
                        color: #666;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }}
                    .highlight {{
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 5px;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-weight: bold;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 12px;
                        background: #f8f9fa;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎨 Pixel Tales</h1>
                        <div class="report-icon">📊</div>
                        <h2>Weekly Progress Report</h2>
                    </div>
                    <div class="content">
                        <p>Hi {parent_name},</p>
                        <p>Here's a summary of <strong>{child_name}'s</strong> activity this week:</p>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-number">{stories_read}</div>
                                <div class="stat-label">Stories Read</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{stories_created}</div>
                                <div class="stat-label">Stories Created</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{achievements_earned}</div>
                                <div class="stat-label">Achievements</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">{games_completed}</div>
                                <div class="stat-label">Games Completed</div>
                            </div>
                        </div>
                        
                        <div class="highlight">
                            <strong>⏱️ Total Reading Time:</strong> {reading_time}
                        </div>
                        
                        <p>{child_name} is making great progress! Keep encouraging them to explore more stories and unleash their creativity.</p>
                        
                        <center>
                            <a href="#" class="cta-button">View Detailed Dashboard</a>
                        </center>
                    </div>
                    <div class="footer">
                        <p>You're receiving this weekly report because you enabled Weekly Progress Reports in your notification settings.</p>
                        <p>© 2024 Pixel Tales. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Pixel Tales - Weekly Progress Report
            
            Hi {parent_name},
            
            Here's a summary of {child_name}'s activity this week:
            
            📚 Stories Read: {stories_read}
            ✍️ Stories Created: {stories_created}
            🏆 Achievements Earned: {achievements_earned}
            🎮 Games Completed: {games_completed}
            ⏱️ Total Reading Time: {reading_time}
            
            {child_name} is making great progress! Keep encouraging them to explore more stories and unleash their creativity.
            
            ---
            You're receiving this weekly report because you enabled Weekly Progress Reports in your notification settings.
            © 2024 Pixel Tales. All rights reserved.
            """
            
            # Try Brevo first, then SendGrid, then Gmail SMTP
            brevo_key = getattr(settings, 'BREVO_API_KEY', None)
            sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', None)
            
            if brevo_key and BREVO_AVAILABLE:
                # Use Brevo (Sendinblue)
                logger.info("Sending weekly progress report via Brevo")
                try:
                    configuration = sib_api_v3_sdk.Configuration()
                    configuration.api_key['api-key'] = brevo_key
                    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                        sib_api_v3_sdk.ApiClient(configuration)
                    )
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        to=[{"email": to_email, "name": parent_name}],
                        sender={"name": "Imaginary Worlds", "email": settings.FROM_EMAIL},
                        subject=subject,
                        html_content=html_content,
                        text_content=plain_text_content.strip()
                    )
                    
                    response = api_instance.send_transac_email(send_smtp_email)
                    logger.info(f"Weekly progress report email sent successfully via Brevo to {to_email}")
                    return True
                except ApiException as e:
                    logger.error(f"Brevo API error: {str(e)}")
                    return False
                    
            elif sendgrid_key and SENDGRID_AVAILABLE:
                # Use SendGrid
                logger.info("Sending weekly progress report via SendGrid")
                from_email = Email(settings.FROM_EMAIL)
                to_email_obj = To(to_email)
                
                message = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject,
                    plain_text_content=plain_text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(sendgrid_key)
                response = sg.send(message)
                
                logger.info(f"Weekly progress report email sent successfully via SendGrid to {to_email}. Status: {response.status_code}")
                return True
            else:
                # Use Gmail SMTP (Django's email backend)
                logger.info("Sending weekly progress report via Gmail SMTP")
                send_mail(
                    subject=subject,
                    message=plain_text_content,
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
                logger.info(f"Weekly progress report email sent successfully via Gmail SMTP to {to_email}")
                return True
            
        except Exception as e:
            logger.error(f"Error sending weekly progress report email: {str(e)}")
            return False
    
    @staticmethod
    def send_test_notification_email(to_email, user_name):
        """
        Send a test notification email to verify email settings are working
        
        Args:
            to_email (str): Recipient email address
            user_name (str): User's display name
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            subject = "🔔 Test Notification from Pixel Tales"
            
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
                        background: #f5f5f5;
                    }}
                    .container {{
                        background: white;
                        border-radius: 15px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }}
                    .success-icon {{
                        font-size: 80px;
                        margin: 20px 0 10px 0;
                    }}
                    .content {{
                        padding: 40px 30px;
                    }}
                    .success-box {{
                        background: #d4edda;
                        border-left: 5px solid #28a745;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 5px;
                        text-align: center;
                    }}
                    .footer {{
                        text-align: center;
                        padding: 20px;
                        color: #666;
                        font-size: 12px;
                        background: #f8f9fa;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎨 Pixel Tales</h1>
                        <div class="success-icon">✅</div>
                        <h2>Notification Test Successful!</h2>
                    </div>
                    <div class="content">
                        <p>Hi {user_name},</p>
                        
                        <div class="success-box">
                            <h3 style="color: #28a745; margin: 0;">🎉 Great News!</h3>
                            <p style="margin: 10px 0 0 0;">Your email notifications are working perfectly!</p>
                        </div>
                        
                        <p>You will now receive notifications based on your preferences:</p>
                        <ul>
                            <li>📊 Weekly Progress Reports</li>
                            <li>🏆 Achievement Alerts</li>
                            <li>🎯 Goal Completion Notifications</li>
                        </ul>
                        
                        <p>You can manage your notification preferences anytime in the Settings page.</p>
                    </div>
                    <div class="footer">
                        <p>This is a test email sent from Pixel Tales notification system.</p>
                        <p>© 2024 Pixel Tales. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Pixel Tales - Notification Test Successful!
            
            Hi {user_name},
            
            Great News! Your email notifications are working perfectly!
            
            You will now receive notifications based on your preferences:
            - 📊 Weekly Progress Reports
            - 🏆 Achievement Alerts
            - 🎯 Goal Completion Notifications
            
            You can manage your notification preferences anytime in the Settings page.
            
            ---
            This is a test email sent from Pixel Tales notification system.
            © 2024 Pixel Tales. All rights reserved.
            """
            
            # Try Brevo first, then SendGrid, then Gmail SMTP
            brevo_key = getattr(settings, 'BREVO_API_KEY', None)
            sendgrid_key = getattr(settings, 'SENDGRID_API_KEY', None)
            
            if brevo_key and BREVO_AVAILABLE:
                # Use Brevo (Sendinblue)
                logger.info("Sending test notification email via Brevo")
                try:
                    configuration = sib_api_v3_sdk.Configuration()
                    configuration.api_key['api-key'] = brevo_key
                    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                        sib_api_v3_sdk.ApiClient(configuration)
                    )
                    
                    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                        to=[{"email": to_email, "name": user_name}],
                        sender={"name": "Imaginary Worlds", "email": settings.FROM_EMAIL},
                        subject=subject,
                        html_content=html_content,
                        text_content=plain_text_content.strip()
                    )
                    
                    response = api_instance.send_transac_email(send_smtp_email)
                    logger.info(f"Test notification email sent successfully via Brevo to {to_email}")
                    return True
                except ApiException as e:
                    logger.error(f"Brevo API error: {str(e)}")
                    return False
                    
            elif sendgrid_key and SENDGRID_AVAILABLE:
                # Use SendGrid
                logger.info("Sending test notification email via SendGrid")
                from_email = Email(settings.FROM_EMAIL)
                to_email_obj = To(to_email)
                
                message = Mail(
                    from_email=from_email,
                    to_emails=to_email_obj,
                    subject=subject,
                    plain_text_content=plain_text_content,
                    html_content=html_content
                )
                
                sg = SendGridAPIClient(sendgrid_key)
                response = sg.send(message)
                
                logger.info(f"Test notification email sent successfully via SendGrid to {to_email}. Status: {response.status_code}")
                return True
            else:
                # Use Gmail SMTP (Django's email backend)
                logger.info("Sending test notification email via Gmail SMTP")
                send_mail(
                    subject=subject,
                    message=plain_text_content,
                    html_message=html_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[to_email],
                    fail_silently=False,
                )
                logger.info(f"Test notification email sent successfully via Gmail SMTP to {to_email}")
                return True
            
        except Exception as e:
            logger.error(f"Error sending test notification email: {str(e)}")
            return False
