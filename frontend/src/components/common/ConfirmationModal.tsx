import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useSoundEffects } from '../../hooks/useSoundEffects';

export type ConfirmationModalType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationModalType;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
}) => {
  const { playSound } = useSoundEffects();

  // Play sound when modal opens
  useEffect(() => {
    if (isOpen) {
      if (type === 'danger' || type === 'warning') {
        playSound('warning');
      } else if (type === 'success') {
        playSound('notification');
      } else {
        playSound('button-click');
      }
    }
  }, [isOpen, type, playSound]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ExclamationTriangleIcon className="confirmation-modal-icon confirmation-modal-icon-danger" />;
      case 'warning':
        return <ExclamationTriangleIcon className="confirmation-modal-icon confirmation-modal-icon-warning" />;
      case 'success':
        return <CheckCircleIcon className="confirmation-modal-icon confirmation-modal-icon-success" />;
      case 'info':
      default:
        return <InformationCircleIcon className="confirmation-modal-icon confirmation-modal-icon-info" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'confirmation-modal-button-danger';
      case 'warning':
        return 'confirmation-modal-button-warning';
      case 'success':
        return 'confirmation-modal-button-success';
      case 'info':
      default:
        return 'confirmation-modal-button-info';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      playSound('button-success');
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      playSound('button-cancel');
      onClose();
    }
  };

  return createPortal(
    <div className="confirmation-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirmation-modal-container">
        {/* Close Button */}
        <button
          className="confirmation-modal-close"
          onClick={handleCancel}
          disabled={isLoading}
          aria-label="Close modal"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="confirmation-modal-icon-container">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="confirmation-modal-content">
          <h3 className="confirmation-modal-title">{title}</h3>
          <p className="confirmation-modal-message">{message}</p>
        </div>

        {/* Actions */}
        <div className="confirmation-modal-actions">
          <button
            className="confirmation-modal-button confirmation-modal-button-cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-modal-button ${getConfirmButtonClass()}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="confirmation-modal-spinner" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
