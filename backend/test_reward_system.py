"""
Test script for the reward system
Run with: python manage.py shell < test_reward_system.py
"""

from storybook.reward_service import RewardService

print("\n" + "="*60)
print("🎁 REWARD SYSTEM TEST")
print("="*60 + "\n")

# Test 1: Check unlocked avatars at different levels
print("TEST 1: Unlocked Avatars by Level")
print("-" * 60)
for level in [1, 3, 5, 10, 20, 30, 50]:
    avatars = RewardService.get_unlocked_avatars(level)
    print(f"Level {level:2d}: {len(avatars):2d} avatars - {' '.join(avatars[:5])}...")

# Test 2: Check unlocked borders at different levels
print("\n\nTEST 2: Unlocked Borders by Level")
print("-" * 60)
for level in [1, 3, 5, 10, 20, 30, 50]:
    borders = RewardService.get_unlocked_borders(level)
    border_names = [b['name'] for b in borders]
    print(f"Level {level:2d}: {len(borders):2d} borders - {', '.join(border_names)}")

# Test 3: Check next unlock levels
print("\n\nTEST 3: Next Unlock Levels")
print("-" * 60)
for level in [1, 5, 12, 28, 45]:
    next_avatar = RewardService.get_next_unlock_level(level, 'avatars')
    next_border = RewardService.get_next_unlock_level(level, 'borders')
    print(f"Level {level:2d}: Next avatar unlock at {next_avatar or 'MAX'}, next border at {next_border or 'MAX'}")

# Test 4: Check rewards at specific level
print("\n\nTEST 4: New Rewards at Specific Levels")
print("-" * 60)
for level in [1, 3, 10, 25, 50]:
    rewards = RewardService.get_rewards_at_level(level)
    avatar_count = len(rewards['avatars'])
    border_count = len(rewards['borders'])
    print(f"Level {level:2d}: +{avatar_count} avatars, +{border_count} borders")
    if rewards['avatars']:
        print(f"         Avatars: {' '.join(rewards['avatars'])}")
    if rewards['borders']:
        print(f"         Borders: {', '.join([b['name'] for b in rewards['borders']])}")

# Test 5: Check level up unlocks
print("\n\nTEST 5: Leveling Up Detection")
print("-" * 60)
test_cases = [(2, 3), (4, 5), (9, 10), (24, 25), (49, 50)]
for old_level, new_level in test_cases:
    unlocks = RewardService.check_new_unlocks(old_level, new_level)
    if unlocks:
        avatar_count = len(unlocks['avatars'])
        border_count = len(unlocks['borders'])
        print(f"Level {old_level} → {new_level}: 🎉 Unlocked {avatar_count} avatars, {border_count} borders")
    else:
        print(f"Level {old_level} → {new_level}: No new unlocks")

# Test 6: Complete rewards info for a user
print("\n\nTEST 6: Complete Rewards Info (Level 10 User)")
print("-" * 60)
rewards_info = RewardService.get_all_rewards_info(10)
print(f"Current Level: {rewards_info['current_level']}")
print(f"Unlocked Avatars: {len(rewards_info['unlocked']['avatars'])}")
print(f"Unlocked Borders: {len(rewards_info['unlocked']['borders'])}")
print(f"\nNext Unlock:")
print(f"  - Avatars at Level {rewards_info['next_unlock']['avatar_level']}")
print(f"  - Borders at Level {rewards_info['next_unlock']['border_level']}")
if rewards_info['next_unlock']['avatar_preview']:
    print(f"  - Preview: {' '.join(rewards_info['next_unlock']['avatar_preview'][:4])}")

print("\n" + "="*60)
print("✅ ALL TESTS COMPLETED")
print("="*60 + "\n")
