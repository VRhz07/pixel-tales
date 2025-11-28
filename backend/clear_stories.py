#!/usr/bin/env python
"""
Script to clear all stories from the database
Run with: python clear_stories.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Delete all stories
story_count = Story.objects.count()
print(f"Found {story_count} stories in database")

if story_count > 0:
    confirm = input(f"Are you sure you want to delete all {story_count} stories? (yes/no): ")
    if confirm.lower() == 'yes':
        Story.objects.all().delete()
        print(f"✅ Deleted all {story_count} stories!")
    else:
        print("❌ Cancelled")
else:
    print("No stories to delete")
