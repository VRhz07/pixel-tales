# Dark Mode Logo Switching

## Overview
The logo now automatically switches between light and dark versions when dark mode is toggled, providing better contrast and visual consistency.

## Implementation

### Logo Component
Created a reusable `Logo` component at `frontend/src/components/common/Logo.tsx` that:
- Automatically detects the current theme using `useThemeStore`
- Switches between two logo variants:
  - **Light Mode**: `frontend/src/assets/logo.png` (original logo with dark text)
  - **Dark Mode**: `frontend/public/logo__darkmode-toggle.png` (optimized for dark backgrounds)

### Component Usage
The Logo component can be used anywhere in the app with the same API as a regular `<img>` tag:

```tsx
import Logo from '../components/common/Logo';

// Basic usage
<Logo />

// With custom size
<Logo width="200px" height="200px" />

// With custom styling
<Logo style={{ objectFit: 'contain' }} />

// With className
<Logo className="my-custom-class" />
```

## Updated Files
All logo instances have been updated to use the new Logo component:

1. **frontend/src/components/auth/AuthPage.tsx** - Login/signup page logo
2. **frontend/src/components/admin/AdminLoginPage.tsx** - Admin login page logo
3. **frontend/src/components/pages/HomePage.tsx** - Home page hero logo
4. **frontend/src/components/pages/SettingsPage.tsx** - Settings page footer logo
5. **frontend/src/pages/AdminDashboardPage.tsx** - Admin dashboard header logo
6. **frontend/src/pages/ParentDashboardPage.tsx** - Parent dashboard header logo

## How It Works
1. The Logo component subscribes to the `themeStore` to detect dark mode state
2. When `isDarkMode` is `true`, it displays `logo__darkmode-toggle.png`
3. When `isDarkMode` is `false`, it displays the original `logo.png`
4. The switch happens automatically and instantly when users toggle dark mode

## Benefits
- **Better UX**: Logo maintains optimal contrast in both light and dark modes
- **Automatic**: No manual intervention needed - switches automatically with theme
- **Reusable**: Single component used across the entire application
- **Type-safe**: Full TypeScript support with proper props interface
- **Flexible**: Accepts all standard image props (width, height, style, className, etc.)

## Testing
To verify the implementation:
1. Navigate to Settings page
2. Toggle Dark Mode on/off
3. Observe the logo change throughout the application
4. Check all pages where logo appears (Auth, Home, Settings, Admin, Parent Dashboard)

## Technical Details
- The component uses React hooks for theme detection
- Logo paths are imported as static assets for optimal bundling
- The dark mode logo is loaded from the public folder for easy replacement
- No performance impact - both logos are bundled efficiently by Vite
