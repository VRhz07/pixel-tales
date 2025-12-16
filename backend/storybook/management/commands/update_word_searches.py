"""
Django management command to update word search games to new child-friendly format
Usage: python manage.py update_word_searches
"""
from django.core.management.base import BaseCommand
from storybook.models import StoryGame, GameQuestion, GameAnswer, GameAttempt


class Command(BaseCommand):
    help = 'Delete old 12x12 word search games so they regenerate as 8x8 child-friendly format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompt',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        
        self.stdout.write('🔍 Finding old word search games...')
        
        # Get all word search games
        word_search_games = StoryGame.objects.filter(game_type='word_search')
        
        if not word_search_games.exists():
            self.stdout.write(self.style.SUCCESS('✅ No word search games found. Nothing to delete.'))
            return
        
        total_games = word_search_games.count()
        total_questions = GameQuestion.objects.filter(game__in=word_search_games).count()
        total_attempts = GameAttempt.objects.filter(game__in=word_search_games).count()
        total_answers = GameAnswer.objects.filter(attempt__game__in=word_search_games).count()
        
        self.stdout.write(f'📊 Found {total_games} word search games')
        self.stdout.write(f'📝 This will delete:')
        self.stdout.write(f'   - {total_games} word search games')
        self.stdout.write(f'   - {total_questions} questions')
        self.stdout.write(f'   - {total_attempts} game attempts')
        self.stdout.write(f'   - {total_answers} answers')
        
        if not force:
            confirm = input('\n⚠️  Continue? Type "yes" to confirm: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('❌ Operation cancelled.'))
                return
        
        self.stdout.write('\n🗑️  Deleting old word search games...')
        
        # Delete in correct order (respecting foreign keys)
        GameAnswer.objects.filter(attempt__game__in=word_search_games).delete()
        self.stdout.write('   ✓ Deleted answers')
        
        GameAttempt.objects.filter(game__in=word_search_games).delete()
        self.stdout.write('   ✓ Deleted attempts')
        
        GameQuestion.objects.filter(game__in=word_search_games).delete()
        self.stdout.write('   ✓ Deleted questions')
        
        word_search_games.delete()
        self.stdout.write('   ✓ Deleted games')
        
        self.stdout.write(self.style.SUCCESS('\n✅ All old word search games have been deleted!'))
        self.stdout.write(self.style.SUCCESS('💡 New word searches will be generated automatically with the 8x8 format'))
        self.stdout.write(self.style.SUCCESS('   when users access story games or during the next deployment.'))
