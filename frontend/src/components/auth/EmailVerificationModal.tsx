import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { useThemeStore } from '../../stores/themeStore';
import './EmailVerificationModal.css';

interface EmailVerificationModalProps {
  email: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  onVerificationSuccess,
  onCancel,
}) => {
  const { theme } = useThemeStore();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Auto-focus first input on mount
  useEffect(() => {
    const firstInput = document.getElementById('code-input-0');
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setVerificationCode(digits);
      
      // Focus last input
      const lastInput = document.getElementById('code-input-5');
      if (lastInput) {
        lastInput.focus();
      }

      // Auto-submit
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await authService.verifyEmail(email, codeToVerify);
      
      if (response.verified) {
        setSuccess('Email verified successfully! Redirecting...');
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        setError(response.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.resendVerificationCode(email);
      
      if (response.email_sent) {
        setSuccess('New verification code sent! Check your email.');
        setResendCountdown(60); // 60 second cooldown
        setVerificationCode(['', '', '', '', '', '']);
        
        // Focus first input
        const firstInput = document.getElementById('code-input-0');
        if (firstInput) {
          firstInput.focus();
        }
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div 
      className="email-verification-overlay"
      onClick={onCancel}
    >
      <div 
        className={`email-verification-modal ${theme === 'dark' ? 'dark' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="email-verification-header">
          <div className="email-verification-icon">
            <EnvelopeIcon />
          </div>
          <h2 className="email-verification-title">
            Verify Your Email
          </h2>
          <p className="email-verification-subtitle">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="email-verification-success">
            <CheckCircleIcon />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="email-verification-error">
            <XCircleIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Code Inputs */}
        <div className="email-verification-code-inputs">
          {verificationCode.map((digit, index) => (
            <input
              key={index}
              id={`code-input-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={isVerifying || success !== ''}
              className={`email-verification-code-input ${digit ? 'filled' : ''}`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={isVerifying || verificationCode.some(d => !d) || success !== ''}
          className="email-verification-verify-btn"
        >
          {isVerifying ? 'Verifying...' : success ? 'Verified ✓' : 'Verify Email'}
        </button>

        {/* Resend Code */}
        <div className="email-verification-resend">
          <p className="email-verification-resend-text">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={isResending || resendCountdown > 0 || success !== ''}
            className="email-verification-resend-btn"
          >
            {isResending ? 'Sending...' : resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Help Text */}
        <div className="email-verification-help">
          <p>
            💡 <strong>Tip:</strong> Check your spam folder if you don't see the email. The code expires in 15 minutes.
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={success !== ''}
          className="email-verification-cancel-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
