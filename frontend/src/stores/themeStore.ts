import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  theme: ThemeMode;
  isDarkMode: boolean;
  animationsEnabled: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      isDarkMode: false,
      animationsEnabled: true,

      setTheme: (theme: ThemeMode) => {
        set({ theme });
        
        // Determine if dark mode should be active
        let isDark = false;
        
        if (theme === 'dark') {
          isDark = true;
        } else if (theme === 'auto') {
          // Check system preference
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        set({ isDarkMode: isDark });
        
        // Apply to document
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setAnimationsEnabled: (enabled: boolean) => {
        set({ animationsEnabled: enabled });
        
        // Apply animations class to document
        if (enabled) {
          document.documentElement.classList.remove('no-animations');
        } else {
          document.documentElement.classList.add('no-animations');
        }
      },

      initializeTheme: () => {
        const { theme, animationsEnabled } = get();
        
        // Determine if dark mode should be active
        let isDark = false;
        
        if (theme === 'dark') {
          isDark = true;
        } else if (theme === 'auto') {
          // Check system preference
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        set({ isDarkMode: isDark });
        
        // Apply to document
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Listen for system theme changes when in auto mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
          const { theme } = get();
          if (theme === 'auto') {
            const isDark = e.matches;
            set({ isDarkMode: isDark });
            
            if (isDark) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        
        // Initialize animations setting
        if (animationsEnabled) {
          document.documentElement.classList.remove('no-animations');
        } else {
          document.documentElement.classList.add('no-animations');
        }
      }
    }),
    {
      name: 'theme-settings'
    }
  )
);
