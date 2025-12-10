"""
Reward Service for managing unlockable avatars and borders
Children unlock cool rewards as they level up!
"""

# Level-based rewards configuration
REWARD_CONFIG = {
    'avatars': {
        # Starter avatars (available from level 1)
        1: ['📚', '✨', '🎨', '🎭'],
        
        # Unlocked at level 3
        3: ['🦄', '🐉', '🌟', '🎪'],
        
        # Unlocked at level 5
        5: ['🎬', '🎮', '🎯', '🎲'],
        
        # Unlocked at level 8
        8: ['🎸', '🎺', '🎻', '🎹'],
        
        # Unlocked at level 10
        10: ['🚀', '🛸', '🌈', '🌙'],
        
        # Unlocked at level 15
        15: ['⭐', '🌸', '🌺', '🌻'],
        
        # Unlocked at level 20
        20: ['🦋', '🐝', '🐢', '🦊'],
        
        # Unlocked at level 25
        25: ['🐱', '🐶', '🐼', '🐨'],
        
        # Premium unlocks at level 30+
        30: ['👑', '💎', '🏆', '🌠'],
        
        # Legendary unlocks at level 40+
        40: ['🔮', '⚡', '🔥', '🎇'],
        
        # Ultimate unlocks at level 50+
        50: ['🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️']
    },
    
    'borders': {
        # Starter border (available from level 1)
        1: [
            {'id': 'basic', 'name': 'Basic', 'style': 'solid', 'color': '#9CA3AF'}
        ],
        
        # Bronze tier (level 3)
        3: [
            {'id': 'bronze', 'name': 'Bronze', 'style': 'solid', 'color': '#CD7F32'}
        ],
        
        # Silver tier (level 5)
        5: [
            {'id': 'silver', 'name': 'Silver', 'style': 'solid', 'color': '#C0C0C0'}
        ],
        
        # Gold tier (level 10)
        10: [
            {'id': 'gold', 'name': 'Gold', 'style': 'solid', 'color': '#FFD700'}
        ],
        
        # Emerald tier (level 15)
        15: [
            {'id': 'emerald', 'name': 'Emerald', 'style': 'solid', 'color': '#50C878'}
        ],
        
        # Ruby tier (level 20)
        20: [
            {'id': 'ruby', 'name': 'Ruby', 'style': 'solid', 'color': '#E0115F'}
        ],
        
        # Diamond tier (level 25)
        25: [
            {'id': 'diamond', 'name': 'Diamond', 'style': 'gradient', 'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
        ],
        
        # Mythic tier (level 30)
        30: [
            {'id': 'mythic', 'name': 'Mythic', 'style': 'gradient', 'gradient': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}
        ],
        
        # Legendary tier (level 40)
        40: [
            {'id': 'legendary', 'name': 'Legendary', 'style': 'gradient', 'gradient': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'},
            {'id': 'legendary_fire', 'name': 'Legendary Fire', 'style': 'gradient', 'gradient': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}
        ],
        
        # Ultimate tier (level 50)
        50: [
            {'id': 'ultimate', 'name': 'Ultimate', 'style': 'animated', 'gradient': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)'},
            {'id': 'cosmic', 'name': 'Cosmic', 'style': 'animated', 'gradient': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #a8edea 100%)'}
        ]
    }
}


class RewardService:
    """Service for managing user rewards (avatars and borders)"""
    
    @classmethod
    def get_unlocked_avatars(cls, level):
        """
        Get all avatars unlocked at or below the user's level
        
        Args:
            level: User's current level
            
        Returns:
            List of unlocked avatar emojis
        """
        unlocked = []
        for unlock_level, avatars in REWARD_CONFIG['avatars'].items():
            if level >= unlock_level:
                unlocked.extend(avatars)
        return unlocked
    
    @classmethod
    def get_unlocked_borders(cls, level):
        """
        Get all borders unlocked at or below the user's level
        
        Args:
            level: User's current level
            
        Returns:
            List of unlocked border configs
        """
        unlocked = []
        for unlock_level, borders in REWARD_CONFIG['borders'].items():
            if level >= unlock_level:
                unlocked.extend(borders)
        return unlocked
    
    @classmethod
    def get_next_unlock_level(cls, current_level, reward_type='avatars'):
        """
        Get the next level that will unlock new rewards
        
        Args:
            current_level: User's current level
            reward_type: 'avatars' or 'borders'
            
        Returns:
            Next unlock level or None if max level reached
        """
        unlock_levels = sorted(REWARD_CONFIG[reward_type].keys())
        for level in unlock_levels:
            if level > current_level:
                return level
        return None
    
    @classmethod
    def get_rewards_at_level(cls, level):
        """
        Get all rewards that unlock at a specific level
        
        Args:
            level: The level to check
            
        Returns:
            Dict with 'avatars' and 'borders' lists
        """
        return {
            'avatars': REWARD_CONFIG['avatars'].get(level, []),
            'borders': REWARD_CONFIG['borders'].get(level, [])
        }
    
    @classmethod
    def get_all_rewards_info(cls, user_level):
        """
        Get complete rewards information for a user
        
        Args:
            user_level: User's current level
            
        Returns:
            Dict with unlocked and locked rewards, including all rewards with their unlock levels
        """
        print(f"🎁 Getting rewards for level {user_level}")
        print(f"🎁 REWARD_CONFIG keys: {REWARD_CONFIG.keys()}")
        print(f"🎁 Available avatar levels: {sorted(REWARD_CONFIG['avatars'].keys())}")
        print(f"🎁 Available border levels: {sorted(REWARD_CONFIG['borders'].keys())}")
        
        unlocked_avatars = cls.get_unlocked_avatars(user_level)
        unlocked_borders = cls.get_unlocked_borders(user_level)
        
        print(f"🎁 Unlocked avatars: {unlocked_avatars}")
        print(f"🎁 Unlocked borders: {unlocked_borders}")
        
        # Get next unlock info
        next_avatar_level = cls.get_next_unlock_level(user_level, 'avatars')
        next_border_level = cls.get_next_unlock_level(user_level, 'borders')
        
        # Build comprehensive list of all rewards with their unlock levels
        all_avatars = []
        for unlock_level, avatars in sorted(REWARD_CONFIG['avatars'].items()):
            for avatar in avatars:
                all_avatars.append({
                    'item': avatar,
                    'unlockLevel': unlock_level,
                    'isUnlocked': user_level >= unlock_level
                })
        
        all_borders = []
        for unlock_level, borders in sorted(REWARD_CONFIG['borders'].items()):
            for border in borders:
                all_borders.append({
                    'item': border,
                    'unlockLevel': unlock_level,
                    'isUnlocked': user_level >= unlock_level
                })
        
        result = {
            'unlocked': {
                'avatars': unlocked_avatars,
                'borders': unlocked_borders
            },
            'next_unlock': {
                'avatar_level': next_avatar_level,
                'border_level': next_border_level,
                'avatar_preview': REWARD_CONFIG['avatars'].get(next_avatar_level, []) if next_avatar_level else [],
                'border_preview': REWARD_CONFIG['borders'].get(next_border_level, []) if next_border_level else []
            },
            'current_level': user_level,
            'all_rewards': {
                'avatars': all_avatars,
                'borders': all_borders
            }
        }
        
        print(f"🎁 Final result includes {len(all_avatars)} avatars and {len(all_borders)} borders")
        return result
    
    @classmethod
    def check_new_unlocks(cls, old_level, new_level):
        """
        Check if leveling up unlocked any new rewards
        
        Args:
            old_level: Previous level
            new_level: New level after leveling up
            
        Returns:
            Dict with newly unlocked rewards
        """
        newly_unlocked = {
            'avatars': [],
            'borders': []
        }
        
        # Check each level between old and new
        for level in range(old_level + 1, new_level + 1):
            newly_unlocked['avatars'].extend(REWARD_CONFIG['avatars'].get(level, []))
            newly_unlocked['borders'].extend(REWARD_CONFIG['borders'].get(level, []))
        
        return newly_unlocked if (newly_unlocked['avatars'] or newly_unlocked['borders']) else None
