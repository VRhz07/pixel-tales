#!/usr/bin/env python
"""
Test registration with various input combinations to find what causes 400 error
"""
import requests
import json
from datetime import datetime

url = 'http://localhost:8000/api/auth/register/'

print("=" * 80)
print("TESTING REGISTRATION - FINDING 400 ERROR CAUSE")
print("=" * 80)

# Test cases with different inputs
test_cases = [
    {
        "name": "Valid Registration",
        "data": {
            "name": "Test User",
            "email": "testuser@gmail.com",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
            "user_type": "child"
        }
    },
    {
        "name": "Missing name",
        "data": {
            "email": "testuser2@gmail.com",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
            "user_type": "child"
        }
    },
    {
        "name": "Short password",
        "data": {
            "name": "Test User",
            "email": "testuser3@gmail.com",
            "password": "Test123",
            "confirm_password": "Test123",
            "user_type": "child"
        }
    },
    {
        "name": "Mismatched passwords",
        "data": {
            "name": "Test User",
            "email": "testuser4@gmail.com",
            "password": "TestPassword123",
            "confirm_password": "DifferentPassword123",
            "user_type": "child"
        }
    },
    {
        "name": "Invalid email",
        "data": {
            "name": "Test User",
            "email": "notanemail",
            "password": "TestPassword123",
            "confirm_password": "TestPassword123",
            "user_type": "child"
        }
    }
]

for test in test_cases:
    print(f"\n{'='*80}")
    print(f"TEST: {test['name']}")
    print(f"{'='*80}")
    
    test_data = test['data']
    
    print(f"\nRequest data:")
    for key, value in test_data.items():
        print(f"  {key}: {value}")
    
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
            
            if response.status_code == 201:
                print(f"✅ SUCCESS!")
                print(f"   Message: {response_data.get('message')}")
                print(f"   User ID: {response_data.get('user_id')}")
            else:
                print(f"❌ FAILED!")
                if 'error' in response_data:
                    print(f"   Error: {response_data['error']}")
                else:
                    print(f"   Response: {json.dumps(response_data, indent=4)}")
                    
        except json.JSONDecodeError:
            print(f"Response (not JSON): {response.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR - Backend not running on localhost:8000")
        print(f"   Start with: python manage.py runserver 0.0.0.0:8000")
        break
    except Exception as e:
        print(f"❌ ERROR: {e}")

print(f"\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")
print("""
If you see connection error:
  → Backend is NOT running
  → Start with: python manage.py runserver 0.0.0.0:8000

If you see 400 errors:
  → Check the error message to see what validation failed

If all tests pass:
  → Backend is working correctly
  → Issue is with frontend data being sent
""")
