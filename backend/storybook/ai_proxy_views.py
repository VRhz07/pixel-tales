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
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
GEMINI_API_KEY = settings.GOOGLE_AI_API_KEY


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
        vision_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
        response = requests.post(
            f'{vision_url}?key={GEMINI_API_KEY}',
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
    Uses Gemini Vision API as primary method
    """
    if not GEMINI_API_KEY:
        return Response(
            {'error': 'OCR service not configured on server'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        image_data = request.data.get('image', '')
        detect_handwriting = request.data.get('detectHandwriting', False)
        
        if not image_data:
            return Response(
                {'error': 'Image data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Different prompts for handwriting vs printed text
        if detect_handwriting:
            prompt = (
                "Extract all handwritten and printed text from this image. "
                "Preserve the original formatting and structure as much as possible. "
                "If there's handwriting, transcribe it carefully."
            )
        else:
            prompt = (
                "Extract all text from this image. "
                "Preserve the original formatting and structure as much as possible."
            )
        
        # Make request to Gemini Vision API
        vision_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
        response = requests.post(
            f'{vision_url}?key={GEMINI_API_KEY}',
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
            'text': extracted_text,
            'success': bool(extracted_text)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Server error: {str(e)}'},
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
        'ocr_available': bool(GEMINI_API_KEY),
    }, status=status.HTTP_200_OK)
