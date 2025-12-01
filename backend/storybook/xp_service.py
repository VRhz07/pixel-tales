"""
XP Service for awarding experience points to users
XP is awarded for various actions and never decreases
"""
from django.contrib.auth.models import User
from .models import UserProfile, Notification


class XPService:
    """Service for managing user experience points"""
    
    # XP rewards for different actions
    XP_REWARDS = {
        'story_created': 100,
        'story_published': 50,
        'collaboration_completed': 50,
        'story_liked': 5,
        'story_commented': 10,
        'friend_added': 20,
        'character_created': 25,
        'story_read': 5,
        'achievement_earned': 30,
    }
    
    @classmethod
    def award_xp(cls, user, action, amount=None, create_notification=True):
        """
        Award XP to a user for an action
        
        Args:
            user: User object or user ID
            action: Action type (key from XP_REWARDS)
            amount: Custom XP amount (if None, uses default from XP_REWARDS)
            create_notification: Whether to create a notification for the user
            
        Returns:
            dict with XP info or None if failed
        """
        try:
            # Get user object if ID was passed
            if isinstance(user, int):
                user = User.objects.get(id=user)
            
            # Get user profile
            profile = user.profile
            
            # Determine XP amount
            xp_amount = amount if amount is not None else cls.XP_REWARDS.get(action, 0)
            
            if xp_amount <= 0:
                return None
            
            # Add XP to profile
            result = profile.add_experience(xp_amount)
            
            # Create notification if requested and user leveled up
            if create_notification and result and result.get('leveled_up'):
                cls._create_level_up_notification(user, result['level'])
            
            return result
            
        except Exception as e:
            print(f"Error awarding XP: {str(e)}")
            return None
    
    @classmethod
    def _create_level_up_notification(cls, user, new_level):
        """Create a notification when user levels up"""
        try:
            Notification.objects.create(
                recipient=user,
                notification_type='achievement_earned',
                title=f'Level Up! 🎉',
                message=f'Congratulations! You reached Level {new_level}!',
                data={
                    'level': new_level,
                    'type': 'level_up'
                }
            )
        except Exception as e:
            print(f"Error creating level up notification: {str(e)}")
    
    @classmethod
    def get_xp_for_action(cls, action):
        """Get the XP amount for a specific action"""
        return cls.XP_REWARDS.get(action, 0)
    
    @classmethod
    def get_user_xp_info(cls, user):
        """
        Get complete XP information for a user
        
        Returns:
            dict with XP info
        """
        try:
            if isinstance(user, int):
                user = User.objects.get(id=user)
            
            profile = user.profile
            
            return {
                'total_xp': profile.experience_points,
                'level': profile.level,
                'current_level_xp': profile.xp_progress_in_current_level,
                'next_level_xp': profile.xp_for_next_level,
                'progress_percentage': profile.xp_progress_percentage
            }
        except Exception as e:
            print(f"Error getting user XP info: {str(e)}")
            return None


# Helper function for easy access
def award_xp(user, action, amount=None, create_notification=True):
    """Shorthand function to award XP"""
    return XPService.award_xp(user, action, amount, create_notification)
