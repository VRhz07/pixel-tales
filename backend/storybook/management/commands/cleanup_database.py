"""
Management command to clean up old/test data from the database
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import models
from storybook.models import (
    UserProfile, Story, Character, Comment, Rating, 
    Friendship, Achievement, UserAchievement, Notification,
    ParentChildRelationship, TeacherStudentRelationship, Message,
    CollaborationSession, SessionParticipant
)


class Command(BaseCommand):
    help = 'Clean up old/test data from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion of old data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                'This will delete old test data. Run with --confirm to proceed.'
            ))
            self.stdout.write('\nData to be deleted:')
            
            # Count genuinely old users (inactive for 30+ days and no recent stories)
            from django.utils import timezone
            from datetime import timedelta
            cutoff_date = timezone.now() - timedelta(days=30)
            
            old_users = User.objects.filter(
                last_login__lt=cutoff_date,  # Haven't logged in for 30+ days
                date_joined__lt=cutoff_date,  # Joined more than 30 days ago
                is_superuser=False,  # Not superusers
            ).exclude(
                story_set__created_at__gte=cutoff_date  # No recent stories
            )
            self.stdout.write(f'  - {old_users.count()} old users')
            for u in old_users[:5]:
                self.stdout.write(f'    • {u.username} ({u.email})')
            
            # Count related data
            self.stdout.write(f'  - {Story.objects.filter(author__in=old_users).count()} stories')
            self.stdout.write(f'  - {Character.objects.filter(creator__in=old_users).count()} characters')
            self.stdout.write(f'  - {Message.objects.filter(sender__in=old_users).count()} messages (sent)')
            self.stdout.write(f'  - {Friendship.objects.filter(sender__in=old_users).count()} friendships')
            
            # Count expired/old collaboration sessions
            from django.utils import timezone
            from datetime import timedelta
            # Find sessions with no active participants
            from django.db.models import Count
            old_sessions = CollaborationSession.objects.annotate(
                active_participant_count=Count('participants', filter=models.Q(participants__is_active=True))
            ).filter(
                models.Q(expires_at__lt=timezone.now()) |  # Expired sessions
                models.Q(created_at__lt=timezone.now() - timedelta(days=7), active_participant_count=0) |  # Old empty sessions
                models.Q(host__in=old_users)  # Sessions by deleted users
            )
            self.stdout.write(f'  - {old_sessions.count()} old/expired collaboration sessions')
            
            return

        self.stdout.write(self.style.WARNING('Starting cleanup...'))

        # Get genuinely old users (inactive for 30+ days and no recent stories)
        from django.utils import timezone
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=30)
        
        old_users = User.objects.filter(
            last_login__lt=cutoff_date,  # Haven't logged in for 30+ days
            date_joined__lt=cutoff_date,  # Joined more than 30 days ago
            is_superuser=False,  # Not superusers
        ).exclude(
            story_set__created_at__gte=cutoff_date  # No recent stories
        )
        
        self.stdout.write(f'Found {old_users.count()} old users to delete')

        # Delete related data first (Django will cascade, but we'll be explicit)
        deleted_stories = Story.objects.filter(author__in=old_users).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_stories[0]} stories')

        deleted_characters = Character.objects.filter(creator__in=old_users).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_characters[0]} characters')

        deleted_messages = Message.objects.filter(
            sender__in=old_users
        ).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_messages[0]} messages')

        deleted_friendships = Friendship.objects.filter(
            sender__in=old_users
        ).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_friendships[0]} friendships')

        deleted_comments = Comment.objects.filter(author__in=old_users).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_comments[0]} comments')

        deleted_ratings = Rating.objects.filter(user__in=old_users).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_ratings[0]} ratings')

        deleted_notifications = Notification.objects.filter(recipient__in=old_users).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_notifications[0]} notifications')

        deleted_achievements = UserAchievement.objects.filter(user__in=old_users).delete()
        self.stdout.write(f'  ✓ Deleted {deleted_achievements[0]} user achievements')

        # Clean up old/expired collaboration sessions
        from django.utils import timezone
        from datetime import timedelta
        # Find sessions to clean up using proper database queries
        from django.db.models import Count
        old_sessions = CollaborationSession.objects.annotate(
            active_participant_count=Count('participants', filter=models.Q(participants__is_active=True))
        ).filter(
            models.Q(expires_at__lt=timezone.now()) |  # Expired sessions
            models.Q(created_at__lt=timezone.now() - timedelta(days=7), active_participant_count=0) |  # Old empty sessions (7+ days)
            models.Q(host__in=old_users)  # Sessions by deleted users
        )
        deleted_sessions = old_sessions.delete()
        self.stdout.write(f'  ✓ Deleted {deleted_sessions[0]} old/expired collaboration sessions')

        # Delete old users
        user_count = old_users.count()
        old_users.delete()
        self.stdout.write(f'  ✓ Deleted {user_count} old users')

        self.stdout.write(self.style.SUCCESS('\n✅ Cleanup completed successfully!'))
        
        # Show remaining users
        remaining_users = User.objects.all()
        self.stdout.write(f'\nRemaining users ({remaining_users.count()}):')
        for user in remaining_users:
            self.stdout.write(f'  - {user.username} ({user.email})')
