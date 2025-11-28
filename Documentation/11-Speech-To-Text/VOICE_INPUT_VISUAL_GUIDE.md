# Voice Input - Visual Guide

## 🎨 Component Appearance

### VoiceInput Button

```
┌─────────────────────────────────────┐
│                                     │
│  IDLE STATE (Purple Gradient)      │
│  ┌───────┐                          │
│  │  🎤   │  ← Click to speak        │
│  └───────┘                          │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│  RECORDING STATE (Red + Pulsing)   │
│  ┌───────┐                          │
│  │  ⏹️   │  ← Stop recording        │
│  └───────┘                          │
│     )))   ← Ripple animation        │
│                                     │
└─────────────────────────────────────┘
```

### VoiceFilteredInput

```
┌──────────────────────────────────────────────┐
│  Type or speak...                    🎤      │
└──────────────────────────────────────────────┘
     ↑                                  ↑
  Input field                    Voice button
```

### VoiceFilteredTextarea

```
┌──────────────────────────────────────────────┐
│  Write your story or speak...        🎤      │
│                                              │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
     ↑                                  ↑
  Textarea                        Voice button
```

## 🎭 Visual States

### 1. Idle State
```
Color: Purple Gradient (#8B5CF6 → #7C3AED)
Icon: 🎤 Microphone
Shadow: Soft purple glow
Animation: None
Cursor: Pointer
```

### 2. Hover State
```
Color: Brighter purple
Icon: 🎤 Microphone
Shadow: Enhanced purple glow
Animation: Scale up (1.05)
Cursor: Pointer
```

### 3. Recording State
```
Color: Red Gradient (#EF4444 → #DC2626)
Icon: ⏹️ Stop
Shadow: Red pulsing glow
Animation: Ripple effect (expanding circles)
Cursor: Pointer
```

### 4. Error State
```
Below button:
┌──────────────────────────────────────┐
│ ⚠️ Microphone access denied.         │
└──────────────────────────────────────┘
Color: Red background (#FEF2F2)
Border: Red (#FCA5A5)
Text: Dark red (#DC2626)
Animation: Slide down
```

## 🌈 Color Palette

### Light Mode
```css
/* Idle Button */
Background: linear-gradient(135deg, #8B5CF6, #7C3AED)
Shadow: 0 2px 8px rgba(139, 92, 246, 0.3)

/* Recording Button */
Background: linear-gradient(135deg, #EF4444, #DC2626)
Shadow: 0 0 0 10px rgba(239, 68, 68, 0)

/* Error Message */
Background: #FEF2F2
Border: #FCA5A5
Text: #DC2626

/* Transcript */
Background: rgba(139, 92, 246, 0.05)
Border: rgba(139, 92, 246, 0.2)
Text: #1F2937
```

### Dark Mode
```css
/* Idle Button */
Background: linear-gradient(135deg, #8B5CF6, #7C3AED)
Shadow: 0 2px 8px rgba(139, 92, 246, 0.4)

/* Recording Button */
Background: linear-gradient(135deg, #EF4444, #DC2626)
Shadow: 0 0 0 10px rgba(239, 68, 68, 0)

/* Error Message */
Background: #450a0a
Border: #991b1b
Text: #fca5a5

/* Transcript */
Background: rgba(139, 92, 246, 0.1)
Border: rgba(139, 92, 246, 0.3)
Text: #F9FAFB
```

## 📐 Sizing

### Button Sizes
```
Small (sm):   32px × 32px  (Icon: 16px)
Medium (md):  40px × 40px  (Icon: 20px)
Large (lg):   48px × 48px  (Icon: 24px)
```

### Responsive Breakpoints
```
Mobile (<640px):    40px button
Tablet (640-1024px): 44px button
Desktop (>1024px):   48px button
```

## 🎬 Animations

### 1. Voice Pulse (Recording)
```
Duration: 1.5s
Timing: ease-in-out
Loop: infinite

0%:   box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7)
50%:  box-shadow: 0 0 0 10px rgba(239, 68, 68, 0)
100%: box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7)
```

