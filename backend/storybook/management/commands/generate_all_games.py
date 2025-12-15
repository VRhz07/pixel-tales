"""
Management command to generate educational games for all published stories
Usage: python manage.py generate_all_games
"""
from django.core.management.base import BaseCommand
from storybook.models import Story
from storybook.game_service import GameGenerationService


class Command(BaseCommand):
    help = 'Generate educational games for all published stories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--story-id',
            type=int,
            help='Generate games for a specific story ID only',
        )
        parser.add_argument(
            '--regenerate',
            action='store_true',
            help='Regenerate games even if they already exist',
        )

    def handle(self, *args, **options):
        story_id = options.get('story_id')
        regenerate = options.get('regenerate', False)
        
        # Filter stories
        if story_id:
            stories = Story.objects.filter(id=story_id, is_published=True)
            if not stories.exists():
                self.stdout.write(
                    self.style.ERROR(f"❌ Story with ID {story_id} not found or not published")
                )
                return
        else:
            stories = Story.objects.filter(is_published=True)
        
        total = stories.count()
        
        if total == 0:
            self.stdout.write(
                self.style.WARNING("⚠️  No published stories found")
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f"\n🎮 Generating games for {total} {'story' if total == 1 else 'stories'}...\n")
        )
        
        success_count = 0
        error_count = 0
        skipped_count = 0
        
        for i, story in enumerate(stories, 1):
            # Check if games already exist
            if not regenerate and story.games.exists():
                self.stdout.write(
                    self.style.WARNING(f"[{i}/{total}] ⏭️  {story.title}: Games already exist (use --regenerate to override)")
                )
                skipped_count += 1
                continue
            
            try:
                # Delete existing games if regenerating
                if regenerate and story.games.exists():
                    old_count = story.games.count()
                    story.games.all().delete()
                    self.stdout.write(f"  🗑️  Deleted {old_count} existing games")
                
                # Generate games
                result = GameGenerationService.generate_games_for_story(story)
                
                if 'error' in result:
                    self.stdout.write(
                        self.style.ERROR(f"[{i}/{total}] ❌ {story.title}: {result['error']}")
                    )
                    error_count += 1
                else:
                    game_types = ', '.join(result.keys())
                    self.stdout.write(
                        self.style.SUCCESS(f"[{i}/{total}] ✅ {story.title}: Created {len(result)} games ({game_types})")
                    )
                    
                    # Show question counts
                    for game_type, game in result.items():
                        q_count = game.get_questions_count()
                        self.stdout.write(f"     • {game_type}: {q_count} questions")
                    
                    success_count += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"[{i}/{total}] ❌ {story.title}: {str(e)}")
                )
                error_count += 1
        
        # Summary
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS(f"✅ Successfully generated: {success_count}"))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f"⏭️  Skipped (already exist): {skipped_count}"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"❌ Failed: {error_count}"))
        self.stdout.write("="*60 + "\n")
        
        if success_count > 0:
            self.stdout.write(
                self.style.SUCCESS("🎉 Game generation complete! Users can now play educational games.\n")
            )
