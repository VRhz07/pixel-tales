"""
Achievement Service for automatically checking and awarding achievements
"""
from django.contrib.auth.models import User
from .models import Achievement, UserAchievement, Notification
from django.utils import timezone


class AchievementService:
    """Service for managing user achievements"""
    
    # XP rewards by achievement rarity
    RARITY_XP = {
        'common': 50,
        'uncommon': 100,
        'rare': 200,
        'epic': 500,
        'legendary': 1000,
    }
    
    @classmethod
    def check_and_award_achievements(cls, user, updated_stats=None):
        """
        Check all achievements for a user and award any newly earned ones
        
        Args:
            user: User object
            updated_stats: Optional dict of updated user stats to check against
            
        Returns:
            list of newly earned achievements
        """
        try:
            if isinstance(user, int):
                user = User.objects.get(id=user)
            
            # Get all active achievements
            achievements = Achievement.objects.filter(is_active=True)
            
            # Get user's current achievements
            user_achievements = {}
            for ua in UserAchievement.objects.filter(user=user).select_related('achievement'):
                user_achievements[ua.achievement_id] = ua
            
            # Get user stats if not provided
            if updated_stats is None:
                updated_stats = cls._calculate_user_stats(user)
            
            newly_earned = []
            
            # Check each achievement
            for achievement in achievements:
                current_progress = updated_stats.get(achievement.metric_type, 0)
                
                # Determine if achievement is earned
                if achievement.metric_type == 'leaderboard_rank':
                    is_earned = current_progress <= achievement.target_value if achievement.target_value else False
                else:
                    is_earned = current_progress >= achievement.target_value if achievement.target_value else False
                
                # Get or create user achievement
                if achievement.id in user_achievements:
                    ua = user_achievements[achievement.id]
                    was_earned = ua.is_earned
                    ua.progress = current_progress
                    ua.is_earned = is_earned
                    if is_earned and not was_earned:
                        ua.earned_at = timezone.now()
                    ua.save()
                else:
                    ua = UserAchievement.objects.create(
                        user=user,
                        achievement=achievement,
                        progress=current_progress,
                        is_earned=is_earned,
                        earned_at=timezone.now() if is_earned else None
                    )
                    was_earned = False
                
                # If newly earned, add to list and create notification
                if is_earned and not was_earned:
                    newly_earned.append(achievement)
                    cls._create_achievement_notification(user, achievement)
                    cls._award_achievement_xp(user, achievement)
            
            return newly_earned
            
        except Exception as e:
            print(f"Error checking achievements: {str(e)}")
            return []
    
    @classmethod
    def _calculate_user_stats(cls, user):
        """Calculate user statistics for achievement checking"""
        from django.db import models
        from .models import Story, Friendship, Character, Like, Comment, StoryRead
        
        # Count various metrics
        stats = {
            'published_stories': Story.objects.filter(author=user, is_published=True).count(),
            'total_stories': Story.objects.filter(author=user).count(),
            'manual_stories': Story.objects.filter(author=user, creation_type='manual').count(),
            'ai_stories': Story.objects.filter(author=user, creation_type='ai_assisted').count(),
            'collaboration_count': Story.objects.filter(author=user, is_collaborative=True).count(),
            'collaborations_completed': Story.objects.filter(author=user, is_collaborative=True, is_published=True).count(),
            'characters_created': Character.objects.filter(creator=user).count(),
            'friends': Friendship.objects.filter(
                models.Q(sender=user, status='accepted') | 
                models.Q(receiver=user, status='accepted')
            ).count(),
            'likes_received': Like.objects.filter(story__author=user).count(),
            'comments_received': Comment.objects.filter(story__author=user).count(),
            'stories_read': StoryRead.objects.filter(user=user).count(),
            'views_received': Story.objects.filter(author=user).aggregate(
                total_views=models.Sum('views')
            )['total_views'] or 0,
        }
        
        # Calculate total words written
        total_words = 0
        for story in Story.objects.filter(author=user):
            if story.content:
                total_words += len(story.content.split())
        stats['total_words'] = total_words
        
        # TODO: Add leaderboard rank calculation
        stats['leaderboard_rank'] = 999  # Placeholder
        
        return stats
    
    @classmethod
    def _create_achievement_notification(cls, user, achievement):
        """Create a notification when user earns an achievement"""
        try:
            Notification.objects.create(
                recipient=user,
                notification_type='achievement_earned',
                title=f'Achievement Unlocked! 🏆',
                message=f'You earned "{achievement.name}"! {achievement.description}',
                related_achievement=achievement,
                data={
                    'achievement_id': achievement.id,
                    'achievement_name': achievement.name,
                    'achievement_icon': achievement.icon,
                    'achievement_rarity': achievement.rarity,
                    'xp_earned': cls.RARITY_XP.get(achievement.rarity, 50)
                }
            )
        except Exception as e:
            print(f"Error creating achievement notification: {str(e)}")
    
    @classmethod
    def _award_achievement_xp(cls, user, achievement):
        """Award XP for earning an achievement"""
        try:
            from .xp_service import XPService
            
            xp_amount = cls.RARITY_XP.get(achievement.rarity, 50)
            XPService.award_xp(
                user, 
                'achievement_earned', 
                amount=xp_amount,
                create_notification=False  # Already created notification above
            )
        except Exception as e:
            print(f"Error awarding achievement XP: {str(e)}")
    
    @classmethod
    def get_user_achievement_summary(cls, user):
        """Get summary of user's achievements"""
        try:
            if isinstance(user, int):
                user = User.objects.get(id=user)
            
            earned = UserAchievement.objects.filter(user=user, is_earned=True).count()
            in_progress = UserAchievement.objects.filter(
                user=user, 
                is_earned=False, 
                progress__gt=0
            ).count()
            total = Achievement.objects.filter(is_active=True).count()
            
            return {
                'earned': earned,
                'in_progress': in_progress,
                'locked': total - earned - in_progress,
                'total': total,
                'completion_percentage': (earned / total * 100) if total > 0 else 0
            }
        except Exception as e:
            print(f"Error getting achievement summary: {str(e)}")
            return None


# Helper function for easy access
def check_achievements(user, updated_stats=None):
    """Shorthand function to check and award achievements"""
    return AchievementService.check_and_award_achievements(user, updated_stats)
