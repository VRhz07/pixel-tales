import React, { useState, useEffect } from 'react';
import { KeyIcon, CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { useThemeStore } from '../../stores/themeStore';
import './ForgotPasswordModal.css';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const { theme } = useThemeStore();
  const [step, setStep] = useState<'email' | 'code' | 'newPassword'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Auto-focus based on step
  useEffect(() => {
    if (step === 'code') {
      const firstInput = document.getElementById('reset-code-input-0');
      if (firstInput) firstInput.focus();
    }
  }, [step]);

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.sendPasswordResetCode(email);
      
      if (response.email_sent) {
        setSuccess('Reset code sent to your email!');
        setResendCountdown(60);
        setStep('code');
      } else {
        setError('Failed to send reset code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...resetCode];
    newCode[index] = value;
    setResetCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      const prevInput = document.getElementById(`reset-code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setResetCode(digits);
      
      const lastInput = document.getElementById('reset-code-input-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = resetCode.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.verifyPasswordResetCode(email, code);
      
      if (response.verified) {
        setSuccess('Code verified! Please set your new password.');
        setStep('newPassword');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(email, resetCode.join(''), newPassword);
      
      if (response.success) {
        setSuccess('Password reset successfully! You can now sign in with your new password.');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.sendPasswordResetCode(email);
      
      if (response.email_sent) {
        setSuccess('New reset code sent!');
        setResendCountdown(60);
        setResetCode(['', '', '', '', '', '']);
        
        const firstInput = document.getElementById('reset-code-input-0');
        if (firstInput) firstInput.focus();
      } else {
        setError('Failed to resend code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-overlay" onClick={onClose}>
      <div 
        className={`forgot-password-modal ${theme === 'dark' ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="forgot-password-header">
          <div className="forgot-password-icon">
            <KeyIcon />
          </div>
          <h2 className="forgot-password-title">
            {step === 'email' && 'Reset Password'}
            {step === 'code' && 'Enter Reset Code'}
            {step === 'newPassword' && 'Set New Password'}
          </h2>
          <p className="forgot-password-subtitle">
            {step === 'email' && "Enter your email to receive a reset code"}
            {step === 'code' && `We sent a 6-digit code to ${email}`}
            {step === 'newPassword' && "Create a strong password for your account"}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="forgot-password-success">
            <CheckCircleIcon />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="forgot-password-error">
            <XCircleIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <form onSubmit={handleSendResetCode}>
            <div className="forgot-password-form-group">
              <label className="forgot-password-label">Email Address</label>
              <div className="forgot-password-input-wrapper">
                <EnvelopeIcon className="forgot-password-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="forgot-password-input"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="forgot-password-btn-primary"
            >
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="forgot-password-btn-secondary"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Step 2: Code Verification */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode}>
            <div className="forgot-password-code-inputs">
              {resetCode.map((digit, index) => (
                <input
                  key={index}
                  id={`reset-code-input-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className={`forgot-password-code-input ${digit ? 'filled' : ''}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || resetCode.some(d => !d)}
              className="forgot-password-btn-primary"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="forgot-password-resend">
              <p className="forgot-password-resend-text">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading || resendCountdown > 0}
                className="forgot-password-resend-btn"
              >
                {isLoading ? 'Sending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="forgot-password-btn-secondary"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 'newPassword' && (
          <form onSubmit={handleResetPassword}>
            <div className="forgot-password-form-group">
              <label className="forgot-password-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="forgot-password-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="forgot-password-form-group">
              <label className="forgot-password-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="forgot-password-input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="forgot-password-help">
              <p>
                💡 <strong>Tip:</strong> Use at least 8 characters with a mix of letters, numbers, and symbols.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="forgot-password-btn-primary"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="forgot-password-btn-secondary"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
