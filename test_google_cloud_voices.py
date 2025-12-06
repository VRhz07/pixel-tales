"""
Test script to verify Google Cloud TTS voices
Run this to test if the voices sound natural and correct
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
import django
django.setup()

from storybook.tts_service import get_tts_service

def test_voices():
    """Test all configured voices"""
    tts = get_tts_service()
    
    if not tts.is_available():
        print("❌ Google Cloud TTS is not available. Please check your credentials.")
        print("\nMake sure you have:")
        print("1. GOOGLE_APPLICATION_CREDENTIALS environment variable set")
        print("2. Valid Google Cloud service account JSON file")
        print("3. Text-to-Speech API enabled in your Google Cloud project")
        return
    
    print("✅ Google Cloud TTS is available!\n")
    print("=" * 70)
    print("CONFIGURED VOICES")
    print("=" * 70)
    
    for voice_id, config in tts.VOICES.items():
        print(f"\nVoice ID: {voice_id}")
        print(f"  Name: {config['name']}")
        print(f"  Language: {config['language_code']}")
        print(f"  Label: {config['label']}")
        print(f"  Description: {config['description']}")
    
    print("\n" + "=" * 70)
    print("TESTING VOICES")
    print("=" * 70)
    
    # Test phrases
    test_phrases = {
        'female_english': "Hello! This is a natural sounding female voice in US English. I hope you enjoy listening to this story.",
        'male_english': "Hello! This is a natural sounding male voice in US English. I hope you enjoy listening to this story.",
        'female_filipino': "Kamusta! Ako ay isang natural na tunog ng babaeng boses sa Filipino. Sana ay magsaya ka sa pakikinig ng kuwentong ito.",
        'male_filipino': "Kamusta! Ako ay isang natural na tunog ng lalaking boses sa Filipino. Sana ay magsaya ka sa pakikinig ng kuwentong ito."
    }
    
    print("\nGenerating audio files for each voice...")
    print("Files will be saved in the current directory.\n")
    
    for voice_id, phrase in test_phrases.items():
        try:
            print(f"🎤 Testing {voice_id}...")
            audio_content = tts.synthesize_speech(
                text=phrase,
                voice_id=voice_id,
                rate=1.0,
                pitch=0.0,
                volume=0.0
            )
            
            # Save to file
            filename = f"test_voice_{voice_id}.mp3"
            with open(filename, 'wb') as f:
                f.write(audio_content)
            
            print(f"   ✅ Generated: {filename} ({len(audio_content)} bytes)")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 70)
    print("VOICE RECOMMENDATIONS")
    print("=" * 70)
    print("""
For US English stories:
  👩 Female: Use 'female_english' (Natural, warm, expressive)
  👨 Male: Use 'male_english' (Natural, clear, engaging)

For Filipino/Tagalog stories:
  👩 Female: Use 'female_filipino' (Native Filipino speaker)
  👨 Male: Use 'male_filipino' (Native Filipino speaker)

All voices use Google's premium Neural2 and WaveNet technology.
These provide the most natural and human-like speech quality.
    """)
    
    print("\n✨ Test complete! Play the generated MP3 files to hear each voice.")
    print("💡 Tip: Compare them side-by-side to choose your favorite!")

if __name__ == '__main__':
    test_voices()
