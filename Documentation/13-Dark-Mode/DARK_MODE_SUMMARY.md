# Dark Mode - Quick Reference

> **Implementation Date**: Mid Development  
> **Status**: ✅ Complete

---

## 🎯 What It Does

System-wide dark theme that automatically detects system preferences or allows manual selection, affecting all pages except the home page (which keeps its magical gradient design).

---

## ⚡ Key Features

- **Three Modes**: Light, Dark, Auto (follows system)
- **Smart Detection**: Automatically detects system dark mode preference
- **Home Page Exclusion**: Preserves magical gradient on home page
- **Complete Coverage**: All pages, modals, forms styled for dark mode
- **Persistent**: Theme preference saved to localStorage
- **Real-time Updates**: Instant theme switching without reload

---

## 🚀 How to Use

### For Users
1. Go to Profile → Settings → Appearance
2. Select theme from dropdown:
   - **Light**: Always light theme
   - **Dark**: Always dark theme
   - **Auto**: Follow system preference
3. Theme changes immediately
4. Preference saved for next visit

### For Developers
```typescript
import { useThemeStore } from '@/stores/themeStore';

// Access theme
const { theme, setTheme, initializeTheme } = useThemeStore();

// Initialize on app mount
useEffect(() => {
  initializeTheme();
}, []);

// Change theme
setTheme('dark'); // 'light' | 'dark' | 'auto'

// CSS classes automatically applied
// document.documentElement.classList contains 'dark'
```

---

## 📁 Files Modified/Created

| File | Type | Purpose |
|------|------|---------|
| `/stores/themeStore.ts` | Store | Theme state management |
| `/index.css` | Styles | Dark mode CSS variables |
| `/App.tsx` | Component | Theme initialization |
| `/pages/SettingsPage.tsx` | Component | Theme selector UI |

---

## 🔧 Technical Details

### Architecture
- **State Management**: Zustand with localStorage
- **CSS Variables**: HSL color system for easy theming
- **System Detection**: `window.matchMedia('(prefers-color-scheme: dark)')`
- **DOM Management**: Adds/removes 'dark' class on `<html>`

### Color System
```css
/* Light Mode */
--background: hsl(0, 0%, 100%);
--foreground: hsl(222.2, 84%, 4.9%);
--card: hsl(0, 0%, 100%);

/* Dark Mode */
--background: hsl(240, 10%, 12%);
--foreground: hsl(0, 0%, 95%);
--card: hsl(240, 10%, 15%);
```

### Styled Components
- Settings page cards and items
- Library page story cards
- Profile page sections
- Modals (profile edit, email change, password)
- Form inputs, textareas, selects
- Buttons and interactive elements

### Home Page Exclusion
```typescript
// In App.tsx
const isHomePage = location.pathname === '/' || location.pathname === '/home';

useEffect(() => {
  if (isHomePage) {
    document.documentElement.classList.remove('dark');
  } else if (theme === 'dark' || (theme === 'auto' && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
  }
}, [location.pathname, theme]);
```

---

## ✅ Benefits

- ✅ **Eye Comfort**: Reduces eye strain in low light
- ✅ **Battery Saving**: OLED screens use less power
- ✅ **User Preference**: Respects system settings
- ✅ **Accessibility**: Better for light-sensitive users
- ✅ **Modern**: Follows current design trends

---

## 🐛 Known Issues / Limitations

- Home page always stays light (by design)
- Some third-party components may not support dark mode
- Canvas drawing page uses black background regardless of theme

---

## 📚 Related Documentation

- [Settings Page](../05-Settings-Page/) - Theme selector location
- [Profile Page](../06-Profile-Page/) - Dark mode styling
- [Library Page](../07-Library-Page/) - Dark mode styling

---

## 💡 Future Improvements

- [ ] Custom theme colors
- [ ] High contrast mode
- [ ] Scheduled theme switching (day/night)
- [ ] Per-page theme preferences

---

**Last Updated**: October 2025  
**Color System**: HSL-based with semantic color variables
