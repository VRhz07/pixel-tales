import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { STORY_GENRES } from '../../constants/genres';

interface SaveStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (genres: string[], description: string, language: string) => void;
  currentGenres?: string[];
  currentDescription?: string;
  currentLanguage?: string;
  storyTitle: string;
}

const SaveStoryModal: React.FC<SaveStoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentGenres = [],
  currentDescription = '',
  currentLanguage = 'en',
  storyTitle
}) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(currentGenres);
  const [description, setDescription] = useState(currentDescription);
  const [language, setLanguage] = useState<string>(currentLanguage);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGenres(currentGenres);
      setDescription(currentDescription);
      setLanguage(currentLanguage);
    }
  }, [isOpen, currentGenres, currentDescription, currentLanguage]);

  if (!isOpen) return null;

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSave = () => {
    onSave(selectedGenres, description, language);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="save-story-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="save-story-modal-container">
        {/* Header */}
        <div className="save-story-modal-header">
          <h2 className="save-story-modal-title">Save Story</h2>
          <button
            onClick={onClose}
            className="save-story-modal-close-button"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="save-story-modal-content">
          {/* Story Title Display */}
          <div className="save-story-modal-story-title">
            <span className="save-story-modal-story-title-label">Story:</span>
            <span className="save-story-modal-story-title-text">{storyTitle}</span>
          </div>

          {/* Genre Selection */}
          <div className="save-story-modal-section">
            <label className="save-story-modal-label">
              Select Genre(s) <span className="save-story-modal-optional">(select at least one)</span>
            </label>
            <div className="save-story-modal-genre-grid">
              {STORY_GENRES.map((genre: string) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`save-story-modal-genre-button ${
                    selectedGenres.includes(genre) ? 'selected' : ''
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="save-story-modal-section">
            <label className="save-story-modal-label">
              Story Language
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setLanguage('en')}
                className={`save-story-modal-genre-button ${
                  language === 'en' ? 'selected' : ''
                }`}
                style={{ flex: 1 }}
              >
                🇺🇸 English
              </button>
              <button
                onClick={() => setLanguage('tl')}
                className={`save-story-modal-genre-button ${
                  language === 'tl' ? 'selected' : ''
                }`}
                style={{ flex: 1 }}
              >
                🇵🇭 Tagalog
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="save-story-modal-section">
            <label className="save-story-modal-label">
              Description <span className="save-story-modal-optional">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a brief description of your story..."
              className="save-story-modal-textarea"
              rows={4}
              maxLength={500}
            />
            <div className="save-story-modal-char-count">
              {description.length}/500 characters
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="save-story-modal-footer">
          <button
            onClick={onClose}
            className="save-story-modal-button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedGenres.length === 0}
            className="save-story-modal-button-save"
          >
            Save Story
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveStoryModal;
