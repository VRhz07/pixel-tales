# Text-to-Speech (TTS) Feature Documentation

## Overview

The Imaginary Worlds app includes a comprehensive text-to-speech system that allows users to listen to stories being read aloud. This feature enhances accessibility, supports language learning, and provides an alternative way to enjoy stories.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Usage Guide](#usage-guide)
5. [API Reference](#api-reference)
6. [Browser Compatibility](#browser-compatibility)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)

---

## Features

### Core Functionality
- ✅ **Read Aloud**: Converts story text to speech using Web Speech API
- ✅ **Playback Controls**: Play, pause, resume, and stop
- ✅ **Progress Tracking**: Visual progress bar showing reading progress
- ✅ **Seekable Progress Bar**: Click or drag to jump to any part of the story
- ✅ **Voice Selection**: Choose from 30+ available system voices
- ✅ **Speed Control**: Adjust reading speed from 0.5x to 2x
- ✅ **Volume Control**: Adjust volume from 0% to 100%
- ✅ **Bilingual Support**: Full English and Tagalog translations
- ✅ **Dark Mode**: Complete dark mode styling
- ✅ **Responsive Design**: Works on mobile, tablet, and desktop

### Accessibility Benefits
- Screen reader alternative for visually impaired users
- Supports dyslexic readers with audio reinforcement
- Language learning tool for pronunciation
- Hands-free story listening
- Multi-sensory reading experience

---

## Architecture

### Technology Stack

```
┌─────────────────────────────────────┐
│     StoryReaderPage Component       │
│  (Displays story with TTS controls) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      TTSControls Component          │
│   (UI for TTS functionality)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     useTextToSpeech Hook            │
│  (Core TTS logic and state)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Web Speech API                 │
│   (Browser native TTS engine)       │
└─────────────────────────────────────┘
```

### File Structure

```
frontend/src/
├── hooks/
│   └── useTextToSpeech.ts          # Core TTS hook
├── components/
│   └── common/
│       └── TTSControls.tsx         # TTS UI component
├── pages/
│   └── StoryReaderPage.tsx         # Integration point
├── stores/
│   └── i18nStore.ts                # Translations
└── index.css                        # TTS styling
```

---

## Components

### 1. useTextToSpeech Hook

**Location**: `/hooks/useTextToSpeech.ts`

Custom React hook that manages all TTS functionality using the Web Speech API.

#### Features:
- Automatic language detection based on app settings
- Voice management and selection
- Playback state management
- Progress tracking by word boundaries
- Error handling with user-friendly messages

#### Return Values:

```typescript
interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  progress: number; // 0 to 100
}
```

#### Example Usage:

```typescript
import { useTextToSpeech } from '../hooks/useTextToSpeech';

function MyComponent() {
  const { speak, pause, resume, stop, isSpeaking, progress } = useTextToSpeech();
  
  const handlePlay = () => {
    speak("Once upon a time, there was a magical world...");
  };
  
  return (
    <div>
      <button onClick={handlePlay}>Listen</button>
      {isSpeaking && <button onClick={pause}>Pause</button>}
      <div>Progress: {progress}%</div>
    </div>
  );
}
```

---

### 2. TTSControls Component

**Location**: `/components/common/TTSControls.tsx`

Reusable UI component that provides a complete TTS interface.

#### Props:

```typescript
interface TTSControlsProps {
  text: string;           // Text to be read aloud
  autoPlay?: boolean;     // Auto-start on mount (default: false)
  showProgress?: boolean; // Show progress bar (default: true)
  compact?: boolean;      // Use compact layout (default: false)
}
```

#### Features:
- **Main Controls**: Play/Pause/Resume and Stop buttons
- **Progress Bar**: Visual indicator of reading progress
- **Settings Panel**: Voice selection, speed, and volume controls
- **Compact Mode**: Minimal button-only interface
- **Responsive**: Adapts to screen size

#### Example Usage:

```typescript
import { TTSControls } from '../components/common/TTSControls';

function StoryPage({ story }) {
  const fullText = story.pages.map(page => page.text).join(' ');
  
  return (
    <div>
      <h1>{story.title}</h1>
      <TTSControls 
        text={fullText}
        showProgress={true}
      />
      {/* Story content */}
    </div>
  );
}
```

#### Compact Mode:

```typescript
<TTSControls 
  text={story.text}
  compact={true}
  showProgress={false}
/>
```

---

## Usage Guide

### For End Users

#### Reading a Story with TTS

1. **Open a Story**: Navigate to any story in your library
2. **Find TTS Controls**: Located below the like/comment buttons
3. **Click "Listen to Story"**: The story will begin reading aloud
4. **Control Playback**:
   - Click **Pause** to temporarily stop
   - Click **Resume** to continue from where you paused
   - Click **Stop** to end playback completely
5. **Adjust Settings** (optional):
   - Click the **gear icon** to open settings
   - Select a different **voice**
   - Adjust **speed** (slow, normal, fast)
   - Control **volume**

#### Progress Tracking & Seeking

- A **purple progress bar** shows how much of the story has been read
- Percentage indicator displays exact progress (e.g., "45%")
- Progress updates in real-time as the story is read
- **Click anywhere** on the progress bar to jump to that position
- **Drag** the progress bar to scrub through the story
- Progress bar **grows on hover** to indicate it's interactive
- Visual **handle appears** when hovering over the progress bar

#### Language Support

- TTS automatically uses your app language setting
- **English**: Uses en-US voices
- **Tagalog**: Uses fil-PH or tl-PH voices
- Change language in Settings → Appearance → Language

---

### For Developers

#### Adding TTS to a New Page

**Step 1**: Import the component

```typescript
import { TTSControls } from '../components/common/TTSControls';
```

**Step 2**: Prepare your text

```typescript
const textToRead = story.pages
  .map(page => page.text)
  .filter(Boolean)
  .join(' ');
```

**Step 3**: Add the component

```tsx
<TTSControls 
  text={textToRead}
  showProgress={true}
/>
```

#### Customizing TTS Behavior

**Custom Voice Settings**:

```typescript
const { speak, setRate, setVolume, setVoice } = useTextToSpeech();

// Set custom speed
setRate(1.5); // 1.5x speed

// Set custom volume
setVolume(0.8); // 80% volume

// Use specific voice
const voices = window.speechSynthesis.getVoices();
const femaleVoice = voices.find(v => v.name.includes('Female'));
setVoice(femaleVoice);

// Speak with custom settings
speak("Hello world!");
```

**Auto-play on Page Load**:

```tsx
<TTSControls 
  text={story.text}
  autoPlay={true}
/>
```

---

## API Reference

### useTextToSpeech Hook

#### Methods

##### `speak(text: string, options?: TextToSpeechOptions)`

Starts reading the provided text aloud.

**Parameters**:
- `text` (string): The text to be read
- `options` (optional):
  - `rate` (number): Speech rate (0.1 to 10, default: 1)
  - `pitch` (number): Voice pitch (0 to 2, default: 1)
  - `volume` (number): Volume level (0 to 1, default: 1)
  - `voice` (SpeechSynthesisVoice): Specific voice to use

**Example**:
```typescript
speak("Hello world", { rate: 1.2, volume: 0.8 });
```

##### `pause()`

Pauses the current speech. Can be resumed later.

##### `resume()`

Resumes paused speech from where it stopped.

##### `stop()`

Stops speech completely and resets progress.

##### `seek(progressPercent: number)`

Jumps to a specific position in the story.

**Parameters**:
- `progressPercent` (number): Position to jump to (0 to 100)

**Example**:
```typescript
// Jump to 50% of the story
seek(50);

// Jump to the beginning
seek(0);

// Jump to the end
seek(100);
```

**Notes**:
- Automatically starts playing from the new position
- Progress is clamped between 0 and 100
- If already playing, stops current playback and starts from new position

#### State Properties

##### `isSpeaking: boolean`

Whether speech is currently active (playing or paused).

##### `isPaused: boolean`

Whether speech is currently paused.

##### `isSupported: boolean`

Whether the browser supports Web Speech API.

##### `voices: SpeechSynthesisVoice[]`

Array of available system voices.

##### `currentVoice: SpeechSynthesisVoice | null`

Currently selected voice.

##### `rate: number`

Current speech rate (0.1 to 10).

##### `pitch: number`

Current voice pitch (0 to 2).

##### `volume: number`

Current volume level (0 to 1).

##### `progress: number`

Reading progress as percentage (0 to 100).

---

## Browser Compatibility

### Fully Supported ✅

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 25+ | Full support, best experience |
| Edge | 79+ | Chromium-based, full support |
| Safari | 14.1+ | iOS and macOS supported |
| Opera | 27+ | Full support |

### Partial Support ⚠️

| Browser | Version | Notes |
|---------|---------|-------|
| Firefox | Latest | Requires flags, limited voice selection |

### Not Supported ❌

- Internet Explorer (all versions)
- Browsers older than 2020

### Feature Detection

The component automatically detects browser support:

```typescript
const { isSupported } = useTextToSpeech();

if (!isSupported) {
  return <div>Text-to-speech not available in this browser</div>;
}
```

### Mobile Support

- ✅ **iOS 14.3+**: Full support in Safari
- ✅ **Android 5.0+**: Full support in Chrome
- ✅ **Mobile Web**: Works in mobile browsers
- ✅ **PWA/APK**: Works in WebView with proper permissions

---

## Customization

### Styling

All TTS styles are in `/src/index.css` under the "TEXT-TO-SPEECH CONTROLS" section.

#### CSS Classes

```css
.tts-controls              /* Main container */
.tts-controls-main         /* Control buttons row */
.tts-button-primary        /* Listen/Play/Pause button */
.tts-button-secondary      /* Stop button */
.tts-button-icon           /* Settings button */
.tts-progress-container    /* Progress bar wrapper */
.tts-progress-bar          /* Progress bar track */
.tts-progress-fill         /* Progress bar fill */
.tts-settings-panel        /* Settings dropdown */
.tts-select                /* Voice dropdown */
.tts-slider                /* Speed/volume sliders */
```

#### Customizing Colors

```css
/* Change primary button color */
.tts-button-primary {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

/* Change progress bar color */
.tts-progress-fill {
  background: linear-gradient(90deg, #your-color-1 0%, #your-color-2 100%);
}
```

#### Dark Mode

All components have dark mode variants:

```css
.dark .tts-controls {
  /* Dark mode styles */
}
```

### Translations

Add or modify translations in `/stores/i18nStore.ts`:

```typescript
// Text-to-Speech
'tts.listen': { en: 'Listen to Story', tl: 'Pakinggan ang Kuwento' },
'tts.play': { en: 'Play', tl: 'I-play' },
'tts.pause': { en: 'Pause', tl: 'I-pause' },
// ... add more translations
```

---

## Troubleshooting

### Common Issues

#### 1. No Voices Available

**Problem**: Voice dropdown is empty or shows no voices.

**Solution**:
```typescript
// Voices load asynchronously
window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices();
  console.log('Available voices:', voices);
};
```

#### 2. Speech Stops Unexpectedly

**Problem**: Speech stops after a few seconds.

**Solution**: This is a browser limitation. For long text, split into chunks:

```typescript
const chunkText = (text: string, maxLength: number = 200) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
    if ((currentChunk + sentence).length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  });
  
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};
```

#### 3. Wrong Language Voice

**Problem**: TTS uses wrong language voice.

**Solution**: Explicitly set voice based on language:

```typescript
const { language } = useI18nStore();
const voices = window.speechSynthesis.getVoices();

const langCode = language === 'tl' ? 'fil' : 'en';
const voice = voices.find(v => v.lang.startsWith(langCode));
setVoice(voice);
```

#### 4. Progress Not Updating

**Problem**: Progress bar stays at 0%.

**Solution**: Ensure `onboundary` event is supported:

```typescript
utterance.onboundary = (event) => {
  if (event.name === 'word') {
    // Update progress
  }
};
```

Some browsers may not support word boundaries. Use `onend` as fallback:

```typescript
utterance.onend = () => {
  setProgress(100);
};
```

#### 5. Mobile Permissions

**Problem**: TTS doesn't work on mobile.

**Solution**: Ensure proper permissions in manifest:

**Android** (`AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**iOS** (`Info.plist`):
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>We use speech for text-to-speech features</string>
```

---

## Best Practices

### Performance

1. **Avoid Long Text**: Split text longer than 500 words into chunks
2. **Cancel on Unmount**: Always stop speech when component unmounts
3. **Debounce Controls**: Prevent rapid play/pause clicks

```typescript
useEffect(() => {
  return () => {
    stop(); // Cleanup on unmount
  };
}, []);
```

### User Experience

1. **Visual Feedback**: Always show progress and current state
2. **Keyboard Shortcuts**: Consider adding spacebar for play/pause
3. **Auto-scroll**: Scroll to current word being read (advanced)
4. **Save Preferences**: Remember user's voice/speed settings

```typescript
// Save preferences to localStorage
localStorage.setItem('tts-rate', rate.toString());
localStorage.setItem('tts-voice', currentVoice?.name || '');
```

### Accessibility

1. **ARIA Labels**: Add proper labels for screen readers
2. **Keyboard Navigation**: Ensure all controls are keyboard accessible
3. **Focus Management**: Manage focus when opening settings panel
4. **Error Messages**: Provide clear error messages

```tsx
<button 
  onClick={handlePlay}
  aria-label="Listen to story"
  aria-pressed={isSpeaking}
>
  Listen
</button>
```

---

## Advanced Features

### Highlighting Current Word

Track which word is being spoken and highlight it:

```typescript
utterance.onboundary = (event) => {
  if (event.name === 'word') {
    const charIndex = event.charIndex;
    // Highlight word at charIndex in your text
    highlightWordAt(charIndex);
  }
};
```

### Custom Voice Effects

Apply custom audio effects (requires Web Audio API):

```typescript
// Create audio context
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const filter = audioContext.createBiquadFilter();

// Apply effects
filter.type = 'lowpass';
filter.frequency.value = 1000;

source.connect(filter);
filter.connect(audioContext.destination);
```

### Multi-Language Stories

Handle stories with mixed languages:

```typescript
const detectLanguage = (text: string) => {
  // Simple detection based on character sets
  const hasTagalog = /[ñáéíóú]/i.test(text);
  return hasTagalog ? 'tl' : 'en';
};

const speakWithAutoDetect = (text: string) => {
  const lang = detectLanguage(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.startsWith(lang));
  
  speak(text, { voice });
};
```

---

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTextToSpeech } from './useTextToSpeech';

describe('useTextToSpeech', () => {
  it('should start speaking', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('Hello world');
    });
    
    expect(result.current.isSpeaking).toBe(true);
  });
  
  it('should pause and resume', () => {
    const { result } = renderHook(() => useTextToSpeech());
    
    act(() => {
      result.current.speak('Hello world');
      result.current.pause();
    });
    
    expect(result.current.isPaused).toBe(true);
    
    act(() => {
      result.current.resume();
    });
    
    expect(result.current.isPaused).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TTSControls } from './TTSControls';

describe('TTSControls', () => {
  it('should render play button', () => {
    render(<TTSControls text="Test story" />);
    expect(screen.getByText(/Listen to Story/i)).toBeInTheDocument();
  });
  
  it('should show pause button when playing', () => {
    render(<TTSControls text="Test story" />);
    
    fireEvent.click(screen.getByText(/Listen to Story/i));
    expect(screen.getByText(/Pause/i)).toBeInTheDocument();
  });
});
```

---

## Future Enhancements

### Planned Features

1. **Voice Cloning**: Custom voice training for personalized narration
2. **Emotion Detection**: Adjust tone based on story emotion
3. **Background Music**: Add ambient music during narration
4. **Speed Presets**: Quick buttons for common speeds
5. **Bookmarks**: Save position in long stories
6. **Offline Voices**: Download voices for offline use
7. **Multi-Voice**: Different voices for different characters
8. **Export Audio**: Save narration as MP3 file

### Community Contributions

We welcome contributions! Areas for improvement:

- Additional language support
- Better voice selection UI
- Advanced audio effects
- Performance optimizations
- Accessibility enhancements

---

## Support

### Getting Help

- **Documentation**: This file
- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in community forums
- **Email**: support@imaginaryworlds.com

### Resources

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Browser Compatibility Table](https://caniuse.com/speech-synthesis)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## License

This feature is part of the Imaginary Worlds app and follows the same license terms.

---

## Changelog

### Version 1.1.0 (2025-01-18)
- ✨ **New Feature**: Seekable progress bar
- ✅ Click anywhere on progress bar to jump to that position
- ✅ Drag progress bar to scrub through story
- ✅ Visual feedback with hover effects (bar grows, handle appears)
- ✅ Dark mode support for seek functionality
- 🔧 Enhanced `useTextToSpeech` hook with `seek()` method
- 📝 Updated documentation with seek feature

### Version 1.0.0 (2025-01-18)
- ✨ Initial release
- ✅ Basic playback controls (play, pause, resume, stop)
- ✅ Progress tracking
- ✅ Voice selection
- ✅ Speed and volume controls
- ✅ Bilingual support (English/Tagalog)
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Integration with StoryReaderPage

---

**Last Updated**: January 18, 2025  
**Version**: 1.0.0  
**Author**: Imaginary Worlds Development Team
