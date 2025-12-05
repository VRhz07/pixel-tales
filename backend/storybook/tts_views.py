"""
Text-to-Speech API Views
"""
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from .tts_service import get_tts_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def synthesize_speech(request):
    """
    Synthesize speech from text using Google Cloud TTS
    
    POST /api/tts/synthesize/
    
    Request body:
    {
        "text": "Text to synthesize",
        "language": "en" or "fil",
        "gender": "female" or "male",
        "rate": 1.0,
        "pitch": 0.0,
        "volume": 0.0
    }
    
    Returns:
        Audio file (MP3) or error response
    """
    try:
        # Get parameters
        text = request.data.get('text', '').strip()
        language = request.data.get('language', 'en')
        gender = request.data.get('gender', 'female')
        rate = float(request.data.get('rate', 1.0))
        pitch = float(request.data.get('pitch', 0.0))
        volume = float(request.data.get('volume', 0.0))
        
        # Validate text
        if not text:
            return Response({
                'error': 'Text is required'
            }, status=400)
        
        if len(text) > 5000:
            return Response({
                'error': 'Text too long (max 5000 characters)'
            }, status=400)
        
        # Get TTS service
        tts_service = get_tts_service()
        
        # Check if service is available
        if not tts_service.is_available():
            return Response({
                'error': 'TTS service not available',
                'fallback': True
            }, status=503)
        
        logger.info(f"🎤 TTS request: {len(text)} chars, lang: {language}, gender: {gender}")
        
        # Synthesize speech
        audio_content = tts_service.synthesize_speech(
            text=text,
            language=language,
            gender=gender,
            rate=rate,
            pitch=pitch,
            volume=volume
        )
        
        # Return audio as response
        response = HttpResponse(audio_content, content_type='audio/mpeg')
        response['Content-Disposition'] = 'inline; filename="speech.mp3"'
        response['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
        
        logger.info(f"✅ TTS response sent: {len(audio_content)} bytes")
        return response
        
    except ValueError as e:
        logger.error(f"❌ TTS validation error: {e}")
        return Response({
            'error': str(e)
        }, status=400)
        
    except Exception as e:
        logger.error(f"❌ TTS synthesis error: {e}")
        return Response({
            'error': 'Failed to synthesize speech',
            'details': str(e),
            'fallback': True
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_available_voices(request):
    """
    Get list of available voices
    
    GET /api/tts/voices/
    
    Returns:
        {
            "voices": {
                "en": {"female": "...", "male": "..."},
                "fil": {"female": "...", "male": "..."}
            }
        }
    """
    try:
        tts_service = get_tts_service()
        voices = tts_service.get_available_voices()
        
        return Response({
            'voices': voices,
            'available': tts_service.is_available()
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting voices: {e}")
        return Response({
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_tts_status(request):
    """
    Check if TTS service is available
    
    GET /api/tts/status/
    
    Returns:
        {
            "available": true/false,
            "service": "google-cloud-tts"
        }
    """
    try:
        tts_service = get_tts_service()
        
        return Response({
            'available': tts_service.is_available(),
            'service': 'google-cloud-tts',
            'voices': {
                'en': ['female', 'male'],
                'fil': ['female', 'male']
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error checking TTS status: {e}")
        return Response({
            'available': False,
            'error': str(e)
        }, status=500)
