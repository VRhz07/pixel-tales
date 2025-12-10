"""
Google Cloud Text-to-Speech Service
Provides high-quality voice synthesis for storytelling
"""
import os
import logging
from django.core.cache import cache

# Try to import Google Cloud TTS, but make it optional
try:
    from google.cloud import texttospeech
    GOOGLE_TTS_AVAILABLE = True
except ImportError:
    GOOGLE_TTS_AVAILABLE = False
    texttospeech = None

logger = logging.getLogger(__name__)


class TTSService:
    """
    Text-to-Speech service using Google Cloud TTS
    """
    
    # Available voices with English (US) and Filipino (Tagalog) accents
    # Using Neural2 voices for best quality and natural sound
    # These are premium voices but still within the 1 million character FREE tier per month!
    VOICES = {
        'female_english': {
            'name': 'en-US-Wavenet-F',  # High-quality WaveNet female voice
            'language_code': 'en-US',
            'label': 'Female (US English)',
            'accent': 'english',
            'description': 'Natural US English female voice'
        },
        'female_filipino': {
            'name': 'fil-PH-Wavenet-A',  # Best Filipino female voice
            'language_code': 'fil-PH',
            'label': 'Female (Filipino Tagalog)',
            'accent': 'filipino',
            'description': 'Native Filipino/Tagalog female voice'
        },
        'male_english': {
            'name': 'en-US-Wavenet-D',  # High-quality WaveNet male voice
            'language_code': 'en-US',
            'label': 'Male (US English)',
            'accent': 'english',
            'description': 'Natural US English male voice'
        },
        'male_filipino': {
            'name': 'fil-PH-Wavenet-D',  # Best Filipino male voice
            'language_code': 'fil-PH',
            'label': 'Male (Filipino Tagalog)',
            'accent': 'filipino',
            'description': 'Native Filipino/Tagalog male voice'
        }
    }
    
    def __init__(self):
        """Initialize the TTS client"""
        if not GOOGLE_TTS_AVAILABLE:
            logger.warning("⚠️ Google Cloud TTS library not installed")
            self.client = None
            return
            
        try:
            self.client = texttospeech.TextToSpeechClient()
            logger.info("✅ Google Cloud TTS client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Google Cloud TTS client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return self.client is not None
    
    def get_voice_config(self, voice_id: str = None, language: str = 'en') -> dict:
        """
        Get the voice configuration based on voice ID or fallback to language
        
        Args:
            voice_id: Voice identifier (e.g., 'female_english', 'male_filipino')
            language: Fallback language if voice_id not provided ('en' or 'fil')
            
        Returns:
            Dictionary with voice configuration
        """
        # If voice_id is provided and valid, use it
        if voice_id and voice_id in self.VOICES:
            config = self.VOICES[voice_id]
            logger.info(f"🎤 Selected voice: {config['name']} ({config['label']})")
            return config
        
        # Fallback: Auto-select based on language
        lang = 'fil' if language in ['tl', 'fil', 'fil-PH'] else 'en'
        fallback_voice_id = f'female_{lang}lish' if lang == 'en' else 'female_filipino'
        
        if fallback_voice_id in self.VOICES:
            config = self.VOICES[fallback_voice_id]
            logger.info(f"🎤 Fallback voice: {config['name']} ({config['label']})")
            return config
        
        # Ultimate fallback
        config = self.VOICES['female_english']
        logger.warning(f"⚠️ Using default voice: {config['name']}")
        return config
    
    def synthesize_speech(
        self,
        text: str,
        voice_id: str = None,
        language: str = 'en',
        rate: float = 1.0,
        pitch: float = 0.0,
        volume: float = 0.0
    ) -> bytes:
        """
        Synthesize speech from text using Google Cloud TTS
        
        Args:
            text: Text to synthesize
            voice_id: Voice identifier (e.g., 'female_english', 'male_filipino')
            language: Fallback language 'en' or 'fil' (used if voice_id not provided)
            rate: Speaking rate (0.25 to 4.0, default 1.0)
            pitch: Voice pitch (-20.0 to 20.0, default 0.0)
            volume: Volume gain in dB (-96.0 to 16.0, default 0.0)
            
        Returns:
            Audio content as bytes (MP3 format)
            
        Raises:
            Exception if synthesis fails
        """
        if not self.client:
            raise Exception("Google Cloud TTS client not initialized")
        
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Get voice configuration
        voice_config = self.get_voice_config(voice_id, language)
        voice_name = voice_config['name']
        language_code = voice_config['language_code']
        
        try:
            # Set the text input to be synthesized
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name,
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL  # Let the voice name determine gender
            )
            
            # Select the audio config
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=max(0.25, min(4.0, rate)),  # Clamp between 0.25 and 4.0
                pitch=max(-20.0, min(20.0, pitch)),        # Clamp between -20 and 20
                volume_gain_db=max(-96.0, min(16.0, volume))  # Clamp between -96 and 16
            )
            
            logger.info(f"🎙️ Synthesizing speech:")
            logger.info(f"   - Text: {len(text)} characters")
            logger.info(f"   - Voice: {voice_name} ({voice_config['label']})")
            logger.info(f"   - Language: {language_code}")
            logger.info(f"   - Voice ID: {voice_id}")
            logger.info(f"   - Description: {voice_config.get('description', 'N/A')}")
            logger.info(f"   - Rate: {rate}, Pitch: {pitch}, Volume: {volume}")
            
            # Verify we're using the right voice type
            if voice_id and 'english' in voice_id and 'Neural2' not in voice_name:
                logger.warning(f"⚠️ Expected Neural2 voice for English, but got: {voice_name}")
            if voice_id and 'filipino' in voice_id and 'fil-PH' not in language_code:
                logger.warning(f"⚠️ Expected fil-PH language code for Filipino, but got: {language_code}")
            
            # Perform the text-to-speech request
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            logger.info(f"✅ Speech synthesis successful: {len(response.audio_content)} bytes")
            return response.audio_content
            
        except Exception as e:
            logger.error(f"❌ Speech synthesis failed: {e}")
            raise
    
    def get_available_voices(self):
        """
        Get list of available voices
        
        Returns:
            Dictionary of available voices by language and gender
        """
        return self.VOICES


# Singleton instance
_tts_service = None

def get_tts_service() -> TTSService:
    """Get the singleton TTS service instance"""
    global _tts_service
    if not GOOGLE_TTS_AVAILABLE:
        logger.warning("⚠️ Google Cloud TTS not available")
        return None
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
