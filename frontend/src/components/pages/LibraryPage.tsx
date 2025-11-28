import React, { useState, useEffect, useRef } from 'react';
import PublicLibraryPage from './PublicLibraryPage';
import PrivateLibraryPage from './PrivateLibraryPage';
import { 
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useNavigationStore } from '../../stores/navigationStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';

type LibraryType = 'public' | 'private';

const LibraryPage = () => {
  const { libraryActiveTab, libraryScrollPosition, setLibraryActiveTab, setLibraryScrollPosition } = useNavigationStore();
  const { t } = useI18nStore();
  const { playButtonClick } = useSoundEffects();
  const [activeLibrary, setActiveLibrary] = useState<LibraryType>(libraryActiveTab);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Restore scroll position when component mounts
  useEffect(() => {
    if (scrollContainerRef.current && libraryScrollPosition > 0) {
      scrollContainerRef.current.scrollTop = libraryScrollPosition;
    }
  }, []);

  // Save scroll position periodically
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setLibraryScrollPosition(scrollContainerRef.current.scrollTop);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [setLibraryScrollPosition]);

  // Save active tab when it changes
  useEffect(() => {
    setLibraryActiveTab(activeLibrary);
  }, [activeLibrary, setLibraryActiveTab]);

  const handleTabChange = (tab: LibraryType) => {
    playButtonClick();
    setActiveLibrary(tab);
    // Reset scroll to top when switching tabs
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="library-page">
      {/* Library Navigation */}
      <div className="library-navigation">
        <div className="library-nav-tabs">
          <button
            className={`library-nav-tab ${activeLibrary === 'public' ? 'active' : ''}`}
            onClick={() => handleTabChange('public')}
          >
            <GlobeAltIcon className="h-5 w-5" />
            <span>{t('library.discover')}</span>
          </button>
          <button
            className={`library-nav-tab ${activeLibrary === 'private' ? 'active' : ''}`}
            onClick={() => handleTabChange('private')}
          >
            <LockClosedIcon className="h-5 w-5" />
            <span>{t('library.title')}</span>
          </button>
        </div>
      </div>

      {/* Library Content */}
      <div className="library-content" ref={scrollContainerRef}>
        {activeLibrary === 'public' ? (
          <PublicLibraryPage />
        ) : (
          <PrivateLibraryPage />
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
