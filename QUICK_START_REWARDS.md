# 🎁 Quick Start: Reward System

## What's New?
Children can now unlock **cool avatars** and **avatar borders** as they level up by creating stories!

## For Users

### How to Unlock Rewards
1. **Create stories** - Earn 100 XP per story
2. **Publish stories** - Earn 50 XP bonus
3. **Level up** - Every 500 XP = 1 level
4. **Unlock rewards** - Get new avatars and borders at milestone levels

### How to Equip Rewards
1. Go to **Profile** page
2. Click the **Edit Profile** button (or gear icon in settings)
3. Click **"🎁 View All Rewards"** button
4. Browse **Avatars** and **Borders** tabs
5. Select your favorites and click **Save Changes**
6. Your new look appears on your profile!

### Unlock Schedule
| Level | Avatars | Borders |
|-------|---------|---------|
| 1 | 4 starters | Basic (gray) |
| 3 | +4 fun | Bronze |
| 5 | +4 gaming | Silver |
| 8 | +4 musical | - |
| 10 | +4 space | Gold |
| 15 | +4 nature | Emerald |
| 20 | +4 animals | Ruby |
| 25 | +4 pets | Diamond (gradient!) |
| 30 | +4 premium | Mythic (gradient!) |
| 40 | +4 legendary | Legendary (2 gradients!) |
| 50 | +4 ultimate | Ultimate + Cosmic (animated!) |

**Total: 52 avatars, 12 borders**

## For Developers

### Quick Setup
```bash
# 1. Run migration
cd backend
python manage.py migrate

# 2. Test the reward service
python manage.py shell < test_reward_system.py

# 3. Start the server
python manage.py runserver
```

### API Usage

**Get user's rewards:**
```javascript
const response = await api.get('/users/rewards/');
// Returns: unlocked rewards, next unlocks, current level
```

**Update avatar and border:**
```javascript
await api.put('/users/profile/update/', {
  avatar_emoji: '🦄',
  selected_avatar_border: 'bronze'
});
```

**Use AvatarWithBorder component:**
```tsx
import { AvatarWithBorder } from '@/components/common/AvatarWithBorder';

<AvatarWithBorder
  avatar="🦄"
  borderId="gold"
  size={100}
/>
```

### Files Changed

**Backend:**
- `storybook/reward_service.py` (NEW)
- `storybook/models.py` (added border field)
- `storybook/xp_service.py` (enhanced notifications)
- `storybook/views.py` (added rewards endpoint)
- `storybook/urls.py` (added route)
- `storybook/serializers.py` (added border field)
- `storybook/migrations/0023_*.py` (NEW)

**Frontend:**
- `components/settings/RewardsModal.tsx` (NEW)
- `components/common/AvatarWithBorder.tsx` (NEW)
- `components/settings/ProfileEditModal.tsx` (integrated rewards)
- `components/pages/ProfilePage.tsx` (shows borders)
- `types/api.types.ts` (added border field)

## Testing

### Manual Test Flow
1. Create a child account
2. Create 5 stories (500 XP = Level 2)
3. Create 3 more stories (800 XP = Level 2, almost Level 3)
4. Create 2 more stories (1000 XP = Level 3) 🎉
5. Check notifications - should see "Level Up! You unlocked 4 new avatars and 1 new border"
6. Go to Profile → Edit → View All Rewards
7. See Bronze border unlocked
8. Select and equip
9. See border on profile

### Automated Test
```bash
cd backend
python manage.py shell < test_reward_system.py
```

## Design Philosophy

### Why This System?
✅ **Motivates creativity** - Encourages story creation
✅ **No pay-to-win** - All rewards earned through effort
✅ **Age-appropriate** - Fun, colorful, safe
✅ **Progressive** - Rewards get cooler as you level
✅ **Visual feedback** - Borders show achievement

### Border Tiers
- **Levels 1-10**: Solid colors (simple, clean)
- **Levels 15-20**: Precious metals/gems
- **Levels 25-30**: Gradients (magical!)
- **Levels 40-50**: Animated gradients (legendary!)

## Troubleshooting

### Border not showing?
- Check if user has `selected_avatar_border` field
- Verify border ID matches available borders
- Check if AvatarWithBorder component is imported

### Rewards not unlocking?
- Verify XP is being awarded (check `xp_service.py`)
- Check if level calculation is correct (500 XP per level)
- Test with `test_reward_system.py`

### Modal not opening?
- Check if RewardsModal is imported in ProfileEditModal
- Verify GiftIcon is imported from heroicons
- Check console for errors

## Future Ideas

Want to enhance the system? Consider:
- 🎃 Seasonal avatars (Halloween, Christmas)
- 🏆 Achievement-based unlocks (beyond levels)
- 🌟 Rarity system (common, rare, epic, legendary)
- 🎨 Custom border colors
- ✨ Particle effects for ultimate borders
- 📊 Rewards showcase page
- 🎵 Sound effects on unlock

## Support

Questions? Check:
- `REWARD_SYSTEM_IMPLEMENTATION.md` - Full technical details
- `backend/storybook/reward_service.py` - Reward logic
- `frontend/src/components/settings/RewardsModal.tsx` - UI implementation

Happy creating! 🎨✨
