"""
XP Service for awarding experience points to users
XP is awarded for various actions and never decreases
"""
from django.contrib.auth.models import User
from .models import UserProfile, Notification
from .reward_service import RewardService


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
            
            # Store old level for reward checking
            old_level = profile.level
            
            # Determine XP amount
            xp_amount = amount if amount is not None else cls.XP_REWARDS.get(action, 0)
            
            if xp_amount <= 0:
                return None
            
            # Add XP to profile
            result = profile.add_experience(xp_amount)
            
            # Send real-time XP notification via WebSocket
            if create_notification and result and xp_amount > 0:
                cls._send_xp_notification(user, xp_amount, action, result)
            
            # Create notification if user leveled up
            if create_notification and result and result.get('leveled_up'):
                new_level = result['level']
                
                # Check for newly unlocked rewards
                new_unlocks = RewardService.check_new_unlocks(old_level, new_level)
                
                cls._create_level_up_notification(user, new_level, new_unlocks)
                cls._send_level_up_notification(user, new_level, new_unlocks, result)
            
            return result
            
        except Exception as e:
            print(f"Error awarding XP: {str(e)}")
            return None
    
    @classmethod
    def _send_xp_notification(cls, user, xp_amount, action, result):
        """Send real-time XP gain notification via WebSocket"""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'xp_gained',
                        'xp_amount': xp_amount,
                        'action': action,
                        'total_xp': result.get('total_xp', 0),
                        'level': result.get('level', 1),
                        'current_level_xp': result.get('current_level_xp', 0),
                        'next_level_xp': result.get('next_level_xp', 500),
                    }
                )
        except Exception as e:
            print(f"Error sending XP notification: {str(e)}")
    
    @classmethod
    def _send_level_up_notification(cls, user, new_level, new_unlocks, result):
        """Send real-time level up notification via WebSocket"""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                # Prepare unlocked items for frontend
                unlocked_items = []
                if new_unlocks:
                    if new_unlocks.get('avatars'):
                        for avatar in new_unlocks['avatars']:
                            unlocked_items.append({
                                'type': 'avatar',
                                'name': avatar.get('name', 'New Avatar'),
                                'emoji': avatar.get('emoji', '🎭'),
                            })
                    if new_unlocks.get('borders'):
                        for border in new_unlocks['borders']:
                            unlocked_items.append({
                                'type': 'border',
                                'name': border.get('name', 'New Border'),
                                'emoji': '🖼️',
                                'gradient': border.get('gradient'),
                            })
                
                async_to_sync(channel_layer.group_send)(
                    f'notifications_{user.id}',
                    {
                        'type': 'level_up',
                        'new_level': new_level,
                        'total_xp': result.get('total_xp', 0),
                        'unlocked_items': unlocked_items,
                    }
                )
        except Exception as e:
            print(f"Error sending level up notification: {str(e)}")
    
    @classmethod
    def _create_level_up_notification(cls, user, new_level, new_unlocks=None):
        """Create a notification when user levels up"""
        try:
            # Build message with unlock info
            message = f'Congratulations! You reached Level {new_level}!'
            
            if new_unlocks:
                unlock_parts = []
                if new_unlocks.get('avatars'):
                    unlock_parts.append(f"{len(new_unlocks['avatars'])} new avatar(s)")
                if new_unlocks.get('borders'):
                    unlock_parts.append(f"{len(new_unlocks['borders'])} new border(s)")
                
                if unlock_parts:
                    message += f"\n\n🎁 You unlocked: {' and '.join(unlock_parts)}!"
            
            Notification.objects.create(
                recipient=user,
                notification_type='achievement_earned',
                title=f'Level Up! 🎉',
                message=message,
                data={
                    'level': new_level,
                    'type': 'level_up',
                    'new_unlocks': new_unlocks or {}
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
