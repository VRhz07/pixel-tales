#!/usr/bin/env python
"""
Test the login endpoint to verify it's working
"""
import requests
import json

url = 'http://localhost:8000/api/auth/login/'

print("=" * 70)
print("TESTING LOGIN ENDPOINT")
print("=" * 70)

credentials = [
    {'email': 'john@gmail.com', 'password': 'Test123!@#', 'type': 'Regular User'},
    {'email': 'werpixeltales@gmail.com', 'password': 'AdminPassword123!@#', 'type': 'Admin'},
]

for cred in credentials:
    print(f"\n🔐 Testing {cred['type']}: {cred['email']}")
    print(f"   Password: {cred['password']}")
    
    try:
        response = requests.post(
            url,
            json={
                'email': cred['email'],
                'password': cred['password']
            },
            timeout=5
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ LOGIN SUCCESSFUL!")
            print(f"   User: {data.get('user', {}).get('username', 'N/A')}")
            print(f"   User Type: {data.get('user', {}).get('user_type', 'N/A')}")
            print(f"   Access Token: {data.get('access', 'N/A')[:50]}...")
        else:
            print(f"   ❌ LOGIN FAILED!")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ CONNECTION ERROR - Backend not running on localhost:8000")
        print(f"   Make sure to run: python manage.py runserver")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

print("\n" + "=" * 70)
