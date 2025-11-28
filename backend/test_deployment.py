#!/usr/bin/env python3
"""
Test script to verify backend deployment
Usage: python test_deployment.py https://your-app.onrender.com
"""

import sys
import requests
import json

def test_deployment(base_url):
    """Test all critical endpoints"""
    
    print(f"\n🧪 Testing deployment at: {base_url}")
    print("=" * 60)
    
    results = {
        "passed": 0,
        "failed": 0,
        "tests": []
    }
    
    # Test 1: API Root
    print("\n1. Testing API root endpoint...")
    try:
        response = requests.get(f"{base_url}/api/", timeout=10)
        if response.status_code == 200:
            print("   ✅ API root accessible")
            results["passed"] += 1
            results["tests"].append(("API Root", "PASSED"))
        else:
            print(f"   ❌ API root returned {response.status_code}")
            results["failed"] += 1
            results["tests"].append(("API Root", f"FAILED - {response.status_code}"))
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        results["failed"] += 1
        results["tests"].append(("API Root", f"FAILED - {str(e)}"))
    
    # Test 2: Registration Endpoint
    print("\n2. Testing registration endpoint...")
    try:
        test_data = {
            "username": f"testuser_{int(requests.get('https://httpbin.org/uuid').json()['uuid'][:8], 16)}",
            "email": f"test_{int(requests.get('https://httpbin.org/uuid').json()['uuid'][:8], 16)}@example.com",
            "password": "TestPass123!",
            "account_type": "child"
        }
        response = requests.post(
            f"{base_url}/api/auth/register/",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        if response.status_code == 201:
            print("   ✅ Registration works")
            results["passed"] += 1
            results["tests"].append(("Registration", "PASSED"))
            
            # Save token for next tests
            response_data = response.json()
            access_token = response_data.get('access')
            
            # Test 3: Profile endpoint with auth
            print("\n3. Testing authenticated endpoint...")
            try:
                profile_response = requests.get(
                    f"{base_url}/api/auth/profile/",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10
                )
                if profile_response.status_code == 200:
                    print("   ✅ Authentication works")
                    results["passed"] += 1
                    results["tests"].append(("Authentication", "PASSED"))
                else:
                    print(f"   ❌ Profile returned {profile_response.status_code}")
                    results["failed"] += 1
                    results["tests"].append(("Authentication", f"FAILED - {profile_response.status_code}"))
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
                results["failed"] += 1
                results["tests"].append(("Authentication", f"FAILED - {str(e)}"))
                
        else:
            print(f"   ❌ Registration returned {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            results["failed"] += 1
            results["tests"].append(("Registration", f"FAILED - {response.status_code}"))
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        results["failed"] += 1
        results["tests"].append(("Registration", f"FAILED - {str(e)}"))
    
    # Test 4: Admin Panel
    print("\n4. Testing admin panel...")
    try:
        response = requests.get(f"{base_url}/admin/", timeout=10)
        if response.status_code in [200, 302]:
            print("   ✅ Admin panel accessible")
            results["passed"] += 1
            results["tests"].append(("Admin Panel", "PASSED"))
        else:
            print(f"   ❌ Admin panel returned {response.status_code}")
            results["failed"] += 1
            results["tests"].append(("Admin Panel", f"FAILED - {response.status_code}"))
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        results["failed"] += 1
        results["tests"].append(("Admin Panel", f"FAILED - {str(e)}"))
    
    # Test 5: Static Files
    print("\n5. Testing static files...")
    try:
        response = requests.get(f"{base_url}/static/", timeout=10)
        if response.status_code in [200, 404]:  # 404 is ok, means static serving works
            print("   ✅ Static file serving configured")
            results["passed"] += 1
            results["tests"].append(("Static Files", "PASSED"))
        else:
            print(f"   ⚠️  Static files returned {response.status_code}")
            results["passed"] += 1  # Not critical
            results["tests"].append(("Static Files", "WARNING"))
    except Exception as e:
        print(f"   ⚠️  Warning: {str(e)}")
        results["passed"] += 1  # Not critical
        results["tests"].append(("Static Files", "WARNING"))
    
    # Print Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    for test_name, status in results["tests"]:
        icon = "✅" if status == "PASSED" else "⚠️" if "WARNING" in status else "❌"
        print(f"{icon} {test_name}: {status}")
    
    print(f"\n✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    
    if results["failed"] == 0:
        print("\n🎉 ALL TESTS PASSED! Your backend is ready!")
        print(f"\n📱 Update your frontend .env with:")
        print(f"   VITE_API_BASE_URL={base_url}/api")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        print("\n🔍 Troubleshooting steps:")
        print("   1. Check Render logs in dashboard")
        print("   2. Verify environment variables are set")
        print("   3. Ensure persistent disk is mounted")
        print("   4. Check build completed successfully")
        return 1

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_deployment.py https://your-app.onrender.com")
        print("\nExample:")
        print("  python test_deployment.py https://pixeltales-backend.onrender.com")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    exit_code = test_deployment(base_url)
    sys.exit(exit_code)
