# Profanity Filter Implementation

Successfully implemented a comprehensive profanity filtering system for the Imaginary Worlds app that automatically censors inappropriate words in both English and Tagalog across all input fields.

## Overview

The profanity filter system provides real-time detection and censoring of inappropriate language with visual warning indicators. It works seamlessly across all text input fields in the application.

## Key Features

### ✅ Automatic Censoring
- Bad words are automatically replaced with asterisks (e.g., "b**d")
- Preserves first and last letter for context
- Censoring happens after user finishes typing

### ✅ Visual Warning System
- Red warning triangle icon appears when profanity is detected
- Warning message displays below input field
- Red border and light red background on affected inputs
- Pulsing animation on warning icon for visibility

### ✅ Bilingual Support
- **English profanity list**: Common inappropriate words and variations
- **Tagalog profanity list**: Filipino inappropriate words and phrases
- Handles common letter substitutions (a→@, e→3, i→1, o→0, etc.)
- Detects variations with spaces, hyphens, and underscores

### ✅ Smart Detection
- Case-insensitive matching
- Handles l33t speak and common obfuscation attempts
- Word boundary detection to avoid false positives
- Real-time validation with 3-second warning display

## Implementation Components

### 1. Profanity Filter Utility (`/utils/profanityFilter.ts`)

Core filtering engine with the following functions:

```typescript
// Check if text contains profanity
containsProfanity(text: string): boolean

// Find all profane words in text
findProfanity(text: string): string[]

// Censor profanity with asterisks
censorProfanity(text: string): string

// Get warning message
getProfanityWarning(text: string): string | null

// Validate and censor in one call
validateAndCensor(text: string): {
  censored: string;
  hasProfanity: boolean;
  warning: string | null;
}
```

**Word Lists:**
- English: 25+ common inappropriate words
- Tagalog: 20+ Filipino inappropriate words and phrases
- Easily extensible - add more words to the arrays

### 2. FilteredInput Component (`/components/common/FilteredInput.tsx`)

Reusable input component with automatic profanity filtering:

```typescript
<FilteredInput
  value={text}
  onChange={(value) => setText(value)}
  placeholder="Enter text..."
  showWarning={true} // Optional, defaults to true
  onProfanityDetected={(hasProfanity) => {
    // Optional callback
  }}
/>
```

**Features:**
- Automatic censoring on input change
- Red warning indicator icon
- Warning message with slide-down animation
- Auto-hide warning after 3 seconds
- Full TypeScript support

### 3. FilteredTextarea Component (`/components/common/FilteredTextarea.tsx`)

Multi-line text input with profanity filtering:

```typescript
<FilteredTextarea
  value={text}
  onChange={(value) => setText(value)}
  placeholder="Write your story..."
  showWarning={true}
  rows={5}
/>
```

**Features:**
- Same filtering as FilteredInput
- Supports multi-line text
- Resizable textarea
- Warning indicator in top-right corner

### 4. Custom Hook (`/hooks/useProfanityFilter.ts`)

React hook for advanced profanity filtering:

```typescript
const {
  value,
  setValue,
  hasProfanity,
  warning,
  checkProfanity,
  reset
} = useProfanityFilter('initial value');
```

## CSS Styling

