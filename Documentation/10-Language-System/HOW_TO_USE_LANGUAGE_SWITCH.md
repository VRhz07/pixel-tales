# How to Use Language Switch - Tagalog Support

## For Users

### Switching to Tagalog

1. **Open Settings**
   - Tap the Settings icon in the bottom navigation (gear icon)

2. **Find Language Option**
   - Scroll to the "Appearance" section
   - Look for "Language / Wika"

3. **Select Tagalog**
   - Tap the dropdown menu
   - Choose "🇵🇭 Tagalog"
   - The interface updates immediately!

4. **See the Changes**
   - Navigation: Home → Tahanan, Library → Aklatan, Profile → Propil
   - All buttons and labels translate automatically

### Creating Stories in Tagalog

1. **Go to Home** (Tahanan)
2. **Click "Start Creating"** or AI Story option
3. **Enter your story idea in Tagalog**
   - Example: "Isang masayang bata na naglalaro sa parke"
   - Example: "Ang alamat ng magandang prinsesa"
4. **Generate Story**
   - The AI will write the entire story in Tagalog!
   - Illustrations will still be beautiful and accurate

### Switching Back to English

1. Go to Settings
2. Find "Language / Wika"
3. Select "🇺🇸 English"
4. Everything switches back instantly

---

## For Developers

### Using Translations in Components

```typescript
import { useI18nStore } from '../../stores/i18nStore';

const MyComponent = () => {
  const { t, language, setLanguage } = useI18nStore();
  
  return (
    <div>
      {/* Simple translation */}
      <h1>{t('home.title')}</h1>
      
      {/* Button with translation */}
      <button>{t('common.save')}</button>
      
      {/* Conditional rendering based on language */}
      {language === 'tl' && <p>Kumusta!</p>}
      
      {/* Programmatic language change */}
      <button onClick={() => setLanguage('tl')}>
        Switch to Tagalog
      </button>
    </div>
  );
};
```

### Adding New Translation Keys

1. **Open** `/stores/i18nStore.ts`
2. **Add to translations object**:

```typescript
const translations: Translations = {
  // ... existing translations
  
  'myPage.title': { 
    en: 'My Page Title', 
    tl: 'Pamagat ng Aking Pahina' 
  },
  'myPage.description': { 
    en: 'This is a description', 
    tl: 'Ito ay isang paglalarawan' 
  },
};
```

3. **Use in component**:

```typescript
<h1>{t('myPage.title')}</h1>
<p>{t('myPage.description')}</p>
```

### Translation Key Naming Convention

Use dot notation for organization:
- `nav.*` - Navigation items
- `home.*` - Home page
- `library.*` - Library page
- `settings.*` - Settings page
- `auth.*` - Authentication
- `ai.*` - AI generation
- `canvas.*` - Canvas drawing
- `manual.*` - Manual creation
- `common.*` - Common actions/words
- `message.*` - System messages

### AI Story Generation with Language

The language is automatically passed to AI generation:

```typescript
// In AIStoryModal.tsx
const { language } = useI18nStore();

const generatedText = await generateStory({
  prompt: formData.storyIdea,
  genres: formData.selectedGenres,
  ageGroup: '6-8',
  artStyle: formData.selectedArtStyle || 'cartoon',
  pageCount: formData.pageCount,
  language: language // Automatically uses current language
});
```

### Testing Translations

1. **Switch language in Settings**
2. **Navigate through app**
3. **Check all translated elements**
4. **Test AI story generation**
5. **Verify persistence** (refresh page, language should remain)

---

## Translation Coverage

### ✅ Fully Translated:
- Navigation bar
- Settings page (language selector)
- AI story generation (stories in Tagalog)

### ⚠️ Partially Translated:
- Home page (structure ready, needs integration)
- Library page (structure ready, needs integration)

### ❌ Not Yet Translated:
- Profile page
- Social page
- Manual story creation page
- Canvas drawing page

### To Extend Translation Coverage:

1. Import `useI18nStore` in component
2. Replace hardcoded strings with `t('key')`
3. Add translation keys to `i18nStore.ts` if missing
4. Test in both languages

---

## Example: Full Page Translation

```typescript
import { useI18nStore } from '../../stores/i18nStore';

const LibraryPage = () => {
  const { t } = useI18nStore();
  
  return (
    <div>
      <h1>{t('library.title')}</h1>
      
      <div className="tabs">
        <button>{t('library.myStories')}</button>
        <button>{t('library.discover')}</button>
        <button>{t('library.bookmarks')}</button>
      </div>
      
      <div className="actions">
        <button>{t('library.read')}</button>
        <button>{t('library.edit')}</button>
        <button>{t('library.share')}</button>
      </div>
    </div>
  );
};
```

---

## Tips for Good Translations

### English to Tagalog Guidelines:

1. **Keep it natural** - Use everyday Tagalog, not formal
2. **Child-friendly** - Simple words for young readers
3. **Context matters** - Same English word may have different Tagalog translations
4. **Test with native speakers** - Verify translations sound natural

### Common Patterns:

| English | Tagalog | Notes |
|---------|---------|-------|
| Create | Lumikha | Action verb |
| Story | Kuwento | Noun |
| My Stories | Aking mga Kuwento | Possessive |
| Read | Basahin | Action verb |
| Save | I-save | Tech term, often kept |
| Settings | Settings | Tech term, often kept |
| Home | Tahanan | Navigation |
| Library | Aklatan | Place |

---

## Troubleshooting

### Translation not showing?
- Check if key exists in `i18nStore.ts`
- Verify component imports `useI18nStore`
- Check browser console for warnings

### Language not persisting?
- Check localStorage in browser DevTools
- Look for `i18n-storage` key
- Clear cache if needed

### AI not generating in Tagalog?
- Verify language is passed to `generateStory()`
- Check Gemini API response
- Ensure prompt is in Tagalog

---

## Future Enhancements

### Planned Features:
- [ ] Spanish translation
- [ ] French translation
- [ ] Auto-detect browser language
- [ ] Translation for all pages
- [ ] Pluralization support
- [ ] Date/time localization
- [ ] Number formatting

### How to Add New Language:

1. Update type in `i18nStore.ts`:
```typescript
export type Language = 'en' | 'tl' | 'es'; // Add 'es' for Spanish
```

2. Add translations:
```typescript
'home.title': { 
  en: 'Imaginary Worlds', 
  tl: 'Mga Kathang-Isip na Mundo',
  es: 'Mundos Imaginarios' // Add Spanish
},
```

3. Update Settings dropdown:
```typescript
<option value="es">🇪🇸 Español</option>
```

4. Update Gemini service language instructions

---

## Support

For questions or issues with translations:
1. Check this guide
2. Review `i18nStore.ts` for available keys
3. Test in both languages
4. Report missing translations

Happy translating! 🌍📚✨
