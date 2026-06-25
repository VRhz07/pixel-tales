#!/usr/bin/env python
"""
Advanced Brevo Diagnostics - Check sender status and API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

print("=" * 70)
print("ADVANCED BREVO DIAGNOSTICS")
print("=" * 70)

brevo_key = getattr(settings, 'BREVO_API_KEY', None)
from_email = getattr(settings, 'FROM_EMAIL', None)

if not brevo_key:
    print("\n❌ BREVO_API_KEY not configured!")
    exit(1)

print(f"\n🔐 API Key: {brevo_key[:20]}...")
print(f"📧 FROM_EMAIL: {from_email}")

# Initialize Brevo API
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = brevo_key
api_client = sib_api_v3_sdk.ApiClient(configuration)

print("\n" + "=" * 70)
print("1️⃣  CHECKING SENDER VERIFICATION STATUS IN BREVO")
print("=" * 70)

try:
    senders_api = sib_api_v3_sdk.SendersApi(api_client)
    
    print(f"\n🔍 Fetching senders from Brevo...")
    senders_response = senders_api.get_senders()
    
    senders = senders_response.get('senders', [])
    
    print(f"\n✅ Found {len(senders)} sender(s) in your Brevo account:")
    
    from_email_found = False
    from_email_verified = False
    
    for sender in senders:
        email = sender.get('email', 'Unknown')
        is_valid = sender.get('valid', False)
        name = sender.get('name', 'N/A')
        
        status = "✅ VERIFIED" if is_valid else "❌ NOT VERIFIED"
        print(f"\n  📧 {email:35} | {status}")
        print(f"     Name: {name}")
        
        if email.lower() == from_email.lower():
            from_email_found = True
            from_email_verified = is_valid
            
            if not is_valid:
                print(f"     ⚠️  THIS IS YOUR FROM_EMAIL BUT IT'S NOT VERIFIED!")
                print(f"     👉 YOU MUST VERIFY THIS EMAIL IN BREVO!")
    
    if not from_email_found:
        print(f"\n  ❌ YOUR FROM_EMAIL ({from_email}) IS NOT IN THE SENDERS LIST!")
        print(f"     👉 YOU MUST ADD IT TO BREVO SENDERS AND VERIFY IT!")
        
    print(f"\n" + "-" * 70)
    print(f"SENDER STATUS SUMMARY:")
    print(f"  FROM_EMAIL found in Brevo: {'✅ YES' if from_email_found else '❌ NO'}")
    print(f"  FROM_EMAIL verified: {'✅ YES' if from_email_verified else '❌ NO'}")
    
    if not from_email_verified:
        print(f"\n  🔴 THIS IS YOUR PROBLEM!")
        print(f"     Emails will NOT be sent from an unverified sender.")
        
except ApiException as e:
    print(f"\n❌ API Exception:")
    print(f"   Status: {e.status}")
    print(f"   Reason: {e.reason}")
    
    if e.status == 401:
        print(f"\n   ⚠️  401 = Invalid API Key!")
        print(f"   Check your BREVO_API_KEY in .env")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("2️⃣  CHECKING ACCOUNT INFORMATION")
print("=" * 70)

try:
    account_api = sib_api_v3_sdk.AccountApi(api_client)
    
    print(f"\n🔍 Fetching account details...")
    account = account_api.get_account()
    
    print(f"\n✅ Account Details:")
    print(f"   First Name: {account.get('first_name', 'N/A')}")
    print(f"   Last Name: {account.get('last_name', 'N/A')}")
    print(f"   Email: {account.get('email', 'N/A')}")
    print(f"   Plan: {account.get('plan', 'N/A')}")
    print(f"   Remaining Credits: {account.get('credits', 'N/A')}")
    
    # Check if account is active
    if account.get('credits', 0) == 0:
        print(f"\n   ⚠️  ACCOUNT HAS NO CREDITS!")
        print(f"   You may need to add billing or upgrade plan")
    
except ApiException as e:
    print(f"\n❌ API Exception: {e.reason}")
except Exception as e:
    print(f"\n❌ Error: {str(e)}")

print("\n" + "=" * 70)
print("3️⃣  TESTING EMAIL SEND")
print("=" * 70)

print(f"\n🚀 Sending test email...")

try:
    transactional_api = sib_api_v3_sdk.TransactionalEmailsApi(api_client)
    
    test_email = "test.pixel.tales@gmail.com"  # Use a real email to test
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": test_email, "name": "Test User"}],
        sender={"name": "Pixel Tales", "email": from_email},
        subject="🎨 Pixel Tales - Test Email",
        html_content="""
        <html>
        <body style="font-family: Arial; background: #f5f5f5; padding: 20px;">
        <div style="background: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2>Test Email from Pixel Tales</h2>
            <p>If you received this email, Brevo is working correctly!</p>
            <h3 style="color: #667eea;">Verification Code: 123456</h3>
            <p>This is a test email to verify your setup.</p>
            <p style="color: #999; font-size: 12px;">© 2025 Pixel Tales</p>
        </div>
        </body>
        </html>
        """,
        text_content="Test email. Code: 123456"
    )
    
    response = transactional_api.send_transac_email(send_smtp_email)
    
    print(f"\n✅ Email sent successfully via Brevo API!")
    print(f"   Message ID: {response.get('messageId', 'N/A')}")
    print(f"   To: {test_email}")
    print(f"   From: {from_email}")
    
    print(f"\n📋 NEXT STEPS:")
    print(f"   1. Check your email: {test_email}")
    print(f"      (check spam/junk folder too)")
    print(f"   2. If you don't receive it in 30 seconds:")
    print(f"      - Go to https://brevo.com/")
    print(f"      - Transactional → Emails")
    print(f"      - Search for: {test_email}")
    print(f"      - Check the status (Sent/Bounced/Blocked)")
    print(f"\n   📝 Message ID for tracking: {response.get('messageId', 'N/A')}")
    
except ApiException as e:
    print(f"\n❌ API Exception - Email was NOT sent:")
    print(f"   Status: {e.status}")
    print(f"   Reason: {e.reason}")
    print(f"   Body: {e.body}")
    
    if "sender" in str(e).lower():
        print(f"\n   ⚠️  ERROR IS ABOUT SENDER!")
        print(f"   Your FROM_EMAIL ({from_email}) is not verified in Brevo!")
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("SUMMARY & NEXT ACTIONS")
print("=" * 70)

print("""
If you:
  ✅ Saw "Email sent successfully" above
     → Check test.pixel.tales@gmail.com inbox
     → If not there in 30 seconds, go to Brevo dashboard
  
  ❌ Saw "Email was NOT sent" above
     → Your FROM_EMAIL is likely not verified
     → Go to Brevo → Settings → Senders
     → Add or verify: werpixeltales@gmail.com
  
  ❌ Saw "Invalid API Key" error
     → Check your BREVO_API_KEY in .env
     → Copy it directly from Brevo dashboard
     → Restart backend server

""")

print("=" * 70)
