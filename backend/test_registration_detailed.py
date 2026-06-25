#!/usr/bin/env python
"""
Test registration endpoint with detailed error responses
"""
import requests
import json
from datetime import datetime

url = 'http://localhost:8000/api/auth/register/'

print("=" * 70)
print("TESTING REGISTRATION ENDPOINT")
print("=" * 70)

# Test with valid data
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
test_data = {
    "name": f"Test User {timestamp}",
    "email": f"testuser{timestamp}@gmail.com",
    "password": "TestPassword123!",
    "confirm_password": "TestPassword123!",
    "user_type": "child"
}

print(f"\n📝 Sending registration request:")
print(f"  Name: {test_data['name']}")
print(f"  Email: {test_data['email']}")
print(f"  Password: (hidden)")
print(f"  User Type: {test_data['user_type']}")

try:
    response = requests.post(
        url,
        json=test_data,
        timeout=10,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\n📊 Response Status: {response.status_code}")
    
    try:
        response_data = response.json()
        print(f"\n📋 Response Data:")
        print(json.dumps(response_data, indent=2))
        
        if response.status_code in [200, 201]:
            print(f"\n✅ Registration successful!")
            print(f"   user_id: {response_data.get('user_id')}")
            print(f"   requires_verification: {response_data.get('requires_verification')}")
            print(f"   email_sent: {response_data.get('email_sent')}")
        else:
            print(f"\n❌ Registration failed!")
            if 'error' in response_data:
                print(f"   Error: {response_data['error']}")
            if 'errors' in response_data:
                print(f"   Errors: {response_data['errors']}")
            
    except json.JSONDecodeError:
        print(f"\n📋 Response (not JSON):")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print(f"\n❌ CONNECTION ERROR - Backend not running")
    print(f"   Start with: python manage.py runserver")
except Exception as e:
    print(f"\n❌ ERROR: {e}")

print("\n" + "=" * 70)
print("COMMON REGISTRATION ERRORS")
print("=" * 70)
print("""
Error: "All fields are required"
  → Make sure name, email, password, confirm_password are all provided

Error: "Passwords do not match"
  → Ensure password and confirm_password are identical

Error: "Password must be at least 8 characters long"
  → Use a password with 8+ characters

Error: "Invalid email format"
  → Use a valid email like: user@gmail.com

Error: "Username already exists"
  → The name you provided is taken (try: "John Smith 123")

Error: "This email is already registered"
  → The email already has an account
""")

print("=" * 70)
