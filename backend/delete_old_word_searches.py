"""
Delete Old Word Search Games Script
This script deletes all existing word search games so they can be regenerated
with the new child-friendly 8x8 format (instead of old 12x12 format)

Run this on your Render backend to update all word searches.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import StoryGame, GameQuestion, GameAnswer, GameAttempt


def delete_old_word_searches():
    """Delete all existing word search games"""
    
    print("🔍 Finding old word search games...")
    
    # Get all word search games
    word_search_games = StoryGame.objects.filter(game_type='word_search')
    
    if not word_search_games.exists():
        print("✅ No word search games found. Nothing to delete.")
        return
    
    total_games = word_search_games.count()
    print(f"📊 Found {total_games} word search games")
    
    # Count related data that will be deleted
    total_questions = GameQuestion.objects.filter(game__in=word_search_games).count()
    total_attempts = GameAttempt.objects.filter(game__in=word_search_games).count()
    total_answers = GameAnswer.objects.filter(attempt__game__in=word_search_games).count()
    
    print(f"📝 This will delete:")
    print(f"   - {total_games} word search games")
    print(f"   - {total_questions} questions")
    print(f"   - {total_attempts} game attempts")
    print(f"   - {total_answers} answers")
    
    # Ask for confirmation
    print("\n⚠️  WARNING: This action cannot be undone!")
    print("Players will lose their word search progress, but can replay with the new format.")
    confirmation = input("\nType 'DELETE' to confirm: ")
    
    if confirmation != 'DELETE':
        print("❌ Deletion cancelled.")
        return
    
    print("\n🗑️  Deleting old word search games...")
    
    # Delete game answers first (due to foreign key constraints)
    deleted_answers = GameAnswer.objects.filter(attempt__game__in=word_search_games).delete()
    print(f"   ✓ Deleted {deleted_answers[0]} answers")
    
    # Delete game attempts
    deleted_attempts = GameAttempt.objects.filter(game__in=word_search_games).delete()
    print(f"   ✓ Deleted {deleted_attempts[0]} attempts")
    
    # Delete questions
    deleted_questions = GameQuestion.objects.filter(game__in=word_search_games).delete()
    print(f"   ✓ Deleted {deleted_questions[0]} questions")
    
    # Delete games
    deleted_games = word_search_games.delete()
    print(f"   ✓ Deleted {deleted_games[0]} games")
    
    print("\n✅ All old word search games have been deleted!")
    print("💡 New word searches will be generated automatically with the 8x8 format")
    print("   when users next access a story's games page.")


def delete_and_regenerate_word_searches():
    """Delete old word searches and regenerate them immediately"""
    from storybook.models import Story
    from storybook.game_service import GameGenerationService
    
    print("🔍 Finding old word search games...")
    
    # Get all word search games and their associated stories
    word_search_games = StoryGame.objects.filter(game_type='word_search')
    
    if not word_search_games.exists():
        print("✅ No word search games found. Nothing to delete.")
        return
    
    # Get unique stories with word searches
    story_ids = word_search_games.values_list('story_id', flat=True).distinct()
    stories = Story.objects.filter(id__in=story_ids)
    
    total_games = word_search_games.count()
    total_stories = stories.count()
    
    print(f"📊 Found {total_games} word search games across {total_stories} stories")
    
    # Count related data
    total_questions = GameQuestion.objects.filter(game__in=word_search_games).count()
    total_attempts = GameAttempt.objects.filter(game__in=word_search_games).count()
    total_answers = GameAnswer.objects.filter(attempt__game__in=word_search_games).count()
    
    print(f"📝 This will delete:")
    print(f"   - {total_games} word search games")
    print(f"   - {total_questions} questions")
    print(f"   - {total_attempts} game attempts")
    print(f"   - {total_answers} answers")
    print(f"\n🔄 And regenerate {total_stories} new word searches")
    
    # Ask for confirmation
    print("\n⚠️  WARNING: This action cannot be undone!")
    print("Players will lose their word search progress, but can replay with the new format.")
    confirmation = input("\nType 'REGENERATE' to confirm: ")
    
    if confirmation != 'REGENERATE':
        print("❌ Operation cancelled.")
        return
    
    print("\n🗑️  Deleting old word search games...")
    
    # Delete in correct order (respecting foreign keys)
    GameAnswer.objects.filter(attempt__game__in=word_search_games).delete()
    GameAttempt.objects.filter(game__in=word_search_games).delete()
    GameQuestion.objects.filter(game__in=word_search_games).delete()
    word_search_games.delete()
    
    print("   ✓ Old games deleted")
    
    print("\n🔄 Regenerating word searches with new 8x8 format...")
    
    success_count = 0
    error_count = 0
    
    for story in stories:
        try:
            print(f"   📖 Generating for: {story.title}...", end=' ')
            
            # Extract story text
            story_text = GameGenerationService._extract_story_text(story)
            
            # Generate new word search
            new_game = GameGenerationService._generate_word_search_game(story, story_text)
            
            if new_game:
                print("✓")
                success_count += 1
            else:
                print("⚠️  (not enough words)")
                error_count += 1
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            error_count += 1
    
    print(f"\n✅ Regeneration complete!")
    print(f"   ✓ Successfully created: {success_count} word searches")
    if error_count > 0:
        print(f"   ⚠️  Failed: {error_count} stories")
    print("\n💡 All new word searches use the 8x8 grid format!")


if __name__ == '__main__':
    print("=" * 60)
    print("Word Search Game Update Tool")
    print("=" * 60)
    print("\nChoose an option:")
    print("1. Delete old word searches (they'll regenerate automatically when accessed)")
    print("2. Delete and immediately regenerate all word searches")
    print("3. Cancel")
    
    choice = input("\nEnter your choice (1, 2, or 3): ").strip()
    
    if choice == '1':
        delete_old_word_searches()
    elif choice == '2':
        delete_and_regenerate_word_searches()
    else:
        print("❌ Operation cancelled.")
