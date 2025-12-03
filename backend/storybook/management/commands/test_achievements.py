"""
Test script to verify achievement system is working
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from storybook.models import Achievement, UserAchievement
from storybook.achievement_service import check_achievements


class Command(BaseCommand):
    help = 'Test achievement system for a user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to test')

    def handle(self, *args, **kwargs):
        username = kwargs['username']
        
        try:
            user = User.objects.get(username=username)
            self.stdout.write(f'\n🎯 Testing achievements for user: {user.username}')
            self.stdout.write(f'📊 Current XP: {user.profile.experience_points}')
            self.stdout.write(f'⭐ Current Level: {user.profile.level}\n')
            
            # Check and award achievements
            self.stdout.write('🔍 Checking achievements...\n')
            newly_earned = check_achievements(user)
            
            if newly_earned:
                self.stdout.write(self.style.SUCCESS(f'🎉 Newly earned achievements:'))
                for achievement in newly_earned:
                    self.stdout.write(f'  {achievement.icon} {achievement.name} ({achievement.rarity})')
            else:
                self.stdout.write('📝 No new achievements earned')
            
            # Show summary
            self.stdout.write('\n📈 Achievement Summary:')
            earned = UserAchievement.objects.filter(user=user, is_earned=True).count()
            in_progress = UserAchievement.objects.filter(user=user, is_earned=False, progress__gt=0).count()
            total = Achievement.objects.filter(is_active=True).count()
            
            self.stdout.write(f'  ✅ Earned: {earned}/{total}')
            self.stdout.write(f'  🔄 In Progress: {in_progress}')
            self.stdout.write(f'  🔒 Locked: {total - earned - in_progress}')
            
            # Show top 5 closest achievements
            self.stdout.write('\n🎯 Closest Achievements:')
            close_achievements = UserAchievement.objects.filter(
                user=user, 
                is_earned=False
            ).select_related('achievement').order_by('-progress')[:5]
            
            for ua in close_achievements:
                if ua.progress > 0:
                    percentage = (ua.progress / ua.achievement.target_value * 100) if ua.achievement.target_value else 0
                    self.stdout.write(
                        f'  {ua.achievement.icon} {ua.achievement.name}: '
                        f'{ua.progress}/{ua.achievement.target_value} ({percentage:.0f}%)'
                    )
            
            self.stdout.write(self.style.SUCCESS('\n✅ Achievement check complete!'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ User "{username}" not found'))
