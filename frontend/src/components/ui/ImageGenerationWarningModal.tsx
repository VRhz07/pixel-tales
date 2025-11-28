import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  PaintBrushIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../../stores/themeStore';

interface ImageGenerationWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: string[];
}

export const ImageGenerationWarningModal: React.FC<ImageGenerationWarningModalProps> = ({
  isOpen,
  onClose,
  warnings
}) => {
  const { isDarkMode } = useThemeStore();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`warning-modal-container ${isDarkMode ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="warning-modal-icon-container">
          <div className="warning-modal-icon-circle">
            <ExclamationTriangleIcon className="warning-modal-icon" />
          </div>
        </div>

        {/* Title */}
        <h3 className="warning-modal-title">
          Story Created with Warnings
        </h3>

        {/* Subtitle */}
        <p className="warning-modal-subtitle">
          Your story text has been saved successfully, but some images failed to generate.
        </p>

        {/* Warning List */}
        <div className="warning-modal-list-container">
          <p className="warning-modal-list-title">What failed:</p>
          <div className="warning-modal-list">
            {warnings.map((warning, index) => (
              <div key={index} className="warning-modal-list-item">
                <span className="warning-modal-list-bullet">•</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="warning-modal-explanation">
          <p className="warning-modal-explanation-title">
            💡 Why did this happen?
          </p>
          <p className="warning-modal-explanation-text">
            The image generation service (Pollinations AI) is temporarily down or overloaded. 
            This is a free service that sometimes experiences high traffic.
          </p>
        </div>

        {/* Solutions */}
        <div className="warning-modal-solutions">
          <p className="warning-modal-solutions-title">
            ✨ What you can do:
          </p>
          <div className="warning-modal-solution-cards">
            <div className="warning-modal-solution-card">
              <div className="warning-modal-solution-icon-container warning-modal-solution-icon-purple">
                <PaintBrushIcon className="warning-modal-solution-icon" />
              </div>
              <div className="warning-modal-solution-content">
                <h4 className="warning-modal-solution-title">Draw Manually</h4>
                <p className="warning-modal-solution-description">
                  Use the canvas editor to add your own illustrations
                </p>
              </div>
            </div>
            <div className="warning-modal-solution-card">
              <div className="warning-modal-solution-icon-container warning-modal-solution-icon-blue">
                <ArrowPathIcon className="warning-modal-solution-icon" />
              </div>
              <div className="warning-modal-solution-content">
                <h4 className="warning-modal-solution-title">Try Again Later</h4>
                <p className="warning-modal-solution-description">
                  Regenerate the story when the service is back up
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="warning-modal-button"
        >
          Got it, Continue
        </button>
      </div>
    </div>
  );
};

export default ImageGenerationWarningModal;
