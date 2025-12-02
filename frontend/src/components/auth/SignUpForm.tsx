import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import FormInput from './FormInput';
import EmailVerificationModal from './EmailVerificationModal';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth.service';

const SignUpForm: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading: authLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'parent' // Default to parent since children don't sign up
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(() => {
    return localStorage.getItem('pendingEmailVerification') !== null;
  });
  const [registeredEmail, setRegisteredEmail] = useState(() => {
    return localStorage.getItem('pendingEmailVerification') || '';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        user_type: formData.userType,
      });

      // Check if email verification is required
      if (response.requires_verification) {
        setRegisteredEmail(formData.email);
        setShowVerificationModal(true);
        // Persist verification state across browser sessions
        localStorage.setItem('pendingEmailVerification', formData.email);
        localStorage.setItem('pendingRegistrationData', JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          userType: formData.userType
        }));
        setIsLoading(false);
      } else {
        // Old flow - auto login (shouldn't happen with new backend)
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async () => {
    // Get stored registration data
    const storedData = localStorage.getItem('pendingRegistrationData');
    const registrationData = storedData ? JSON.parse(storedData) : formData;
    
    // After successful verification, log the user in
    try {
      await signIn(registrationData.email, registrationData.password);
      
      // Clear stored verification data
      localStorage.removeItem('pendingEmailVerification');
      localStorage.removeItem('pendingRegistrationData');
      
      // Navigate based on user type
      if (registrationData.userType === 'parent' || registrationData.userType === 'teacher') {
        navigate('/parent-dashboard');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError('Verification successful! Please log in.');
      setShowVerificationModal(false);
      // Clear stored data even if login fails
      localStorage.removeItem('pendingEmailVerification');
      localStorage.removeItem('pendingRegistrationData');
      // Optionally switch to sign-in tab
    }
  };

  const handleCancelVerification = () => {
    setShowVerificationModal(false);
    setError('Email verification required. Please check your email or try again.');
    // Clear stored verification data when cancelled
    localStorage.removeItem('pendingEmailVerification');
    localStorage.removeItem('pendingRegistrationData');
  };


  return (
    <>
      {/* Email Verification Modal */}
      {showVerificationModal && (
        <EmailVerificationModal
          email={registeredEmail}
          onVerificationSuccess={handleVerificationSuccess}
          onCancel={handleCancelVerification}
        />
      )}

      <form onSubmit={handleSubmit}>
      {/* Error Message */}
      {error && (
        <div className="auth-error">
          <p>{error}</p>
        </div>
      )}

      {/* Name Input */}
      <FormInput
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        icon={<UserIcon />}
        required
      />

      {/* Email Input */}
      <FormInput
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        icon={<EnvelopeIcon />}
        required
      />

      {/* Password Input */}
      <FormInput
        label="Password"
        type="password"
        placeholder="Create a password"
        value={formData.password}
        onChange={(value) => setFormData({ ...formData, password: value })}
        icon={<LockClosedIcon />}
        required
      />

      {/* Confirm Password Input */}
      <FormInput
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
        icon={<LockClosedIcon />}
        required
      />

      {/* Password Requirements */}
      <div className="auth-password-requirements">
        <p>
          Password must be at least 8 characters long and include uppercase, lowercase, and numbers.
        </p>
      </div>

      {/* Sign Up Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="auth-button-secondary"
      >
        {isLoading ? (
          <>
            <div className="auth-spinner"></div>
            <span>Creating Account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>


      {/* Legal Text */}
      <p className="auth-legal">
        By creating an account, you agree to our{' '}
        <a href="/terms" className="auth-link underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="auth-link underline">
          Privacy Policy
        </a>
        . You also consent to receive product updates and marketing communications.
      </p>
      </form>
    </>
  );
};

export default SignUpForm;
