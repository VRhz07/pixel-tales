# Sound Effects for Storybook App

This folder contains all sound effects used in the application.

## Required Sound Files

Place the following sound files in this directory:

### Button Sounds
- `button-click.mp3` - General button clicks (light tap sound)
- `button-toggle.mp3` - Toggle switches, checkboxes
- `button-success.mp3` - Success actions (save, publish, etc.)
- `button-cancel.mp3` - Cancel/close actions

### Navigation Sounds
- `page-turn.mp3` - Turning story pages
- `tab-switch.mp3` - Switching tabs in navigation
- `swipe.mp3` - Swipe gestures

### Notification Sounds
- `notification.mp3` - General notifications
- `message-received.mp3` - New message/chat
- `achievement.mp3` - Achievement unlocked
- `error.mp3` - Error alerts
- `warning.mp3` - Warning messages

### Creation & Drawing Sounds
- `brush-stroke.mp3` - Drawing on canvas (light swoosh)
- `eraser.mp3` - Eraser tool (light rubbing sound)
- `color-pick.mp3` - Selecting colors
- `tool-select.mp3` - Selecting drawing tools

### AI & Loading
- `ai-thinking.mp3` - AI generating content (optional ambient)
- `loading-complete.mp3` - Loading finished
- `magic-sparkle.mp3` - AI generation complete

### Social & Interaction
- `like.mp3` - Liking a story
- `friend-request.mp3` - Friend request received
- `collaboration-invite.mp3` - Collaboration invitation

## Free Sound Sources

### Recommended Websites (Royalty-Free)
1. **Freesound.org** - https://freesound.org/
   - Requires attribution
   - High quality sounds
   - Search for UI sounds

2. **Zapsplat** - https://www.zapsplat.com/
   - Free for indie games/apps
   - Great UI sound collection
   - No attribution required for standard license

3. **Mixkit** - https://mixkit.co/free-sound-effects/
   - Completely free
   - No attribution required
   - Modern UI sounds

4. **Pixabay Sound Effects** - https://pixabay.com/sound-effects/
   - Free to use
   - No attribution required
   - Good variety

5. **YouTube Audio Library** - https://www.youtube.com/audiolibrary
   - Free sounds
   - Download as MP3
   - Filter by "No attribution required"

## Sound Guidelines

### Volume Levels (0.0 to 1.0)
- Buttons: 0.3-0.4 (subtle)
- Notifications: 0.5-0.6 (noticeable)
- Achievements: 0.7 (celebratory)
- Error: 0.4-0.5 (attention without being harsh)
- Background ambient: 0.1-0.2 (very subtle)

### Duration
- Button clicks: < 200ms
- Notifications: 500ms - 1s
- Achievements: 1-2s
- Page turns: 300-500ms

### Format
- Primary: MP3 (best compatibility)
- Alternative: OGG (smaller file size)
- Avoid: WAV (too large for web)

## File Size Recommendations
- Keep each sound under 50KB
- Use 64-128kbps bitrate for most sounds
- Mono audio is fine for UI sounds (saves space)

## Testing Your Sounds
After adding sound files, test with:
```typescript
import { useSoundEffects } from '../hooks/useSoundEffects';

const { playSound } = useSoundEffects();
playSound('button-click');
```

## Attribution Template
If using sounds that require attribution, add to your app's credits:

```
Sound Effects:
- [Sound Name] by [Creator] from [Source] (License: CC-BY)
```
