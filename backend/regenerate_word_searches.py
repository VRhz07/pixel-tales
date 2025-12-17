#!/usr/bin/env python
"""
Manual script to regenerate word search games
Run this if word searches are missing after deployment
Usage: python regenerate_word_searches.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story, StoryGame, GameQuestion
from storybook.game_service import GameGenerationService

def regenerate_word_searches():
    """Regenerate all word search games for published stories"""
    print("🎮 Word Search Game Regeneration Script")
    print("=" * 60)
    
    # Get all published stories
    published_stories = Story.objects.filter(is_published=True)
    total_stories = published_stories.count()
    
    if total_stories == 0:
        print("⚠️  No published stories found!")
        return
    
    print(f"📚 Found {total_stories} published stories\n")
    
    # Check current word search games
    existing_ws = StoryGame.objects.filter(game_type='word_search').count()
    print(f"📊 Current word search games: {existing_ws}\n")
    
    if existing_ws > 0:
        response = input(f"⚠️  Delete {existing_ws} existing word search games and regenerate? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Operation cancelled")
            return
        
        # Delete existing word searches
        print(f"\n🗑️  Deleting {existing_ws} existing word search games...")
        deleted = StoryGame.objects.filter(game_type='word_search').delete()
        print(f"✅ Deleted {deleted[0]} word search games\n")
    
    # Generate word searches
    print("🔄 Generating new word search games...\n")
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    for i, story in enumerate(published_stories, 1):
        try:
            # Extract story text
            story_text = GameGenerationService._extract_story_text(story)
            
            if not story_text or len(story_text) < 100:
                print(f"[{i}/{total_stories}] ⏭️  {story.title}: Content too short, skipping")
                skipped_count += 1
                continue
            
            # Generate word search
            word_search_game = GameGenerationService._generate_word_search_game(story, story_text)
            
            if word_search_game:
                question_count = word_search_game.questions.count()
                print(f"[{i}/{total_stories}] ✅ {story.title}: Created word search ({question_count} question)")
                success_count += 1
            else:
                print(f"[{i}/{total_stories}] ❌ {story.title}: Failed to generate word search")
                error_count += 1
                
        except Exception as e:
            print(f"[{i}/{total_stories}] ❌ {story.title}: Error - {str(e)}")
            error_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"✅ Successfully generated: {success_count}")
    print(f"⏭️  Skipped (too short): {skipped_count}")
    print(f"❌ Failed: {error_count}")
    print("=" * 60)
    
    # Verify final count
    final_count = StoryGame.objects.filter(game_type='word_search').count()
    print(f"\n📊 Total word search games now: {final_count}")
    
    if final_count > 0:
        # Show sample
        sample = StoryGame.objects.filter(game_type='word_search').first()
        if sample:
            words_count = sample.questions.count()
            print(f"✅ Sample game for '{sample.story.title}': {words_count} question(s)")
            print("🎉 Word search games successfully regenerated!")
    else:
        print("⚠️  No word search games were created. Check if stories have enough content.")

if __name__ == '__main__':
    try:
        regenerate_word_searches()
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
