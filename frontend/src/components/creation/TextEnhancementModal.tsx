import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';
import { textEnhancementService, EnhancementType } from '../../services/textEnhancementService';
import './TextEnhancementModal.css';

interface TextEnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApply: (enhancedText: string) => void;
  enhancementType: EnhancementType;
}

const TextEnhancementModal: React.FC<TextEnhancementModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApply,
  enhancementType
}) => {
  const [enhancedText, setEnhancedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasEnhanced, setHasEnhanced] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen && originalText) {
      enhanceText();
    }
  }, [isOpen, originalText, enhancementType]);

  const enhanceText = async () => {
    setIsLoading(true);
    setError('');
    setHasEnhanced(false);
    
    try {
      const result = await textEnhancementService.enhance(originalText, enhancementType);
      setEnhancedText(result.enhancedText);
      setHasEnhanced(true);
    } catch (err: any) {
      setError(err.message || 'Failed to enhance text. Please try again.');
      setEnhancedText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (enhancedText) {
      onApply(enhancedText);
      onClose();
    }
  };

  const handleClose = () => {
    setEnhancedText('');
    setError('');
    setHasEnhanced(false);
    onClose();
  };

  const getEnhancementTitle = () => {
    switch (enhancementType) {
      case 'grammar':
        return 'Fix Grammar & Spelling';
      case 'extend':
        return 'Extend Text';
      case 'simplify':
        return 'Simplify Text';
      case 'creative':
        return 'Make More Creative';
      default:
        return 'Enhance Text';
    }
  };

  const getEnhancementDescription = () => {
    switch (enhancementType) {
      case 'grammar':
        return 'Correcting grammar and spelling errors...';
      case 'extend':
        return 'Adding more details and descriptions...';
      case 'simplify':
        return 'Making it easier to understand...';
      case 'creative':
        return 'Adding creativity and imagination...';
      default:
        return 'Enhancing your text...';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="text-enhancement-modal-overlay" onClick={handleClose}>
      <div className="text-enhancement-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="text-enhancement-modal-header">
          <div className="text-enhancement-modal-title-container">
            <SparklesIcon className="text-enhancement-modal-icon" />
            <h2 className="text-enhancement-modal-title">{getEnhancementTitle()}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-enhancement-modal-close-button"
            aria-label="Close"
          >
            <XMarkIcon />
          </button>
        </div>

        {/* Content */}
        <div className="text-enhancement-modal-body">
          {isLoading && (
            <div className="text-enhancement-loading">
              <div className="text-enhancement-spinner"></div>
              <p className="text-enhancement-loading-text">{getEnhancementDescription()}</p>
            </div>
          )}

          {error && (
            <div className="text-enhancement-error">
              <p className="text-enhancement-error-text">{error}</p>
              <button
                onClick={enhanceText}
                className="text-enhancement-retry-button"
              >
                Try Again
              </button>
            </div>
          )}

          {hasEnhanced && !isLoading && !error && (
            <div className="text-enhancement-comparison">
              {/* Original Text */}
              <div className="text-enhancement-section">
                <h3 className="text-enhancement-section-title">Original Text</h3>
                <div className="text-enhancement-text-box text-enhancement-original">
                  {originalText}
                </div>
              </div>

              {/* Arrow/Divider */}
              <div className="text-enhancement-arrow">
                <svg 
                  className="text-enhancement-arrow-icon" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </div>

              {/* Enhanced Text */}
              <div className="text-enhancement-section">
                <h3 className="text-enhancement-section-title">Enhanced Text</h3>
                <div className="text-enhancement-text-box text-enhancement-enhanced">
                  {enhancedText}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {hasEnhanced && !isLoading && !error && (
          <div className="text-enhancement-modal-footer">
            <button
              onClick={handleClose}
              className="text-enhancement-button text-enhancement-button-cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="text-enhancement-button text-enhancement-button-apply"
            >
              <CheckIcon className="text-enhancement-button-icon" />
              Apply Enhancement
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextEnhancementModal;
