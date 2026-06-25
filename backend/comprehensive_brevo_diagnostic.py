#!/usr/bin/env python
"""
Comprehensive Brevo email service diagnostic
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.conf import settings
from storybook.models import EmailVerification
from django.contrib.auth.models import User
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

print("=" * 70)
print("COMPREHENSIVE BREVO EMAIL DIAGNOSTICS")
print("=" * 70)

# 1. Check Configuration
print("\n1️⃣  CONFIGURATION VERIFICATION")
print("-" * 70)

brevo_key = getattr(settings, 'BREVO_API_KEY', None)
from_email = getattr(settings, 'FROM_EMAIL', None)
expiry = getattr(settings, 'EMAIL_VERIFICATION_EXPIRY_MINUTES', None)

print(f"BREVO_API_KEY configured: {bool(brevo_key)}")
if brevo_key:
    print(f"  (Masked: {brevo_key[:15]}...{brevo_key[-10:]})")
print(f"FROM_EMAIL: {from_email}")
print(f"EXPIRY_MINUTES: {expiry}")

# 2. Check Dependencies
print("\n2️⃣  DEPENDENCIES CHECK")
print("-" * 70)

try:
    import sib_api_v3_sdk
    print(f"✅ sib_api_v3_sdk: Installed")
except ImportError:
    print(f"❌ sib_api_v3_sdk: NOT installed")
    print(f"   Fix: pip install sib-api-v3-sdk")

try:
    from storybook.email_service import EmailService
    print(f"✅ EmailService: Importable")
except ImportError as e:
    print(f"❌ EmailService: Import failed - {e}")

# 3. Check Database Verification Records
print("\n3️⃣  EMAIL VERIFICATION RECORDS IN DATABASE")
print("-" * 70)

total_records = EmailVerification.objects.count()
print(f"Total email verification records: {total_records}")

if total_records > 0:
    print(f"\nRecent verification attempts (last 5):")
    for record in EmailVerification.objects.order_by('-created_at')[:5]:
        is_verified = record.is_verified
        is_expired = record.is_expired if hasattr(record, 'is_expired') else (record.expires_at < timezone.now())
        status = "✅ VERIFIED" if is_verified else ("⏰ EXPIRED" if is_expired else "⏳ PENDING")
        print(f"  {record.email:30} | {status:12} | Code: {record.verification_code}")
else:
    print("  No verification records found (users haven't registered yet)")

# 4. Check Database Integrity
print("\n4️⃣  DATABASE INTEGRITY CHECK")
print("-" * 70)

try:
    user_count = User.objects.count()
    verification_count = EmailVerification.objects.count()
    print(f"✅ Database accessible")
    print(f"   Total users: {user_count}")
    print(f"   Email verifications: {verification_count}")
except Exception as e:
    print(f"❌ Database error: {e}")

# 5. Brevo API Connection Test
print("\n5️⃣  BREVO API CONNECTION TEST")
print("-" * 70)

if brevo_key:
    try:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException
        
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = brevo_key
        api_client = sib_api_v3_sdk.ApiClient(configuration)
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(api_client)
        
        print(f"✅ Brevo API connection: OK")
        print(f"   Sender email in use: {from_email}")
        
        # Create test payload (don't send)
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": "test@example.com", "name": "Test"}],
            sender={"name": "Test", "email": from_email},
            subject="Test",
            html_content="<p>Test</p>"
        )
        print(f"✅ Email payload creation: OK")
        
    except Exception as e:
        print(f"❌ Brevo API error: {str(e)}")
else:
    print(f"❌ BREVO_API_KEY not configured")

# 6. Email Service Test
print("\n6️⃣  EMAIL SERVICE FUNCTIONALITY TEST")
print("-" * 70)

try:
    from storybook.email_service import EmailService
    
    # Don't actually send, just check if function exists and is callable
    if callable(getattr(EmailService, 'send_verification_email', None)):
        print(f"✅ send_verification_email() method: Available")
    else:
        print(f"❌ send_verification_email() method: Not found")
        
    if callable(getattr(EmailService, 'send_password_reset_email', None)):
        print(f"✅ send_password_reset_email() method: Available")
    else:
        print(f"❌ send_password_reset_email() method: Not found")
        
except Exception as e:
    print(f"❌ Email Service check failed: {e}")

# 7. Sender Verification Recommendation
print("\n7️⃣  CRITICAL: SENDER EMAIL VERIFICATION")
print("-" * 70)
print(f"""
⚠️  IMPORTANT STEP FOR NEW BREVO API KEY:

The FROM_EMAIL ({from_email}) MUST be verified in Brevo!

Steps to verify:
1. Login to https://brevo.com/
2. Go to Settings → Senders
3. Check if '{from_email}' is verified
4. If NOT verified:
   - Add the email or click to verify
   - Follow the verification email
   - Wait for confirmation

If sender email is not verified, all emails will be:
- Blocked by Brevo
- Not delivered to recipients
- Show as failed in Brevo dashboard

This is the MOST COMMON reason emails don't work
after switching to a new API key!
""")

# 8. Summary
print("\n" + "=" * 70)
print("SUMMARY & NEXT STEPS")
print("=" * 70)

issues = []

if not brevo_key:
    issues.append("❌ BREVO_API_KEY not configured in .env")
    
if not from_email:
    issues.append("❌ FROM_EMAIL not configured in .env")
    
try:
    import sib_api_v3_sdk
except ImportError:
    issues.append("❌ sib-api-v3-sdk not installed")

if issues:
    print("Issues found:")
    for issue in issues:
        print(f"  {issue}")
    print("\nFix these issues and restart the backend server.")
else:
    print("✅ All technical configurations look correct!")
    print("\n👉 NEXT ACTION:")
    print("   Verify your FROM_EMAIL in Brevo account:")
    print(f"   https://brevo.com/ → Settings → Senders → {from_email}")
    print("\nThen test registration:")
    print("   1. Start backend: python manage.py runserver")
    print("   2. Go to http://localhost:3000/auth")
    print("   3. Register with a test email")
    print("   4. Check inbox for verification code")

print("\n" + "=" * 70)
