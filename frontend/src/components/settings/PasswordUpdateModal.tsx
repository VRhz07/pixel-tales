import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface PasswordUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const PasswordUpdateModal: React.FC<PasswordUpdateModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('PasswordUpdateModal render - isOpen:', isOpen);

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return null;
  };

  const handleSave = async () => {
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      await onSave(currentPassword, newPassword);
      onClose();
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength: 66, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (!isOpen) return null;

  const modalContent = (
    <div className="account-modal-backdrop" onClick={onClose}>
      <div className="account-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="account-modal-header">
          <div className="account-modal-header-content">
            <div className="account-modal-icon">
              <LockClosedIcon className="w-5 h-5" />
            </div>
            <h2 className="account-modal-title">Update Password</h2>
          </div>
          <button onClick={onClose} className="account-modal-close">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="account-modal-body">
          {/* Current Password */}
          <div className="account-modal-section">
            <label className="account-modal-label">Current Password</label>
            <div className="account-modal-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="account-modal-input account-modal-input-with-icon"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="account-modal-input-icon"
              >
                {showCurrentPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="account-modal-section">
            <label className="account-modal-label">New Password</label>
            <div className="account-modal-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="account-modal-input account-modal-input-with-icon"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="account-modal-input-icon"
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="account-modal-strength">
                <div className="account-modal-strength-header">
                  <span className="account-modal-strength-label">Password Strength:</span>
                  <span className={`account-modal-strength-value ${
                    passwordStrength.label === 'Weak' ? 'account-modal-strength-value-weak' :
                    passwordStrength.label === 'Medium' ? 'account-modal-strength-value-medium' :
                    'account-modal-strength-value-strong'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="account-modal-strength-bar">
                  <div 
                    className={`account-modal-strength-fill ${
                      passwordStrength.label === 'Weak' ? 'account-modal-strength-fill-weak' :
                      passwordStrength.label === 'Medium' ? 'account-modal-strength-fill-medium' :
                      'account-modal-strength-fill-strong'
                    }`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="account-modal-section">
            <label className="account-modal-label">Confirm New Password</label>
            <div className="account-modal-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="account-modal-input account-modal-input-with-icon"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="account-modal-input-icon"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="account-modal-requirements">
            <p className="account-modal-requirements-title">Password must contain:</p>
            <div className="account-modal-requirements-list">
              <div className="account-modal-requirement">
                <span className={`account-modal-requirement-icon ${
                  newPassword.length >= 8 ? 'account-modal-requirement-met' : 'account-modal-requirement-unmet'
                }`}>
                  {newPassword.length >= 8 ? '✓' : '○'}
                </span>
                <span>At least 8 characters</span>
              </div>
              <div className="account-modal-requirement">
                <span className={`account-modal-requirement-icon ${
                  /[A-Z]/.test(newPassword) ? 'account-modal-requirement-met' : 'account-modal-requirement-unmet'
                }`}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>One uppercase letter</span>
              </div>
              <div className="account-modal-requirement">
                <span className={`account-modal-requirement-icon ${
                  /[a-z]/.test(newPassword) ? 'account-modal-requirement-met' : 'account-modal-requirement-unmet'
                }`}>
                  {/[a-z]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>One lowercase letter</span>
              </div>
              <div className="account-modal-requirement">
                <span className={`account-modal-requirement-icon ${
                  /[0-9]/.test(newPassword) ? 'account-modal-requirement-met' : 'account-modal-requirement-unmet'
                }`}>
                  {/[0-9]/.test(newPassword) ? '✓' : '○'}
                </span>
                <span>One number</span>
              </div>
            </div>
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
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            className="account-modal-button account-modal-button-primary"
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
