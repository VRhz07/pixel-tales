# Voice Input Usage Examples

## Quick Start

### 1. Simple Voice Button
Just add a microphone button that captures speech:

```tsx
import { VoiceInput } from './components/common/VoiceInput';

function MyComponent() {
  const handleTranscript = (text: string) => {
    console.log('User said:', text);
  };

  return (
    <VoiceInput
      onTranscript={handleTranscript}
      size="md"
    />
  );
}
```

### 2. Input Field with Voice
Replace any FilteredInput with VoiceFilteredInput:

```tsx
import { VoiceFilteredInput } from './components/common/VoiceFilteredInput';

function StoryTitleInput() {
  const [title, setTitle] = useState('');

  return (
    <VoiceFilteredInput
      value={title}
      onChange={setTitle}
      placeholder="Type or speak your story title..."
      maxLength={100}
    />
  );
}
```

### 3. Textarea with Voice
Replace any FilteredTextarea with VoiceFilteredTextarea:

```tsx
import { VoiceFilteredTextarea } from './components/common/VoiceFilteredTextarea';

function StoryEditor() {
  const [content, setContent] = useState('');

  return (
    <VoiceFilteredTextarea
      value={content}
      onChange={setContent}
      placeholder="Write or speak your story..."
      rows={8}
    />
  );
}
```

## Integration Examples

### AI Story Modal
**File**: `src/components/creation/AIStoryModal.tsx`

```tsx
import { VoiceFilteredTextarea } from '../common/VoiceFilteredTextarea';
import { useI18nStore } from '../../stores/i18nStore';

export const AIStoryModal = () => {
  const [storyIdea, setStoryIdea] = useState('');
  const { t } = useI18nStore();

  return (
    <div className="ai-story-modal">
      <h2>{t('ai.title')}</h2>
      
      <VoiceFilteredTextarea
        value={storyIdea}
        onChange={setStoryIdea}
        placeholder={t('ai.storyIdeaPlaceholder')}
        rows={4}
        showWarning={true}
      />
      
      <button onClick={generateStory}>
        {t('ai.generate')}
      </button>
    </div>
  );
};
```

### Manual Story Creation Page
**File**: `src/pages/ManualStoryCreationPage.tsx`

```tsx
import { VoiceFilteredInput } from '../components/common/VoiceFilteredInput';
import { VoiceFilteredTextarea } from '../components/common/VoiceFilteredTextarea';

export const ManualStoryCreationPage = () => {
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState([{ text: '' }]);
  const [currentPage, setCurrentPage] = useState(0);

  const updatePageText = (pageIndex: number, text: string) => {
    const newPages = [...pages];
    newPages[pageIndex].text = text;
    setPages(newPages);
  };

  return (
    <div className="manual-story-creation">
      {/* Story Title with Voice */}
      <section>
        <h3>Story Title</h3>
        <VoiceFilteredInput
          value={title}
          onChange={setTitle}
          placeholder="Type or speak your story title..."
          maxLength={100}
        />
      </section>

      {/* Page Editor with Voice */}
      <section>
        <h3>Page {currentPage + 1}</h3>
        <VoiceFilteredTextarea
          value={pages[currentPage].text}
          onChange={(text) => updatePageText(currentPage, text)}
          placeholder="Write or speak your story..."
          rows={8}
        />
      </section>
    </div>
  );
};
```

### Profile Edit Modal
**File**: `src/components/settings/ProfileEditModal.tsx`

```tsx
import { VoiceFilteredInput } from '../common/VoiceFilteredInput';

export const ProfileEditModal = () => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  return (
    <div className="profile-edit-modal">
      <h2>Edit Profile</h2>
      
      {/* Name with Voice */}
      <div className="form-group">
        <label>Display Name</label>
        <VoiceFilteredInput
          value={displayName}
          onChange={setDisplayName}
          placeholder="Type or speak your name..."
          maxLength={50}
        />
      </div>

      {/* Bio with Voice */}
      <div className="form-group">
        <label>Bio</label>
        <VoiceFilteredTextarea
          value={bio}
          onChange={setBio}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={200}
        />
      </div>
    </div>
  );
};
```

### Comment Section
**File**: `src/components/social/CommentSection.tsx`

```tsx
import { VoiceFilteredTextarea } from '../common/VoiceFilteredTextarea';

export const CommentSection = () => {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (comment.trim()) {
      // Submit comment
      setComment('');
    }
  };

  return (
    <div className="comment-section">
      <h3>Add a Comment</h3>
      
      <VoiceFilteredTextarea
        value={comment}
        onChange={setComment}
        placeholder="Type or speak your comment..."
        rows={3}
        maxLength={500}
      />
      
      <button onClick={handleSubmit}>
        Post Comment
      </button>
    </div>
  );
};
```

### Search Bar with Voice
**File**: `src/components/search/SearchBar.tsx`

```tsx
import { VoiceFilteredInput } from '../common/VoiceFilteredInput';

export const SearchBar = () => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    // Perform search
    console.log('Searching for:', query);
  };

  return (
    <div className="search-bar">
      <VoiceFilteredInput
        value={query}
        onChange={setQuery}
        placeholder="Type or speak to search..."
        showWarning={false}
      />
      
      <button onClick={handleSearch}>
        Search
      </button>
    </div>
  );
};
```

