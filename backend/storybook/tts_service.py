"""
Google Cloud Text-to-Speech Service
Provides high-quality voice synthesis for storytelling
"""
import os
import logging
from google.cloud import texttospeech
from django.core.cache import cache

logger = logging.getLogger(__name__)


class TTSService:
    """
    Text-to-Speech service using Google Cloud TTS
    """
    
    # Available voices for each language and gender
    VOICES = {
        'en': {
            'female': 'en-US-Neural2-C',  # Natural, clear female voice
            'male': 'en-US-Neural2-D',    # Natural, clear male voice
        },
        'fil': {
            'female': 'fil-PH-Wavenet-A',  # Natural Filipino female voice
            'male': 'fil-PH-Wavenet-C',    # Natural Filipino male voice
        }
    }
    
    def __init__(self):
        """Initialize the TTS client"""
        try:
            self.client = texttospeech.TextToSpeechClient()
            logger.info("✅ Google Cloud TTS client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Google Cloud TTS client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return self.client is not None
    
    def get_voice_name(self, language: str, gender: str) -> str:
        """
        Get the appropriate voice name based on language and gender
        
        Args:
            language: 'en' or 'fil' (Tagalog)
            gender: 'female' or 'male'
            
        Returns:
            Voice name string
        """
        # Normalize language code
        lang = 'fil' if language in ['tl', 'fil', 'fil-PH'] else 'en'
        
        # Normalize gender
        gender = gender.lower() if gender else 'female'
        if gender not in ['male', 'female']:
            gender = 'female'
        
        voice = self.VOICES.get(lang, {}).get(gender)
        logger.info(f"🎤 Selected voice: {voice} (language: {lang}, gender: {gender})")
        return voice
    
    def synthesize_speech(
        self,
        text: str,
        language: str = 'en',
        gender: str = 'female',
        rate: float = 1.0,
        pitch: float = 0.0,
        volume: float = 0.0
    ) -> bytes:
        """
        Synthesize speech from text using Google Cloud TTS
        
        Args:
            text: Text to synthesize
            language: 'en' or 'fil'
            gender: 'female' or 'male'
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
        
        # Get voice name
        voice_name = self.get_voice_name(language, gender)
        language_code = 'fil-PH' if language in ['tl', 'fil', 'fil-PH'] else 'en-US'
        
        try:
            # Set the text input to be synthesized
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name
            )
            
            # Select the audio config
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=max(0.25, min(4.0, rate)),  # Clamp between 0.25 and 4.0
                pitch=max(-20.0, min(20.0, pitch)),        # Clamp between -20 and 20
                volume_gain_db=max(-96.0, min(16.0, volume))  # Clamp between -96 and 16
            )
            
            logger.info(f"🎙️ Synthesizing speech: {len(text)} characters, voice: {voice_name}")
            
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
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
