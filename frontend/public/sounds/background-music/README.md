# Background Music for Storybook App

This folder contains background music tracks that play while users create and interact with stories.

## 🎵 Required Music Files

Place the following music files in this directory:

1. **adventure-time.mp3** - Upbeat, adventurous melody
2. **creative-flow.mp3** - Calm, focused creative ambiance
3. **dreamy-clouds.mp3** - Soft, gentle, dreamy atmosphere
4. **magical-forest.mp3** - Mystical, enchanting nature sounds
5. **playful-journey.mp3** - Fun, bouncy, playful tune
6. **wonder-land.mp3** - Whimsical, wonder-filled melody

## 📏 File Size & Quality Recommendations

### Ideal Specifications:
- **Format**: MP3 (best compatibility)
- **Bitrate**: 96-128 kbps (good balance of quality and size)
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo
- **Duration**: 2-4 minutes (will loop seamlessly)
- **File Size**: 2-6 MB per track (targeting 3-4 MB ideal)

### Why These Specifications?

**Bitrate (96-128 kbps)**:
- 96 kbps: ~1.4 MB per minute - Good for simple melodies, mobile-friendly
- 128 kbps: ~1.9 MB per minute - Better quality, still reasonable size
- Avoid 320 kbps: ~4.8 MB per minute - Overkill for background music, slow loading

**Duration (2-4 minutes)**:
- Too short (<1:30): Loop is too noticeable, becomes repetitive
- Just right (2-4 min): Good variety before looping, comfortable listening
- Too long (>5 min): Large file size, slower initial load

**Target File Sizes**:
```
2 minutes @ 96 kbps  = ~2.8 MB
3 minutes @ 96 kbps  = ~4.2 MB
2 minutes @ 128 kbps = ~3.8 MB
3 minutes @ 128 kbps = ~5.7 MB
```

**Recommended**: 2.5-3 minutes @ 96-128 kbps = ~3-5 MB per file

## 🎼 Music Style Guidelines

### For Child Users (Primary Audience):
- **Tempo**: Moderate (80-120 BPM) - Not too fast, not too slow
- **Instrumentation**: Simple, clear melodies with soft instruments
- **Mood**: Positive, inspiring, calming but not boring
- **Volume**: Mixed to be naturally quiet (music should sit in background)
- **Loop Points**: Seamless loops without jarring transitions

### Track Personality:

**🗺️ Adventure Time**
- Upbeat, explores new worlds
- Light percussion, bright melodies
- Think: "Let's go on a quest!"

**🎨 Creative Flow**
- Calm, focused, helps concentration
- Ambient, gentle piano or strings
- Think: "Time to create something amazing"

**☁️ Dreamy Clouds**
- Soft, gentle, peaceful
- Ethereal pads, light bells
- Think: "Floating on imagination"

**🌲 Magical Forest**
- Mystical, nature-inspired
- Woodwinds, soft strings, nature ambiance
- Think: "Discovering hidden magic"

**🎈 Playful Journey**
- Fun, bouncy, energetic but not chaotic
- Playful instruments, xylophone, light synths
- Think: "Let's have fun creating!"

**✨ Wonder Land**
- Whimsical, curious, magical
- Mixed instruments, sparkly textures
- Think: "Anything is possible here"

## 🔍 Where to Find Royalty-Free Music

### Best Sources for Background Music:

1. **Pixabay Music** - https://pixabay.com/music/
   - Completely free, no attribution required
   - Great selection of loops
   - Can filter by mood, duration
   - ⭐ HIGHLY RECOMMENDED for this project

2. **Free Music Archive (FMA)** - https://freemusicarchive.org/
   - Free music with various licenses
   - Check license (some require attribution)
   - Good variety of genres

3. **YouTube Audio Library** - https://studio.youtube.com/
   - Free for use
   - Filter by "No attribution required"
   - Download as MP3
   - Good quality tracks

4. **Incompetech** - https://incompetech.com/music/
   - Created by Kevin MacLeod
   - Requires attribution or license purchase
   - Huge selection of loopable tracks
   - Search by mood/genre

5. **Bensound** - https://www.bensound.com/
   - Free with attribution
   - High-quality production
   - Good for kids' content

6. **Purple Planet Music** - https://www.purple-planet.com/
   - Free for non-commercial with attribution
   - Kid-friendly music
   - Easy to find loopable tracks

## 🛠️ How to Process Music Files

