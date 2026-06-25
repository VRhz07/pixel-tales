#!/usr/bin/env python
"""
Direct Django test - test registration without HTTP
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.test import RequestFactory
from storybook.jwt_auth import jwt_register
from django.contrib.auth.models import User
import json

print("=" * 70)
print("TESTING REGISTRATION DIRECTLY IN DJANGO")
print("=" * 70)

# Create a test request
factory = RequestFactory()

test_data = {
    'name': 'John Doe Test',
    'email': 'johndoe.test@gmail.com',
    'password': 'TestPassword123',
    'confirm_password': 'TestPassword123',
    'user_type': 'child'
}

print(f"\n📝 Test Data:")
for key, value in test_data.items():
    print(f"  {key}: {value}")

# Create a POST request
request = factory.post(
    '/api/auth/register/',
    data=json.dumps(test_data),
    content_type='application/json'
)

print(f"\n🚀 Calling registration endpoint...")

try:
    response = jwt_register(request)
    
    print(f"\n📊 Response Status: {response.status_code}")
    print(f"\n📋 Response Data:")
    
    if hasattr(response, 'data'):
        print(json.dumps(response.data, indent=2))
    else:
        print(response.content.decode())
        
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