### 2. Voice Ripple (Recording)
```
Duration: 1.5s
Timing: ease-out
Loop: infinite

0%:   scale(1), opacity(0.6)
100%: scale(2), opacity(0)
```

### 3. Slide Down (Error)
```
Duration: 0.3s
Timing: ease-out
Loop: once

From: translateY(-8px), opacity(0)
To:   translateY(0), opacity(1)
```

### 4. Hover Scale
```
Duration: 0.3s
Timing: ease

From: scale(1)
To:   scale(1.05)
```

## 📱 Layout Examples

### In Input Field
```
┌────────────────────────────────────────────────┐
│  [User's text here...]                    🎤  │
└────────────────────────────────────────────────┘
 ← 100% width                          ← 0.5rem padding
```

### In Textarea
```
┌────────────────────────────────────────────────┐
│  [User's text here...]                    🎤  │
│                                                │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
 ← 100% width                     ← Top-right corner
```

### Standalone
```
    🎤
    ↑
Centered or inline
```

## 🔤 Typography

### Error Messages
```
Font Size: 0.875rem (14px)
Font Weight: 400 (normal)
Line Height: 1.5
Color: #DC2626 (light) / #fca5a5 (dark)
```

### Transcript
```
Final Text:
  Font Weight: 500 (medium)
  Color: #1F2937 (light) / #F9FAFB (dark)

Interim Text:
  Font Style: italic
  Color: #6B7280 (light) / #9CA3AF (dark)
```

## 🎯 User Flow

### Happy Path
```
1. User sees input field with mic button 🎤
   ↓
2. User clicks mic button
   ↓
3. Browser asks for microphone permission
   ↓
4. User grants permission
   ↓
5. Button turns red with pulsing animation
   ↓
6. User speaks clearly
   ↓
7. Text appears in input field
   ↓
8. User clicks stop or finishes speaking
   ↓
9. Button returns to purple
   ↓
10. Text is in the field, ready to use!
```

### Error Path
```
1. User clicks mic button 🎤
   ↓
2. Browser asks for permission
   ↓
3. User denies permission ❌
   ↓
4. Red error message appears below:
   "⚠️ Microphone access denied."
   ↓
5. Error auto-dismisses after 3 seconds
```

## 🌐 Language Indicators

### English Mode
```
Tooltip: "Click to speak"
Recording: "Stop recording"
Error: "No speech detected. Please try again."
```

### Tagalog Mode
```
Tooltip: "Magsalita para mag-type"
Recording: "Ihinto ang recording"
Error: "Walang narinig na boses. Subukang magsalita ulit."
```

## 📊 Visual Hierarchy

```
Priority 1: Input/Textarea content (main focus)
Priority 2: Voice button (secondary action)
Priority 3: Error messages (when present)
Priority 4: Transcript display (optional)
```

## 🎨 Design Principles

1. **Non-intrusive**: Button doesn't distract from main content
2. **Clear Feedback**: Visual state changes are obvious
3. **Accessible**: High contrast, proper sizing, keyboard support
4. **Consistent**: Matches app's design language
5. **Delightful**: Smooth animations create pleasant experience

## 🖼️ Component Spacing

```
VoiceFilteredInput:
┌─────────────────────────────────────────┐
│ padding: 0.75rem                        │
│ padding-right: 3rem (for button)       │
│                                    🎤   │
│                              (0.5rem)   │
└─────────────────────────────────────────┘

VoiceFilteredTextarea:
┌─────────────────────────────────────────┐
│ padding: 0.75rem                   🎤   │
│ padding-right: 4rem           (0.75rem) │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## 🎭 Accessibility Features

### Visual
- High contrast colors (WCAG AA compliant)
- Clear state indicators
- Visible focus rings
- Adequate touch targets (44px minimum)

### Functional
- Keyboard accessible (Tab navigation)
- Screen reader announcements
- Clear error messages
- Manual control (no auto-start)

---

**Visual consistency** ensures users immediately recognize and understand the voice input feature across the entire app! 🎨✨
