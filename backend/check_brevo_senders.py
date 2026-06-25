#!/usr/bin/env python
"""
Brevo Sender Verification Check - Simple & Direct
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import json

print("=" * 80)
print("BREVO SENDER VERIFICATION CHECK")
print("=" * 80)

brevo_key = getattr(settings, 'BREVO_API_KEY', None)
from_email = getattr(settings, 'FROM_EMAIL', None)

if not brevo_key:
    print("\n❌ BREVO_API_KEY not configured in .env")
    exit(1)

print(f"\n📧 FROM_EMAIL configured: {from_email}")
print(f"🔐 API Key: {brevo_key[:15]}...")

# Initialize Brevo
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = brevo_key
api_client = sib_api_v3_sdk.ApiClient(configuration)

print("\n" + "=" * 80)
print("CHECKING SENDERS IN BREVO ACCOUNT")
print("=" * 80)

try:
    senders_api = sib_api_v3_sdk.SendersApi(api_client)
    senders_response = senders_api.get_senders()
    
    # Convert to dict if needed
    if hasattr(senders_response, '__dict__'):
        senders_list = senders_response.senders if hasattr(senders_response, 'senders') else []
    else:
        senders_list = senders_response.get('senders', [])
    
    print(f"\n📋 Found {len(senders_list)} sender(s):\n")
    
    your_email_found = False
    your_email_verified = False
    
    for i, sender in enumerate(senders_list, 1):
        # Handle both dict and object types
        email = sender.email if hasattr(sender, 'email') else sender.get('email', 'Unknown')
        is_valid = sender.valid if hasattr(sender, 'valid') else sender.get('valid', False)
        name = sender.name if hasattr(sender, 'name') else sender.get('name', 'N/A')
        
        status = "✅ VERIFIED" if is_valid else "⚠️  NOT VERIFIED"
        
        print(f"  {i}. {email:35} | {status}")
        print(f"     Name: {name}")
        
        if email.lower() == from_email.lower():
            your_email_found = True
            your_email_verified = is_valid
            
            if not is_valid:
                print(f"     🔴 THIS IS YOUR FROM_EMAIL BUT IT'S NOT VERIFIED!")
            else:
                print(f"     ✅ THIS IS YOUR FROM_EMAIL AND IT'S VERIFIED!")
        print()
    
    if not your_email_found:
        print(f"\n🔴 PROBLEM FOUND:")
        print(f"   Your FROM_EMAIL ({from_email}) is NOT in the senders list!")
        print(f"   Brevo will NOT send emails from this address.")
        
    elif not your_email_verified:
        print(f"\n🔴 PROBLEM FOUND:")
        print(f"   Your FROM_EMAIL ({from_email}) is NOT verified!")
        print(f"   Brevo will NOT send emails from unverified senders.")
        
    else:
        print(f"\n✅ YOUR EMAIL IS VERIFIED - Sending should work!")
    
    print("\n" + "=" * 80)
    print("SOLUTION")
    print("=" * 80)
    
    if not your_email_verified:
        print(f"""
1️⃣  Go to: https://brevo.com/
2️⃣  Login with your account
3️⃣  Click: Settings → Senders
4️⃣  Find: {from_email}
5️⃣  Click it and verify (check your email for verification link)
6️⃣  Come back and check status

Once verified, restart the backend:
   python manage.py runserver

Then test registration again - emails should work!
""")
    
except ApiException as e:
    print(f"\n❌ API Error: {e.reason}")
    if e.status == 401:
        print(f"   Your API key is INVALID or EXPIRED")
        print(f"   Get new key from: https://brevo.com/ → Settings → API & SMTP")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")

print("=" * 80)
