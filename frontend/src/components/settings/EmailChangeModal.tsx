import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSave: (newEmail: string, password: string) => Promise<void>;
}

export const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSave,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('EmailChangeModal render - isOpen:', isOpen);
  console.log('EmailChangeModal - About to check if open');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    setError('');

    // Validation
    if (!newEmail || !confirmEmail || !password) {
      setError('All fields are required');
      return;
    }

    if (!validateEmail(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (newEmail !== confirmEmail) {
      setError('Email addresses do not match');
      return;
    }

    if (newEmail === currentEmail) {
      setError('New email must be different from current email');
      return;
    }

    setIsLoading(true);

    try {
      await onSave(newEmail, password);
      onClose();
      // Reset form
      setNewEmail('');
      setConfirmEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="account-modal-backdrop" onClick={onClose}>
      <div className="account-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="account-modal-header">
          <div className="account-modal-header-content">
            <div className="account-modal-icon">
              <EnvelopeIcon className="w-5 h-5" />
            </div>
            <h2 className="account-modal-title">Change Email</h2>
          </div>
          <button onClick={onClose} className="account-modal-close">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="account-modal-body">
          {/* Current Email */}
          <div className="account-modal-section">
            <label className="account-modal-label">Current Email</label>
            <input
              type="text"
              value={currentEmail}
              disabled
              className="account-modal-input"
            />
          </div>

          {/* New Email */}
          <div className="account-modal-section">
            <label className="account-modal-label">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="account-modal-input"
              placeholder="Enter new email"
            />
          </div>

          {/* Confirm Email */}
          <div className="account-modal-section">
            <label className="account-modal-label">Confirm New Email</label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="account-modal-input"
              placeholder="Confirm new email"
            />
          </div>

          {/* Password Confirmation */}
          <div className="account-modal-section">
            <label className="account-modal-label">Current Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="account-modal-input"
              placeholder="Enter your password"
            />
            <p className="account-modal-helper">Required to confirm this change</p>
          </div>

          {/* Info Box */}
          <div className="account-modal-info">
            <p className="account-modal-info-text">
              📧 A verification email will be sent to your new address
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="account-modal-error">
              <p className="account-modal-error-text">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="account-modal-footer">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="account-modal-button account-modal-button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !newEmail || !confirmEmail || !password}
            className="account-modal-button account-modal-button-primary"
          >
            {isLoading ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
