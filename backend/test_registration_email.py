#!/usr/bin/env python
"""
Test the registration endpoint to see if emails are being sent
"""
import requests
import json
from datetime import datetime

url = 'http://localhost:8000/api/auth/register/'

print("=" * 70)
print("TESTING REGISTRATION ENDPOINT")
print("=" * 70)

# Test with a new email
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
test_email = f"testuser_{timestamp}@example.com"

registration_data = {
    "name": "Test User",
    "email": test_email,
    "password": "Test123!@#",
    "confirm_password": "Test123!@#",
    "user_type": "child"
}

print(f"\n📝 Registering new user:")
print(f"  Name: {registration_data['name']}")
print(f"  Email: {registration_data['email']}")
print(f"  User Type: {registration_data['user_type']}")

try:
    response = requests.post(
        url,
        json=registration_data,
        timeout=10
    )
    
    print(f"\n📊 Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"\n📋 Response Data:")
        print(json.dumps(response_data, indent=2))
        
        if response.status_code in [200, 201]:
            print(f"\n✅ Registration successful!")
            print(f"   email_sent: {response_data.get('email_sent', 'Unknown')}")
            print(f"   requires_verification: {response_data.get('requires_verification', 'Unknown')}")
            print(f"\n   Check your email: {test_email}")
        else:
            print(f"\n⚠️  Registration returned status {response.status_code}")
            
    except json.JSONDecodeError:
        print(f"Response text: {response.text}")
        
except requests.exceptions.ConnectionError:
    print(f"❌ CONNECTION ERROR - Backend not running on localhost:8000")
    print(f"Make sure to run: python manage.py runserver")
except Exception as e:
    print(f"❌ ERROR: {e}")

print("\n" + "=" * 70)