## Advanced Usage

### Custom Voice Handler
Handle voice input with custom logic:

```tsx
import { VoiceInput } from './components/common/VoiceInput';

function AdvancedVoiceComponent() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceTranscript = async (transcript: string) => {
    setIsProcessing(true);
    
    // Custom processing (e.g., AI enhancement, translation)
    const processed = await processText(transcript);
    
    setText(prev => prev + ' ' + processed);
    setIsProcessing(false);
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    // Show custom error UI
  };

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      
      <VoiceInput
        onTranscript={handleVoiceTranscript}
        onError={handleVoiceError}
        size="lg"
        showTranscript={true}
      />
      
      {isProcessing && <div>Processing voice input...</div>}
    </div>
  );
}
```

### Conditional Voice Button
Show voice button only when supported:

```tsx
import { VoiceFilteredInput } from './components/common/VoiceFilteredInput';

function ConditionalVoice() {
  const [text, setText] = useState('');
  
  // Voice button automatically hides if not supported
  return (
    <VoiceFilteredInput
      value={text}
      onChange={setText}
      placeholder="Enter text..."
    />
  );
}
```

### Multi-language Voice Input
Voice automatically uses current app language:

```tsx
import { VoiceFilteredTextarea } from './components/common/VoiceFilteredTextarea';
import { useI18nStore } from '../stores/i18nStore';

function MultilingualEditor() {
  const [text, setText] = useState('');
  const { language, t } = useI18nStore();

  return (
    <div>
      <p>Current language: {language === 'en' ? 'English' : 'Tagalog'}</p>
      
      {/* Voice recognition automatically uses current language */}
      <VoiceFilteredTextarea
        value={text}
        onChange={setText}
        placeholder={t('editor.placeholder')}
        rows={6}
      />
    </div>
  );
}
```

## Best Practices

### 1. User Guidance
Provide clear instructions for first-time users:

```tsx
function VoiceEnabledForm() {
  const [showTip, setShowTip] = useState(true);

  return (
    <div>
      {showTip && (
        <div className="tip">
          💡 Click the microphone button to speak instead of typing!
          <button onClick={() => setShowTip(false)}>Got it</button>
        </div>
      )}
      
      <VoiceFilteredInput
        value={text}
        onChange={setText}
        placeholder="Type or speak..."
      />
    </div>
  );
}
```

### 2. Error Handling
Handle voice errors gracefully:

```tsx
function RobustVoiceInput() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <VoiceFilteredInput
        value={text}
        onChange={setText}
        placeholder="Enter text..."
      />
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

### 3. Accessibility
Ensure keyboard users can access all features:

```tsx
function AccessibleVoice() {
  return (
    <div>
      <label htmlFor="story-input">Story Text</label>
      <VoiceFilteredTextarea
        value={text}
        onChange={setText}
        placeholder="Type or speak your story..."
        rows={6}
      />
      <p className="help-text">
        Press Tab to navigate, Enter to activate voice input
      </p>
    </div>
  );
}
```

### 4. Mobile Optimization
Voice input works great on mobile:

```tsx
function MobileOptimized() {
  return (
    <div className="mobile-editor">
      {/* Larger voice button on mobile */}
      <VoiceFilteredTextarea
        value={text}
        onChange={setText}
        placeholder="Tap mic to speak..."
        rows={4}
      />
    </div>
  );
}
```

## Testing

### Test Voice Recognition
```tsx
function VoiceTest() {
  const [results, setResults] = useState<string[]>([]);

  const handleTranscript = (text: string) => {
    setResults(prev => [...prev, text]);
  };

  return (
    <div>
      <h2>Voice Recognition Test</h2>
      <VoiceInput
        onTranscript={handleTranscript}
        size="lg"
        showTranscript={true}
      />
      
      <h3>Results:</h3>
      <ul>
        {results.map((result, i) => (
          <li key={i}>{result}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Migration Guide

### From FilteredInput to VoiceFilteredInput

**Before:**
```tsx
import { FilteredInput } from './components/common/FilteredInput';

<FilteredInput
  value={text}
  onChange={setText}
  placeholder="Enter text..."
/>
```

**After:**
```tsx
import { VoiceFilteredInput } from './components/common/VoiceFilteredInput';

<VoiceFilteredInput
  value={text}
  onChange={setText}
  placeholder="Type or speak..."
/>
```

### From FilteredTextarea to VoiceFilteredTextarea

**Before:**
```tsx
import { FilteredTextarea } from './components/common/FilteredTextarea';

<FilteredTextarea
  value={text}
  onChange={setText}
  rows={6}
/>
```

**After:**
```tsx
import { VoiceFilteredTextarea } from './components/common/VoiceFilteredTextarea';

<VoiceFilteredTextarea
  value={text}
  onChange={setText}
  rows={6}
/>
```

All existing props work the same way! Just import the Voice version instead.
