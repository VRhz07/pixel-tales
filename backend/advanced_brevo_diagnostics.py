#!/usr/bin/env python
"""
Advanced Brevo Diagnostics - Check actual Brevo API logs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

print("=" * 70)
print("ADVANCED BREVO DIAGNOSTICS - API LOGS CHECK")
print("=" * 70)

brevo_key = getattr(settings, 'BREVO_API_KEY', None)
from_email = getattr(settings, 'FROM_EMAIL', None)

if not brevo_key:
    print("\n❌ BREVO_API_KEY not configured!")
    exit(1)

print(f"\n🔐 Testing with API Key: {brevo_key[:20]}...")
print(f"📧 Sender Email: {from_email}")

# Initialize Brevo API
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = brevo_key
api_client = sib_api_v3_sdk.ApiClient(configuration)

print("\n" + "=" * 70)
print("1️⃣  CHECKING EMAIL LOGS FROM BREVO")
print("=" * 70)

try:
    # Get email logs from Brevo
    email_logs_api = sib_api_v3_sdk.EmailCampaignsApi(api_client)
    
    print("\n📋 Attempting to fetch recent email activity...")
    print("   Note: This checks transactional emails sent via API")
    
except Exception as e:
    print(f"\n⚠️  Cannot access email logs: {str(e)}")

print("\n" + "=" * 70)
print("2️⃣  CHECKING SENDER VERIFICATION STATUS")
print("=" * 70)

try:
    senders_api = sib_api_v3_sdk.SendersApi(api_client)
    
    print(f"\n🔍 Fetching sender list from Brevo...")
    senders = senders_api.get_senders()
    
    print(f"\n✅ Found {len(senders['senders']) if senders.get('senders') else 0} senders in your account:")
    
    if senders.get('senders'):
        for sender in senders['senders']:
            email = sender.get('email', 'Unknown')
            is_valid = sender.get('valid', False)
            status = "✅ VERIFIED & ACTIVE" if is_valid else "❌ NOT VERIFIED"
            print(f"\n  📧 {email}")
            print(f"     Status: {status}")
            print(f"     Name: {sender.get('name', 'N/A')}")
            
            if email.lower() == from_email.lower() and not is_valid:
                print(f"     ⚠️  THIS IS YOUR FROM_EMAIL BUT IT'S NOT VERIFIED!")
    else:
        print("\n  ❌ No senders found in account!")
        print("     You must add and verify at least one sender!")
        
except ApiException as e:
    print(f"\n❌ API Error: {str(e)}")
    print("\nPossible causes:")
    print("  1. API key is invalid or expired")
    print("  2. API key doesn't have permission to check senders")
    print("  3. Brevo account is suspended")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")

print("\n" + "=" * 70)
print("3️⃣  TESTING ACTUAL EMAIL SEND WITH REAL RECIPIENT")
print("=" * 70)

# Ask for test email
test_email = input("\n📧 Enter your test email address to send verification code to: ").strip()

if not test_email:
    print("No email provided, skipping test.")
else:
    print(f"\n🚀 Sending test email to: {test_email}")
    
    try:
        transactional_api = sib_api_v3_sdk.TransactionalEmailsApi(api_client)
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": test_email, "name": "Test User"}],
            sender={"name": "Pixel Tales", "email": from_email},
            subject="Pixel Tales Test - Verification Code",
            html_content="""
            <html>
            <body>
            <h2>Test Email from Pixel Tales</h2>
            <p>If you received this, your Brevo setup is working!</p>
            <h3>Verification Code: 123456</h3>
            <p>This is a test email.</p>
            </body>
            </html>
            """,
            text_content="Test email from Pixel Tales. Verification Code: 123456"
        )
        
        response = transactional_api.send_transac_email(send_smtp_email)
        
        print(f"\n✅ Email Send Response:")
        print(f"   Message ID: {response.get('messageId', 'N/A')}")
        
        if response.get('messageId'):
            print(f"\n📝 IMPORTANT: Write down this Message ID: {response['messageId']}")
            print(f"   Use it to check email status at:")
            print(f"   https://brevo.com/ → Transactional → Emails")
            print(f"\n⏳ Wait 10-15 seconds, then check:")
            print(f"   1. Your email inbox (including spam/junk folder)")
            print(f"   2. Brevo dashboard email logs")
            
    except ApiException as e:
        print(f"\n❌ API Exception during send:")
        print(f"   Status: {e.status}")
        print(f"   Reason: {e.reason}")
        print(f"   Body: {e.body}")
        
        if "sender" in str(e).lower():
            print(f"\n⚠️  ERROR INDICATES SENDER ISSUE:")
            print(f"   The sender email {from_email} may not be verified!")
            print(f"   Go to Brevo → Settings → Senders and verify it")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

print("\n" + "=" * 70)
print("4️⃣  WHAT TO CHECK NOW")
print("=" * 70)

print("""
After sending the test email:

1. ✅ Check your email inbox (including spam/junk)
   - Should arrive within 30 seconds
   
2. ✅ Check Brevo dashboard
   - Go to https://brevo.com/
   - Transactional → Emails
   - Search for your test email address
   - Check the status (Sent/Bounced/Blocked/etc)
   
3. ✅ If status is "Bounced" or "Blocked"
   - Check the reason
   - Most common: Sender not verified
   - Fix: Go to Settings → Senders and verify email
   
4. ✅ If email shows "Sent" but you don't receive it
   - It's in spam folder (whitelist sender)
   - Or your email is incorrect
   - Try with different email provider (Gmail, Outlook, etc)
""")

print("=" * 70)
