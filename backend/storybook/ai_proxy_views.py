"""
AI Service Proxy Views
Secure proxy endpoints for external AI services (Gemini, OCR, Image Generation)
API keys are kept secure on the backend and never exposed to frontend
"""
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import requests
import json
import base64
from io import BytesIO


# Gemini API Configuration
# Updated to use gemini-2.5-flash (latest and fastest model available)
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
GEMINI_VISION_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent'
GEMINI_IMAGE_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-image:generateContent'
GEMINI_API_KEY = settings.GOOGLE_AI_API_KEY

# OCR.space API Configuration
OCR_SPACE_API_KEY = getattr(settings, 'OCR_SPACE_API_KEY', None)
OCR_SPACE_API_URL = 'https://api.ocr.space/parse/image'

# Pollinations AI Configuration
POLLINATIONS_API_KEY = getattr(settings, 'POLLINATIONS_API_KEY', None)
POLLINATIONS_API_URL = 'https://image.pollinations.ai/prompt'

# Replicate API Configuration
REPLICATE_API_TOKEN = getattr(settings, 'REPLICATE_API_TOKEN', None)

# Import Replicate (optional dependency)
try:
    import replicate
    REPLICATE_AVAILABLE = True
except ImportError:
    REPLICATE_AVAILABLE = False
    print("⚠️ Replicate library not installed. Install with: pip install replicate")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_story_with_gemini(request):
    """
    Proxy endpoint for Gemini AI story generation
    Keeps API key secure on backend
    """
    if not GEMINI_API_KEY:
        return Response(
            {'error': 'Gemini API not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        prompt = request.data.get('prompt', '')
        generation_config = request.data.get('generationConfig', {})
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Make request to Gemini API
        response = requests.post(
            f'{GEMINI_API_URL}?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{'parts': [{'text': prompt}]}],
                'generationConfig': generation_config
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return Response(
                {'error': f'Gemini API error: {response.text}'},
                status=response.status_code
            )
        
        return Response(response.json(), status=status.HTTP_200_OK)
        
    except requests.exceptions.Timeout:
        return Response(
            {'error': 'Request timeout - please try again'},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_character_with_gemini(request):
    """
    Proxy endpoint for Gemini AI character generation
    """
    if not GEMINI_API_KEY:
        return Response(
            {'error': 'Gemini API not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        prompt = request.data.get('prompt', '')
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Make request to Gemini API
        response = requests.post(
            f'{GEMINI_API_URL}?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{'parts': [{'text': prompt}]}],
                'generationConfig': {
                    'temperature': 0.9,
                    'topK': 40,
                    'topP': 0.95,
                    'maxOutputTokens': 1024,
                }
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return Response(
                {'error': f'Gemini API error: {response.text}'},
                status=response.status_code
            )
        
        return Response(response.json(), status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_image_with_gemini(request):
    """
    Proxy endpoint for Gemini Vision API (OCR and image analysis)
    """
    if not GEMINI_API_KEY:
        return Response(
            {'error': 'Gemini API not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        image_data = request.data.get('image', '')
        prompt = request.data.get('prompt', 'Extract all text from this image')
        
        if not image_data:
            return Response(
                {'error': 'Image data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Make request to Gemini Vision API
        response = requests.post(
            f'{GEMINI_VISION_API_URL}?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{
                    'parts': [
                        {'text': prompt},
                        {
                            'inlineData': {
                                'mimeType': 'image/jpeg',
                                'data': image_data
                            }
                        }
                    ]
                }]
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return Response(
                {'error': f'Gemini Vision API error: {response.text}'},
                status=response.status_code
            )
        
        return Response(response.json(), status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ocr_image(request):
    """
    Proxy endpoint for OCR processing
    Uses OCR.space API if available (better for handwriting), 
    falls back to Gemini Vision API
    """
    try:
        image_data = request.data.get('image', '')
        detect_handwriting = request.data.get('detectHandwriting', False)
        
        if not image_data:
            return Response(
                {'error': 'Image data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If OCR.space API key is available, use it (especially for handwriting)
        if OCR_SPACE_API_KEY and detect_handwriting:
            try:
                # OCR.space expects base64 with data URL prefix
                if ',' not in image_data:
                    # Add data URL prefix if not present
                    image_data = f'data:image/jpeg;base64,{image_data}'
                
                # Make request to OCR.space API
                response = requests.post(
                    OCR_SPACE_API_URL,
                    data={
                        'apikey': OCR_SPACE_API_KEY,
                        'base64Image': image_data,
                        'isTable': False,
                        'OCREngine': 2,  # Engine 2 is better for handwriting
                        'detectOrientation': True,
                        'scale': True,
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get('IsErroredOnProcessing'):
                        error_msg = result.get('ErrorMessage', ['Unknown error'])[0]
                        print(f'OCR.space error: {error_msg}')
                        # Fall back to Gemini
                    else:
                        # Extract text from OCR.space response
                        extracted_text = ''
                        if 'ParsedResults' in result and len(result['ParsedResults']) > 0:
                            extracted_text = result['ParsedResults'][0].get('ParsedText', '')
                        
                        if extracted_text:
                            return Response({
                                'text': extracted_text.strip(),
                                'success': True
                            }, status=status.HTTP_200_OK)
            except Exception as ocr_error:
                print(f'OCR.space failed, falling back to Gemini: {ocr_error}')
                # Fall back to Gemini
        
        # Fall back to Gemini Vision API
        if not GEMINI_API_KEY:
            return Response(
                {'error': 'OCR service not configured on server'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Remove data URL prefix for Gemini
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Gemini prompt for clean text extraction
        prompt = (
            "Extract ALL text from this image. "
            "Return ONLY the extracted text, nothing else. "
            "Do not add any explanations, descriptions, or metadata. "
            "Just return the text exactly as it appears in the image. "
            "Preserve the original formatting and line breaks."
        )
        
        # Make request to Gemini Vision API
        response = requests.post(
            f'{GEMINI_VISION_API_URL}?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{
                    'parts': [
                        {'text': prompt},
                        {
                            'inlineData': {
                                'mimeType': 'image/jpeg',
                                'data': image_data
                            }
                        }
                    ]
                }]
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return Response(
                {'error': f'OCR API error: {response.text}'},
                status=response.status_code
            )
        
        # Parse Gemini response
        result = response.json()
        extracted_text = ''
        
        if 'candidates' in result and len(result['candidates']) > 0:
            candidate = result['candidates'][0]
            if 'content' in candidate and 'parts' in candidate['content']:
                for part in candidate['content']['parts']:
                    if 'text' in part:
                        extracted_text = part['text']
                        break
        
        return Response({
            'text': extracted_text.strip(),
            'success': bool(extracted_text)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_image_with_replicate(request):
    """
    Generate images using Replicate API (ASYNC with predictions)
    Supports FLUX and Stable Diffusion models
    Returns prediction_id immediately for non-blocking operation
    """
    if not REPLICATE_AVAILABLE:
        return Response(
            {'error': 'Replicate library not installed. Install with: pip install replicate'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    if not REPLICATE_API_TOKEN:
        return Response(
            {'error': 'REPLICATE_API_TOKEN not configured in settings'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        prompt = request.data.get('prompt', '')
        model = request.data.get('model', 'flux-schnell')
        width = request.data.get('width', 1024)
        height = request.data.get('height', 1024)
        seed = request.data.get('seed')
        use_async = request.data.get('async', True)  # Default to async
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Model mapping for Replicate
        model_map = {
            'flux-schnell': 'black-forest-labs/flux-schnell',  # Fast & Free
            'flux-dev': 'black-forest-labs/flux-dev',  # Better quality
            'flux-pro': 'black-forest-labs/flux-pro',  # Best (paid)
            'stable-diffusion': 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
            'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        }
        
        replicate_model = model_map.get(model, model_map['flux-schnell'])
        
        # Prepare input based on model type
        input_params = {
            "prompt": prompt,
        }
        
        # FLUX models use aspect_ratio instead of width/height
        if 'flux' in model.lower():
            # Map dimensions to standard aspect ratios
            aspect_ratio_map = {
                (1024, 1024): '1:1',     # Square
                (1024, 768): '4:3',      # Landscape
                (768, 1024): '3:4',      # Portrait (book cover)
                (1024, 1365): '3:4',     # Portrait (book cover)
                (1365, 1024): '4:3',     # Landscape
                (512, 512): '1:1',       # Square
                (512, 683): '3:4',       # Portrait
            }
            aspect_ratio = aspect_ratio_map.get((width, height), '1:1')
            input_params["aspect_ratio"] = aspect_ratio
            # Add num_outputs for flux
            input_params["num_outputs"] = 1
        else:
            # Stable Diffusion models use width/height
            input_params["width"] = width
            input_params["height"] = height
        
        # Add seed if provided
        if seed and seed != -1:
            input_params["seed"] = int(seed)
        
        print(f"🎨 Generating image with Replicate: {replicate_model}")
        print(f"📝 Input params: {input_params}")
        print(f"⚡ Mode: {'ASYNC (non-blocking)' if use_async else 'SYNC (blocking)'}")
        
        # ASYNC MODE: Create prediction and return immediately
        if use_async:
            client = replicate.Client(api_token=REPLICATE_API_TOKEN)
            
            # Create prediction (returns immediately)
            prediction = client.predictions.create(
                version=replicate_model.split(':')[1] if ':' in replicate_model else None,
                input=input_params,
                model=replicate_model.split(':')[0] if ':' not in replicate_model else None
            )
            
            print(f"✅ Prediction created: {prediction.id}")
            print(f"📊 Status: {prediction.status}")
            
            return Response({
                'success': True,
                'prediction_id': prediction.id,
                'status': prediction.status,
                'model': model,
                'provider': 'replicate',
                'async': True
            })
        
        # SYNC MODE (legacy): Block until complete
        else:
            output = replicate.run(replicate_model, input=input_params)
            
            # Handle output (FLUX returns FileOutput objects with url() method)
            image_url = None
            if isinstance(output, list) and len(output) > 0:
                item = output[0]
                # Check if it's a FileOutput object with url method
                if hasattr(item, 'url') and callable(getattr(item, 'url')):
                    image_url = item.url()
                elif isinstance(item, str):
                    image_url = item
                else:
                    image_url = str(item)
            elif isinstance(output, str):
                image_url = output
            elif hasattr(output, 'url') and callable(getattr(output, 'url')):
                image_url = output.url()
            else:
                image_url = str(output) if output else None
            
            if not image_url:
                return Response(
                    {'error': 'No image generated by Replicate'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            print(f"✅ Image generated: {image_url}")
            
            return Response({
                'success': True,
                'imageUrl': str(image_url),
                'model': model,
                'provider': 'replicate',
                'async': False
            })
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Replicate error: {error_msg}")
        
        # Handle rate limit errors specifically
        if '429' in error_msg or 'rate limit' in error_msg.lower() or 'throttled' in error_msg.lower():
            return Response(
                {'error': 'Replicate rate limit reached. Please wait a moment.', 'code': 'RATE_LIMIT'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        return Response(
            {'error': f'Replicate generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_image_with_pollinations(request):
    """
    Proxy endpoint for Pollinations AI image generation
    Returns a backend proxy URL that will stream the image with authentication
    Now uses Flux model (no rate limits)
    """
    if not POLLINATIONS_API_KEY:
        return Response(
            {'error': 'Pollinations API not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        prompt = request.data.get('prompt', '')
        width = request.data.get('width', 512)
        height = request.data.get('height', 512)
        model = request.data.get('model', 'flux')  # Changed to flux model (no rate limits)
        seed = request.data.get('seed', None)
        nologo = request.data.get('nologo', True)
        enhance = request.data.get('enhance', True)
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build parameters
        params = {
            'width': width,
            'height': height,
            'model': model,
            'nologo': str(nologo).lower(),
            'enhance': str(enhance).lower()
        }
        
        if seed:
            params['seed'] = seed
        
        # Encode parameters for the proxy URL
        from urllib.parse import quote, urlencode
        encoded_prompt = quote(prompt)
        query_string = urlencode(params)
        
        # Return a URL to OUR backend proxy endpoint that will fetch and stream the image
        # This allows us to add the API key in the Authorization header
        proxy_url = f"/api/ai/pollinations/fetch-image/?prompt={encoded_prompt}&{query_string}"
        
        print(f"[Pollinations] Generated proxy URL")
        print(f"[Pollinations] Prompt: {prompt[:80]}...")
        print(f"[Pollinations] Model: {model}, Size: {width}x{height}")
        
        return Response({
            'success': True,
            'imageUrl': proxy_url,  # Return relative URL to our proxy
            'message': 'Image proxy URL generated successfully'
        })
    
    except Exception as e:
        return Response(
            {'error': f'Image generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([])  # No authentication required for image fetching
def fetch_pollinations_image(request):
    """
    Fetch and stream image from Pollinations with API key authentication
    This endpoint acts as a proxy to add Authorization header
    Now uses Flux model (no rate limits)
    """
    if not POLLINATIONS_API_KEY:
        return Response(
            {'error': 'Pollinations API not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        # Get parameters from query string
        prompt = request.GET.get('prompt', '')
        width = request.GET.get('width', '512')
        height = request.GET.get('height', '512')
        model = request.GET.get('model', 'flux')  # Changed to flux model (no rate limits)
        seed = request.GET.get('seed', None)
        nologo = request.GET.get('nologo', 'true')
        enhance = request.GET.get('enhance', 'true')
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build Pollinations URL
        params = {
            'width': width,
            'height': height,
            'model': model,
            'nologo': nologo,
            'enhance': enhance
        }
        
        if seed:
            params['seed'] = seed
        
        from urllib.parse import urlencode, quote
        
        # Pollinations API accepts the key via X-API-Key header
        # According to docs: Use X-API-Key header for authentication
        query_string = urlencode(params)
        pollinations_url = f"{POLLINATIONS_API_URL}/{quote(prompt)}?{query_string}"
        
        # Send API key in X-API-Key header (as per Pollinations docs)
        headers = {
            'X-API-Key': POLLINATIONS_API_KEY,
            'Accept': 'image/*',
            'User-Agent': 'PixelTales/1.0'
        }
        
        print(f"[Pollinations] ========================================")
        print(f"[Pollinations] Fetching image from Pollinations AI...")
        print(f"[Pollinations] Model: {model} (Flux = Always Free!)")
        print(f"[Pollinations] Size: {width}x{height}")
        print(f"[Pollinations] API Key: {POLLINATIONS_API_KEY[:20]}..." if POLLINATIONS_API_KEY else "None")
        print(f"[Pollinations] URL (truncated): {pollinations_url[:150]}...")
        print(f"[Pollinations] ========================================")
        
        response = requests.get(pollinations_url, headers=headers, timeout=60, stream=True)
        
        print(f"[Pollinations] Response Status: {response.status_code}")
        print(f"[Pollinations] Content-Type: {response.headers.get('Content-Type', 'unknown')}")
        
        # If not successful, log error details
        if response.status_code != 200:
            try:
                error_body = response.text[:500]
                print(f"[Pollinations] ❌ Error Response: {error_body}")
            except:
                print(f"[Pollinations] ❌ Could not read error response")
        
        if response.status_code == 200:
            # Stream the image data back to the client
            from django.http import StreamingHttpResponse
            
            def image_generator():
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
            
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            streaming_response = StreamingHttpResponse(image_generator(), content_type=content_type)
            streaming_response['Cache-Control'] = 'max-age=3600'  # Cache for 1 hour
            
            print(f"[Pollinations] ✅ Image fetched and streaming to client")
            return streaming_response
        else:
            print(f"[Pollinations] ❌ Failed: {response.status_code}")
            return Response(
                {'error': f'Failed to fetch image: {response.status_code}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except requests.Timeout:
        print(f"[Pollinations] ⏱️ Timeout fetching image")
        return Response(
            {'error': 'Image generation timeout - please try again'},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except Exception as e:
        print(f"[Pollinations] ❌ Error: {str(e)}")
        return Response(
            {'error': f'Failed to fetch image: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_image_with_gemini(request):
    """
    Generate image using Gemini 2.5 Flash Image model
    Returns base64 encoded image data
    """
    if not GEMINI_API_KEY:
        return Response(
            {'error': 'Gemini API not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        prompt = request.data.get('prompt', '')
        
        if not prompt:
            return Response(
                {'error': 'Prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[Gemini Image] ========================================")
        print(f"[Gemini Image] Generating image with Gemini 2.5 Flash Image...")
        print(f"[Gemini Image] Prompt: {prompt[:100]}...")
        print(f"[Gemini Image] ========================================")
        
        # Make request to Gemini Image API
        response = requests.post(
            f'{GEMINI_IMAGE_API_URL}?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json={
                'contents': [{
                    'parts': [{'text': prompt}]
                }]
            },
            timeout=60
        )
        
        print(f"[Gemini Image] Response Status: {response.status_code}")
        
        if response.status_code != 200:
            error_msg = response.text[:500]
            print(f"[Gemini Image] ❌ Error: {error_msg}")
            return Response(
                {'error': f'Gemini Image API error: {response.text}'},
                status=response.status_code
            )
        
        # Parse response to extract image
        result = response.json()
        
        if 'candidates' in result and len(result['candidates']) > 0:
            candidate = result['candidates'][0]
            if 'content' in candidate and 'parts' in candidate['content']:
                for part in candidate['content']['parts']:
                    if 'inlineData' in part:
                        # Found the image data
                        image_data = part['inlineData']['data']
                        mime_type = part['inlineData'].get('mimeType', 'image/png')
                        
                        # Convert to data URL
                        data_url = f"data:{mime_type};base64,{image_data}"
                        
                        print(f"[Gemini Image] ✅ Image generated successfully ({len(image_data)} bytes)")
                        
                        return Response({
                            'success': True,
                            'imageUrl': data_url,
                            'message': 'Image generated successfully with Gemini'
                        }, status=status.HTTP_200_OK)
        
        # If we get here, no image was found in response
        print(f"[Gemini Image] ❌ No image in response")
        return Response(
            {'error': 'No image returned from Gemini API'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    except requests.Timeout:
        print(f"[Gemini Image] ⏱️ Timeout")
        return Response(
            {'error': 'Image generation timeout - please try again'},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except Exception as e:
        print(f"[Gemini Image] ❌ Error: {str(e)}")
        return Response(
            {'error': f'Image generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_replicate_prediction_status(request):
    """
    Get the status of a Replicate prediction by ID
    Polls prediction status without blocking
    """
    if not REPLICATE_AVAILABLE:
        return Response(
            {'error': 'Replicate library not installed'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    if not REPLICATE_API_TOKEN:
        return Response(
            {'error': 'REPLICATE_API_TOKEN not configured'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        prediction_id = request.GET.get('prediction_id')
        
        if not prediction_id:
            return Response(
                {'error': 'prediction_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get prediction status
        client = replicate.Client(api_token=REPLICATE_API_TOKEN)
        prediction = client.predictions.get(prediction_id)
        
        print(f"📊 Prediction {prediction_id[:8]}... status: {prediction.status}")
        
        # Prepare response
        response_data = {
            'prediction_id': prediction.id,
            'status': prediction.status,  # starting, processing, succeeded, failed, canceled
        }
        
        # If succeeded, include the output URL
        if prediction.status == 'succeeded' and prediction.output:
            output = prediction.output
            image_url = None
            
            # Handle output (FLUX returns FileOutput objects or list)
            if isinstance(output, list) and len(output) > 0:
                item = output[0]
                if hasattr(item, 'url') and callable(getattr(item, 'url')):
                    image_url = item.url()
                elif isinstance(item, str):
                    image_url = item
                else:
                    image_url = str(item)
            elif isinstance(output, str):
                image_url = output
            elif hasattr(output, 'url') and callable(getattr(output, 'url')):
                image_url = output.url()
            else:
                image_url = str(output) if output else None
            
            if image_url:
                response_data['imageUrl'] = str(image_url)
                print(f"✅ Image ready: {image_url}")
        
        # If failed, include error details
        elif prediction.status == 'failed':
            response_data['error'] = prediction.error if hasattr(prediction, 'error') else 'Unknown error'
            print(f"❌ Prediction failed: {response_data['error']}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error checking prediction: {str(e)}")
        return Response(
            {'error': f'Failed to check prediction: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_ai_service_status(request):
    """
    Check if AI services are configured and available
    """
    return Response({
        'gemini_available': bool(GEMINI_API_KEY),
        'gemini_image_available': bool(GEMINI_API_KEY),
        'ocr_available': bool(GEMINI_API_KEY),
        'pollinations_available': bool(POLLINATIONS_API_KEY),
        'replicate_available': bool(REPLICATE_API_TOKEN and REPLICATE_AVAILABLE),
    }, status=status.HTTP_200_OK)



