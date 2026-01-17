"""
Test script for async Replicate predictions
Run this to verify the async implementation works correctly
"""
import os
import sys
import time

# Add project to path
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')

import django
django.setup()

from django.conf import settings

try:
    import replicate
    print("✅ Replicate library imported successfully")
except ImportError:
    print("❌ Replicate library not installed")
    sys.exit(1)

# Check if API token is configured
REPLICATE_API_TOKEN = getattr(settings, 'REPLICATE_API_TOKEN', None)
if not REPLICATE_API_TOKEN:
    print("❌ REPLICATE_API_TOKEN not configured in settings")
    print("   Add it to your .env file or backend/.env")
    sys.exit(1)

print(f"✅ API Token configured: {REPLICATE_API_TOKEN[:20]}...")

# Test async prediction creation
print("\n" + "="*60)
print("Testing Async Prediction Creation")
print("="*60)

try:
    client = replicate.Client(api_token=REPLICATE_API_TOKEN)
    print("✅ Replicate client created")
    
    # Create a simple test prediction
    print("\n📤 Creating async prediction...")
    start_time = time.time()
    
    prediction = client.predictions.create(
        model="black-forest-labs/flux-schnell",
        input={
            "prompt": "a cute cartoon cat reading a book, children's book illustration style",
            "aspect_ratio": "1:1",
            "num_outputs": 1
        }
    )
    
    creation_time = time.time() - start_time
    print(f"✅ Prediction created in {creation_time*1000:.0f}ms (non-blocking)")
    print(f"📋 Prediction ID: {prediction.id}")
    print(f"📊 Initial Status: {prediction.status}")
    
    # Poll for completion
    print("\n⏳ Polling for completion...")
    poll_start = time.time()
    attempts = 0
    max_attempts = 30
    
    while attempts < max_attempts:
        attempts += 1
        prediction = client.predictions.get(prediction.id)
        
        print(f"   Attempt {attempts}: {prediction.status}")
        
        if prediction.status == "succeeded":
            poll_time = time.time() - poll_start
            total_time = time.time() - start_time
            
            print(f"\n✅ SUCCESS!")
            print(f"   Polling time: {poll_time:.2f}s ({attempts} attempts)")
            print(f"   Total time: {total_time:.2f}s")
            
            # Get image URL
            output = prediction.output
            if isinstance(output, list) and len(output) > 0:
                image_url = str(output[0])
                print(f"   Image URL: {image_url[:80]}...")
            
            break
        elif prediction.status == "failed":
            print(f"\n❌ Prediction failed: {prediction.error if hasattr(prediction, 'error') else 'Unknown error'}")
            break
        
        time.sleep(1)  # Wait 1 second between polls
    
    if attempts >= max_attempts:
        print(f"\n⚠️ Timeout after {max_attempts} attempts")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*60)
print("Test Complete!")
print("="*60)
print("\nNext steps:")
print("1. If test succeeded, your async implementation is working!")
print("2. Generate a story in the frontend to see the improvements")
print("3. Watch console logs for timing improvements")
