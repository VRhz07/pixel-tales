# Voice Input - Quick Reference Card

## 🎤 Components

### VoiceInput
Standalone microphone button
```tsx
import { VoiceInput } from './components/common/VoiceInput';

<VoiceInput
  onTranscript={(text) => console.log(text)}
  size="md"
/>
```

### VoiceFilteredInput
Input with voice + profanity filter
```tsx
import { VoiceFilteredInput } from './components/common/VoiceFilteredInput';

<VoiceFilteredInput
  value={text}
  onChange={setText}
  placeholder="Type or speak..."
/>
```

### VoiceFilteredTextarea
Textarea with voice + profanity filter
```tsx
import { VoiceFilteredTextarea } from './components/common/VoiceFilteredTextarea';

<VoiceFilteredTextarea
  value={text}
  onChange={setText}
  rows={6}
/>
```

## 🌐 Languages Supported

| Language | Code | Locale |
|----------|------|--------|
| English | `en` | `en-US` |
| Tagalog | `tl` | `tl-PH` |

**Auto-detects** from app language setting!

## 🎨 Props

### VoiceInput Props
```typescript
{
  onTranscript: (text: string) => void;  // Required
  onError?: (error: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTranscript?: boolean;
}
```

### VoiceFilteredInput Props
```typescript
{
  value: string;                         // Required
  onChange: (value: string) => void;     // Required
  placeholder?: string;
  showWarning?: boolean;
  onProfanityDetected?: (has: boolean) => void;
  className?: string;
  maxLength?: number;
}
```

### VoiceFilteredTextarea Props
```typescript
{
  value: string;                         // Required
  onChange: (value: string) => void;     // Required
  placeholder?: string;
  showWarning?: boolean;
  onProfanityDetected?: (has: boolean) => void;
  className?: string;
  rows?: number;
  maxLength?: number;
}
```

## 🔧 Hook API

### useSpeechRecognition
```typescript
const {
  isListening,        // boolean
  transcript,         // string
  interimTranscript,  // string
  error,              // string | null
  isSupported,        // boolean
  startListening,     // () => void
  stopListening,      // () => void
  resetTranscript,    // () => void
} = useSpeechRecognition({
  continuous: false,
  interimResults: true,
  onResult: (text) => {},
  onError: (error) => {},
});
```

## 🎯 Common Use Cases

### Replace FilteredInput
```tsx
// Before
<FilteredInput value={text} onChange={setText} />

// After
<VoiceFilteredInput value={text} onChange={setText} />
```

### Replace FilteredTextarea
```tsx
// Before
<FilteredTextarea value={text} onChange={setText} rows={6} />

// After
<VoiceFilteredTextarea value={text} onChange={setText} rows={6} />
```

### Custom Voice Handler
```tsx
<VoiceInput
  onTranscript={(text) => {
    // Custom logic here
    setText(prev => prev + ' ' + text);
  }}
  size="lg"
/>
```

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 25+ | ✅ Full |
| Edge 79+ | ✅ Full |
| Safari 14.1+ | ✅ Full |
| Opera 27+ | ✅ Full |
| Firefox | ⚠️ Limited |
| IE | ❌ None |

## 🎨 Visual States

| State | Appearance |
|-------|------------|
| Idle | Purple gradient + mic icon |
| Recording | Red gradient + stop icon + pulse |
| Hover | Scale up + shadow |
| Error | Red message below |

## 🔤 Translations

### English
- Click to speak
- Stop recording
- No speech detected. Please try again.
- Microphone access denied.

### Tagalog
- Magsalita para mag-type
- Ihinto ang recording
- Walang narinig na boses. Subukang magsalita ulit.
- Hindi ma-access ang mikropono.

## 📱 Integration Points

| Component | Replace With |
|-----------|--------------|
| AI Story Modal | VoiceFilteredTextarea |
| Manual Story Creation | VoiceFilteredInput + VoiceFilteredTextarea |
| Profile Edit | VoiceFilteredInput |
| Comments | VoiceFilteredTextarea |
| Search | VoiceFilteredInput |

## 🚀 Quick Start

1. Import component
2. Replace existing input/textarea
3. Done!

```tsx
// Step 1: Import
import { VoiceFilteredTextarea } from './components/common/VoiceFilteredTextarea';

// Step 2: Use
<VoiceFilteredTextarea
  value={text}
  onChange={setText}
  placeholder="Type or speak..."
/>

// Step 3: Test by clicking mic button!
```

## 🔒 Privacy

- ✅ Local processing (on-device)
- ✅ No data storage
- ✅ No external APIs
- ✅ User permission required
- ✅ Manual control

## 📚 Full Documentation

- **Implementation**: `/SPEECH_TO_TEXT_IMPLEMENTATION.md`
- **Examples**: `/frontend/VOICE_INPUT_USAGE_EXAMPLES.md`
- **Summary**: `/VOICE_INPUT_SUMMARY.md`

---

**That's it!** 🎤 Start using voice input in 3 lines of code.
