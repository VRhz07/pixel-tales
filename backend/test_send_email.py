#!/usr/bin/env python
"""
Test sending an actual verification email via Brevo
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.email_service import EmailService
import logging

# Set up logging to see debug output
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

print("=" * 70)
print("BREVO EMAIL SEND TEST")
print("=" * 70)

# Test with a real email
test_email = "werpixeltalestest@gmail.com"  # This is in the database
test_code = "123456"
test_name = "Test User"

print(f"\n📧 Sending test verification email:")
print(f"  To: {test_email}")
print(f"  Code: {test_code}")
print(f"  Name: {test_name}")

try:
    result = EmailService.send_verification_email(
        to_email=test_email,
        verification_code=test_code,
        user_name=test_name
    )
    
    if result:
        print(f"\n✅ Email sent successfully!")
        print(f"   Check your email: {test_email}")
    else:
        print(f"\n❌ Email sending failed (returned False)")
        print(f"   Check the logs above for error details")
        
except Exception as e:
    print(f"\n❌ Exception during email send: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
