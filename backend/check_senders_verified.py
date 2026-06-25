#!/usr/bin/env python
"""
Brevo Sender Verification Check - Fixed for SDK objects
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.conf import settings
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

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
    
    # Get senders list from response object
    senders_list = senders_response.senders if hasattr(senders_response, 'senders') else []
    
    print(f"\n📋 Found {len(senders_list)} sender(s):\n")
    
    your_email_found = False
    your_email_verified = False
    
    for i, sender in enumerate(senders_list, 1):
        # Access as object attributes
        email = sender.email if hasattr(sender, 'email') else 'Unknown'
        is_valid = sender.valid if hasattr(sender, 'valid') else False
        name = sender.name if hasattr(sender, 'name') else 'N/A'
        
        status = "✅ VERIFIED" if is_valid else "⚠️  NOT VERIFIED"
        
        print(f"  {i}. {str(email):35} | {status}")
        print(f"     Name: {name}")
        
        if str(email).lower() == from_email.lower():
            your_email_found = True
            your_email_verified = is_valid
            
            if not is_valid:
                print(f"     🔴 THIS IS YOUR FROM_EMAIL BUT IT'S NOT VERIFIED!")
            else:
                print(f"     ✅ THIS IS YOUR FROM_EMAIL AND IT'S VERIFIED!")
        print()
    
    print("\n" + "=" * 80)
    print("DIAGNOSIS")
    print("=" * 80)
    
    if not your_email_found:
        print(f"\n🔴 CRITICAL PROBLEM:")
        print(f"   Your FROM_EMAIL ({from_email}) is NOT in senders list!")
        print(f"   Status: ❌ NOT FOUND IN BREVO")
        
    elif not your_email_verified:
        print(f"\n🔴 CRITICAL PROBLEM:")
        print(f"   Your FROM_EMAIL ({from_email}) is NOT VERIFIED!")
        print(f"   Status: ❌ UNVERIFIED - EMAILS WON'T BE SENT")
        
    else:
        print(f"\n✅ YOUR EMAIL IS VERIFIED!")
        print(f"   Status: ✅ VERIFIED - EMAILS SHOULD WORK")
        print(f"\nIf emails still aren't arriving:")
        print(f"   1. Check spam/junk folder")
        print(f"   2. Try with different email provider")
        print(f"   3. Check Brevo dashboard logs")
    
    print("\n" + "=" * 80)
    print("NEXT STEPS")
    print("=" * 80)
    
    if not your_email_verified:
        print(f"""
To fix this:

1️⃣  Go to: https://brevo.com/
2️⃣  Login to your account
3️⃣  Navigate to: Settings → Senders (on the left)
4️⃣  Look for: {from_email}
5️⃣  
   If you see it:
   - Click on it
   - Click "Verify" or "Request verification"
   - Check your email inbox for verification link from Brevo
   - Click the link to complete verification
   
   If you don't see it:
   - Click "Add a new sender"
   - Enter email: {from_email}
   - Enter name: Pixel Tales
   - Click "Add"
   - Check email for verification link
   - Click link to verify

6️⃣  Come back here and run this script again to confirm
7️⃣  Restart backend:
   python manage.py runserver
8️⃣  Test registration - emails should work now!
""")
    
except ApiException as e:
    print(f"\n❌ API Error: {e.reason}")
    if e.status == 401:
        print(f"   ❌ Your API key is INVALID or EXPIRED")
        print(f"   ❌ Get new key from: https://brevo.com/ → Settings → API & SMTP")
        print(f"   ❌ Update .env with new key and restart")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("=" * 80)
