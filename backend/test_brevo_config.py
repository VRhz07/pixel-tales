#!/usr/bin/env python
"""
Test Brevo email configuration and API key
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.conf import settings
import logging

logger = logging.getLogger(__name__)

print("=" * 70)
print("BREVO EMAIL CONFIGURATION TEST")
print("=" * 70)

# Check environment variables
print("\n📋 Configuration Check:")
print(f"  BREVO_API_KEY present: {bool(getattr(settings, 'BREVO_API_KEY', None))}")
print(f"  FROM_EMAIL: {getattr(settings, 'FROM_EMAIL', 'NOT SET')}")
print(f"  EMAIL_VERIFICATION_EXPIRY_MINUTES: {getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_MINUTES', 'NOT SET')}")
print(f"  DEBUG mode: {settings.DEBUG}")

# Get the actual key (first/last 20 chars for security)
brevo_key = getattr(settings, 'BREVO_API_KEY', None)
if brevo_key:
    masked_key = brevo_key[:10] + "..." + brevo_key[-10:]
    print(f"  BREVO_API_KEY (masked): {masked_key}")
else:
    print(f"  ❌ BREVO_API_KEY is NOT SET")

# Check if Brevo is installed
print("\n🔧 Dependency Check:")
try:
    import sib_api_v3_sdk
    print(f"  ✅ sib_api_v3_sdk is installed")
    print(f"     Version: {sib_api_v3_sdk.__version__ if hasattr(sib_api_v3_sdk, '__version__') else 'Unknown'}")
    BREVO_AVAILABLE = True
except ImportError:
    print(f"  ❌ sib_api_v3_sdk is NOT installed")
    print(f"     Fix: pip install sib-api-v3-sdk")
    BREVO_AVAILABLE = False

# Test Brevo API connection
if BREVO_AVAILABLE and brevo_key:
    print("\n🧪 Testing Brevo API Connection:")
    try:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException
        
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = brevo_key
        
        # Try to create the API client
        api_client = sib_api_v3_sdk.ApiClient(configuration)
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(api_client)
        
        print(f"  ✅ Brevo API client created successfully")
        
        # Try to send a test email
        print(f"\n  Testing email send with test payload...")
        try:
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": "test@example.com", "name": "Test User"}],
                sender={"name": "Pixel Tales Test", "email": getattr(settings, 'FROM_EMAIL', 'noreply@pixeltales.com')},
                subject="Test Email - Do Not Send",
                html_content="<p>This is a test email</p>",
                text_content="This is a test email"
            )
            print(f"  ✅ Email payload created successfully")
            print(f"  ℹ️  To: test@example.com")
            print(f"  ℹ️  From: {getattr(settings, 'FROM_EMAIL', 'noreply@pixeltales.com')}")
            
        except Exception as e:
            print(f"  ❌ Error creating email payload: {str(e)}")
        
    except Exception as e:
        print(f"  ❌ Failed to initialize Brevo: {str(e)}")
        print(f"  This could mean:")
        print(f"    - BREVO_API_KEY is invalid or expired")
        print(f"    - API key format is incorrect")
        print(f"    - Network connectivity issue")
else:
    if not BREVO_AVAILABLE:
        print("\n❌ Brevo SDK is not installed. Install it with:")
        print("   pip install sib-api-v3-sdk")
    if not brevo_key:
        print("\n❌ BREVO_API_KEY is not set in .env file")

# Check email service imports
print("\n📦 Email Service Check:")
try:
    from storybook.email_service import EmailService
    print(f"  ✅ EmailService imported successfully")
except ImportError as e:
    print(f"  ❌ Failed to import EmailService: {str(e)}")

print("\n" + "=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print("""
If BREVO_API_KEY is invalid:
1. Go to https://brevo.com/login/
2. Navigate to Settings → API & SMTP
3. Copy your API key
4. Update it in backend/.env:
   BREVO_API_KEY=xkeysib-<your-new-key>
5. Restart your backend server

If sib_api_v3_sdk is not installed:
1. Run: pip install sib-api-v3-sdk
2. Restart your backend server

If configuration looks correct but emails still don't send:
1. Check backend logs for error messages
2. Verify FROM_EMAIL is a verified sender in Brevo
3. Test with a real email address (not example.com)
""")
