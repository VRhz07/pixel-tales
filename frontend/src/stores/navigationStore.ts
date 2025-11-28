import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  libraryScrollPosition: number;
  libraryActiveTab: 'public' | 'private';
  setLibraryScrollPosition: (position: number) => void;
  setLibraryActiveTab: (tab: 'public' | 'private') => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      libraryScrollPosition: 0,
      libraryActiveTab: 'private',
      setLibraryScrollPosition: (position) => set({ libraryScrollPosition: position }),
      setLibraryActiveTab: (tab) => set({ libraryActiveTab: tab }),
    }),
    {
      name: 'navigation-storage',
    }
  )
);
