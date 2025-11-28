/**
 * Gradient Applied Confirmation Modal
 * Shows a success message when gradient is applied
 */

import React from 'react';
import './GradientAppliedModal.css';

interface GradientAppliedModalProps {
  isOpen: boolean;
  onClose: () => void;
  gradientPreview: string;
}

export const GradientAppliedModal: React.FC<GradientAppliedModalProps> = ({
  isOpen,
  onClose,
  gradientPreview
}) => {
  if (!isOpen) return null;

  return (
    <div className="gradient-modal-overlay" onClick={onClose}>
      <div className="gradient-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="gradient-modal-header">
          <h3 className="gradient-modal-title">🌈 Gradient Applied!</h3>
        </div>
        
        <div className="gradient-modal-body">
          <div 
            className="gradient-modal-preview"
            style={{ background: gradientPreview }}
          />
          
          <p className="gradient-modal-message">
            Your gradient is now active and ready to use!
          </p>
          
          <div className="gradient-modal-instructions">
            <h4>How to use:</h4>
            <ul>
              <li>🖌️ <strong>Brush tool</strong> - Paint with gradient strokes</li>
              <li>🪣 <strong>Fill tool</strong> - Fill shapes with gradient</li>
              <li>⬜ <strong>Shape tools</strong> - Draw shapes with gradient fill/outline</li>
            </ul>
          </div>
          
          <p className="gradient-modal-tip">
            💡 <strong>Tip:</strong> Select any solid color to switch back to regular colors
          </p>
        </div>
        
        <div className="gradient-modal-footer">
          <button 
            className="gradient-modal-button"
            onClick={onClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradientAppliedModal;
