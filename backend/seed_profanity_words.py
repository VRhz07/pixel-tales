"""
Script to seed the database with initial profanity words
Run this after running migrations: python seed_profanity_words.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import ProfanityWord

# Default profanity words to seed
ENGLISH_WORDS = [
    'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
    'crap', 'piss', 'dick', 'cock', 'pussy', 'whore', 'slut',
    'fag', 'nigger', 'nigga', 'retard', 'stupid', 'idiot',
    'dumb', 'moron', 'imbecile', 'jackass', 'asshole', 'tits', 'boobs',
]

TAGALOG_WORDS = [
    'putang ina', 'putangina', 'puta', 'gago', 'tanga',
    'bobo', 'ulol', 'tarantado', 'peste',
    'leche', 'yawa', 'tangina', 'buwisit', 'punyeta',
    'hinayupak', 'kingina', 'pokpok', 'shunga', 'inutil',
    'walang kwenta', 'walang hiya', 'kupal', 'tamod', 'puday', 'tite', 'betlog',
    'utong', 'pukingina', 'kantot', 'kinakantot', 'chupa', 'tsupa',
]

def seed_profanity_words():
    """Seed the database with initial profanity words"""
    
    print("🌱 Seeding profanity words...")
    
    added_count = 0
    skipped_count = 0
    
    # Add English words
    for word in ENGLISH_WORDS:
        word_lower = word.lower().strip()
        if not ProfanityWord.objects.filter(word=word_lower).exists():
            ProfanityWord.objects.create(
                word=word_lower,
                language='en',
                severity='moderate',
                is_active=True
            )
            added_count += 1
            print(f"  ✅ Added: {word_lower} (English)")
        else:
            skipped_count += 1
            print(f"  ⏭️  Skipped: {word_lower} (already exists)")
    
    # Add Tagalog words
    for word in TAGALOG_WORDS:
        word_lower = word.lower().strip()
        if not ProfanityWord.objects.filter(word=word_lower).exists():
            ProfanityWord.objects.create(
                word=word_lower,
                language='tl',
                severity='moderate',
                is_active=True
            )
            added_count += 1
            print(f"  ✅ Added: {word_lower} (Tagalog)")
        else:
            skipped_count += 1
            print(f"  ⏭️  Skipped: {word_lower} (already exists)")
    
    print(f"\n✅ Seeding complete!")
    print(f"   Added: {added_count} words")
    print(f"   Skipped: {skipped_count} words")
    print(f"   Total in database: {ProfanityWord.objects.count()} words")

if __name__ == '__main__':
    seed_profanity_words()
