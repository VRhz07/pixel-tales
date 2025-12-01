#!/usr/bin/env python
"""
Quick script to import profanity words on Render
Run this in Render Shell: python render_import_profanity.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import ProfanityWord
import json

print("=" * 60)
print("🚀 RENDER PROFANITY WORD IMPORT")
print("=" * 60)

# Check current status
current_count = ProfanityWord.objects.count()
print(f"\n📊 Current words in database: {current_count}")

# Import from file
filename = 'profanity_words_export.json'
if not os.path.exists(filename):
    print(f"\n❌ Error: {filename} not found!")
    print(f"   Current directory: {os.getcwd()}")
    print(f"   Files here: {os.listdir('.')[:10]}")
    exit(1)

print(f"\n✅ Found {filename}")

with open(filename, 'r', encoding='utf-8') as f:
    data = json.load(f)

words_data = data.get('words', [])
print(f"📋 Words in export file: {len(words_data)}")

added = 0
updated = 0
skipped = 0

for word_data in words_data:
    word_text = word_data['word'].lower().strip()
    
    existing = ProfanityWord.objects.filter(word=word_text).first()
    
    if existing:
        needs_update = (
            existing.language != word_data['language'] or
            existing.severity != word_data['severity'] or
            existing.is_active != word_data['is_active']
        )
        
        if needs_update:
            existing.language = word_data['language']
            existing.severity = word_data['severity']
            existing.is_active = word_data['is_active']
            existing.save()
            updated += 1
        else:
            skipped += 1
    else:
        ProfanityWord.objects.create(
            word=word_text,
            language=word_data['language'],
            severity=word_data['severity'],
            is_active=word_data['is_active']
        )
        added += 1

print("\n" + "=" * 60)
print("✅ IMPORT COMPLETE!")
print("=" * 60)
print(f"➕ Added: {added} words")
print(f"🔄 Updated: {updated} words")
print(f"⏭️  Skipped: {skipped} words (already up to date)")
print(f"📊 Total in database: {ProfanityWord.objects.count()} words")
print("=" * 60)
