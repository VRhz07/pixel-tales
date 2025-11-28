"""
Test the admin login endpoint via HTTP
"""
import requests
import json

url = 'http://localhost:8000/api/admin/auth/login/'
credentials = {
    'email': 'werpixeltales@gmail.com',
    'password': 'PTmeljanharvz2025'
}

print('='*60)
print('Testing Admin Login HTTP Endpoint')
print('='*60)
print(f'URL: {url}')
print(f'Email: {credentials["email"]}')
print(f'Password: {"*" * len(credentials["password"])}')
print()

try:
    response = requests.post(url, json=credentials)
    print(f'Status Code: {response.status_code}')
    print(f'Response: {json.dumps(response.json(), indent=2)}')
except Exception as e:
    print(f'Error: {e}')

print('='*60)