### Light Mode
- **Warning Border**: Red (#ef4444)
- **Warning Background**: Light red (#fef2f2)
- **Warning Text**: Dark red (#dc2626)
- **Icon Color**: Red with pulse animation

### Dark Mode
- **Warning Border**: Dark red (#991b1b)
- **Warning Background**: Very dark red (#450a0a)
- **Warning Text**: Light red (#fca5a5)
- **Consistent icon styling**

### Animations
- **Pulse**: Warning icon pulses every 2 seconds
- **Slide Down**: Warning message slides down smoothly
- **Smooth Transitions**: 0.2s ease transitions on all states

## Integration Points

### ✅ Manual Story Creation Page
- **Story Title Input**: Filters inappropriate story titles
- **Page Text Textarea**: Filters story content

### ✅ AI Story Modal
- **Story Idea Textarea**: Filters AI story prompts

### ✅ Profile Edit Modal
- **Display Name Input**: Filters user profile names

### ✅ Ready for More
The components can be easily added to:
- Comment sections
- Chat/messaging features
- User bio fields
- Any other text input in the app

## How It Works

### 1. User Types Text
```
User types: "This is a bad word"
```

### 2. Automatic Detection
```
System detects: "bad" matches profanity list
```

### 3. Censoring Applied
```
Text becomes: "This is a b*d word"
```

### 4. Visual Warning
```
- Red border appears on input
- Warning triangle icon shows
- Message: "Inappropriate language detected and censored"
```

### 5. Auto-Hide
```
Warning message fades after 3 seconds
Icon remains visible while profanity exists
```

## Technical Details

### Pattern Matching
- Uses regex with word boundaries (`\b`)
- Handles letter substitutions (a→@, e→3, i→1, o→0, s→$, t→7)
- Allows spaces, hyphens, underscores between letters
- Case-insensitive matching

### Performance
- Efficient regex patterns
- Minimal re-renders with React hooks
- Debounced warning display
- GPU-accelerated CSS animations

### Accessibility
- Clear visual indicators
- Color contrast compliant
- Screen reader friendly
- Keyboard navigation support

## Customization

### Adding More Words

Edit `/utils/profanityFilter.ts`:

```typescript
const ENGLISH_PROFANITY: string[] = [
  'existing words...',
  'new-word-1',
  'new-word-2',
];

const TAGALOG_PROFANITY: string[] = [
  'existing words...',
  'bagong salita',
];
```

### Adjusting Warning Duration

Edit component timeout:

```typescript
// In FilteredInput.tsx or FilteredTextarea.tsx
timeoutRef.current = setTimeout(() => {
  setShowWarningMessage(false);
}, 5000); // Change from 3000 to 5000 for 5 seconds
```

### Customizing Censoring Style

Edit `/utils/profanityFilter.ts`:

```typescript
export function censorProfanity(text: string): string {
  // Current: Keeps first and last letter
  return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
  
  // Alternative: Full censoring
  return '*'.repeat(match.length);
  
  // Alternative: Custom replacement
  return '[CENSORED]';
}
```

## Benefits

### For Children
- ✅ Safe content creation environment
- ✅ Educational - learns appropriate language
- ✅ Non-intrusive - doesn't block typing
- ✅ Clear feedback on inappropriate words

### For Parents/Teachers
- ✅ Automatic content moderation
- ✅ Bilingual protection (English + Tagalog)
- ✅ Visible warnings for monitoring
- ✅ Prevents inappropriate content sharing

### For Developers
- ✅ Reusable components
- ✅ Easy to integrate
- ✅ Extensible word lists
- ✅ TypeScript support
- ✅ Well-documented code

## Testing

### Test Cases
1. **English profanity**: Type common bad words
2. **Tagalog profanity**: Type Filipino bad words
3. **Variations**: Try l33t speak (b@d, sh1t)
4. **Spacing**: Try "b a d" with spaces
5. **Mixed content**: Good words + bad words
6. **Case sensitivity**: UPPERCASE, lowercase, MiXeD

### Expected Behavior
- ✅ All profanity censored automatically
- ✅ Warning appears immediately
- ✅ Warning disappears after 3 seconds
- ✅ Red border remains while profanity exists
- ✅ Clean text has no warnings

## Files Created/Modified

### New Files
- `/utils/profanityFilter.ts` - Core filtering logic
- `/components/common/FilteredInput.tsx` - Filtered input component
- `/components/common/FilteredTextarea.tsx` - Filtered textarea component
- `/hooks/useProfanityFilter.ts` - Custom React hook
- `/PROFANITY_FILTER_IMPLEMENTATION.md` - This documentation

### Modified Files
- `/index.css` - Added 200+ lines of profanity filter CSS
- `/pages/ManualStoryCreationPage.tsx` - Integrated filtered components
- `/components/creation/AIStoryModal.tsx` - Integrated filtered textarea
- `/components/settings/ProfileEditModal.tsx` - Integrated filtered input

## Future Enhancements

### Potential Improvements
1. **Admin Dashboard**: Manage word lists without code changes
2. **Severity Levels**: Mild/moderate/severe profanity categories
3. **Custom Filters**: Per-user or per-group word lists
4. **Reporting**: Track profanity usage for moderation
5. **AI Detection**: Use ML for context-aware filtering
6. **More Languages**: Spanish, French, etc.
7. **Phrase Detection**: Multi-word inappropriate phrases
8. **Whitelist**: Allow certain words in specific contexts

## Support

For questions or issues with the profanity filter system:
1. Check this documentation
2. Review component source code
3. Test with various inputs
4. Extend word lists as needed

---

**Note**: The profanity filter is designed to be helpful and educational, not punitive. It censors content automatically while providing clear feedback to help users learn appropriate language.