### Converting to Optimal Format (using free tools):

**Option 1: Audacity (Free, Desktop)**
1. Download from: https://www.audacityteam.org/
2. Open your music file
3. File → Export → Export as MP3
4. Settings:
   - Bit Rate Mode: Constant
   - Quality: 96-128 kbps
   - Channel Mode: Stereo
5. Save!

**Option 2: Online Audio Converter**
1. Visit: https://online-audio-converter.com/
2. Upload your file
3. Select MP3 format
4. Quality: 128 kbps
5. Convert and download

**Option 3: FFmpeg (Command Line)**
```bash
# Convert to 96 kbps MP3
ffmpeg -i input.mp3 -b:a 96k output.mp3

# Convert to 128 kbps MP3
ffmpeg -i input.wav -b:a 128k output.mp3
```

## 🎵 Making Seamless Loops

### Tips for Good Loops:
1. **Trim ends**: Remove silence at start/end
2. **Fade in/out**: Add small fades (50-100ms) at loop points
3. **Check transition**: Play last 5 seconds + first 5 seconds together
4. **Key matching**: Ensure the ending key matches the beginning

### Audacity Looping Guide:
1. Select the entire track
2. Effect → Fade In (first 0.5 seconds)
3. Effect → Fade Out (last 0.5 seconds)
4. Listen to the loop point carefully
5. Adjust timing if needed

## 📝 Implementation in Code

The app automatically:
- ✅ Loads the selected track (or random if set to random)
- ✅ Loops seamlessly using native browser looping
- ✅ Fades in/out when starting/stopping
- ✅ Pauses when tab is hidden
- ✅ Remembers user's track preference
- ✅ Switches tracks smoothly when user changes selection

## 🎯 Quick Start Checklist

- [ ] Download 6 music tracks from royalty-free sources
- [ ] Ensure each track is 2-4 minutes long
- [ ] Convert to MP3 @ 96-128 kbps if needed
- [ ] Rename files to match track names:
  - `adventure-time.mp3`
  - `creative-flow.mp3`
  - `dreamy-clouds.mp3`
  - `magical-forest.mp3`
  - `playful-journey.mp3`
  - `wonder-land.mp3`
- [ ] Add fade in/out for seamless looping
- [ ] Test each file in the app
- [ ] Verify file sizes are 2-6 MB each

## 📊 Example File Structure

```
frontend/public/sounds/background-music/
├── README.md (this file)
├── adventure-time.mp3      (3.2 MB, 2:30, 128 kbps)
├── creative-flow.mp3       (2.8 MB, 2:15, 96 kbps)
├── dreamy-clouds.mp3       (3.5 MB, 2:45, 128 kbps)
├── magical-forest.mp3      (3.1 MB, 2:20, 128 kbps)
├── playful-journey.mp3     (2.9 MB, 2:10, 128 kbps)
└── wonder-land.mp3         (3.3 MB, 2:30, 128 kbps)

Total: ~19 MB for all 6 tracks
```

## 🎨 User Experience

Users can:
1. Enable/disable background music in Settings
2. Choose "Random" to hear different tracks automatically
3. Select their favorite track to always play
4. Adjust music volume independently from sound effects
5. See which track is currently playing

The music automatically:
- Starts when child users enter the app (after auth page)
- Stops when users log out or switch to parent account
- Continues playing across page navigation
- Pauses when browser tab is inactive

## 📱 Mobile Considerations

- Music files are loaded on-demand (not preloaded)
- First play may have slight delay on mobile networks
- Consider providing a "Download music" option for offline use later
- Keep file sizes reasonable for mobile data users

## 🔧 Troubleshooting

**Music not playing?**
- Check browser console for file loading errors
- Verify file names match exactly (case-sensitive)
- Ensure MP3 files are in correct directory
- Try playing files directly in browser to test

**Loops have gaps?**
- Add small fades at start/end of track
- Check for silence at beginning/end
- Verify the track was designed/edited for looping

**Files too large?**
- Reduce bitrate to 96 kbps
- Shorten duration to 2-2.5 minutes
- Convert from WAV to MP3

## 📄 License & Attribution

Remember to keep track of your music sources and licenses:

```
Music Credits:
- "Adventure Time" by [Artist] from [Source] - [License]
- "Creative Flow" by [Artist] from [Source] - [License]
- etc.
```

Add this to your app's credits/about section if required by the license.
