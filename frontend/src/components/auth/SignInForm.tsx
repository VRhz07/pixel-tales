import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import FormInput from './FormInput';
import ContinueWithoutAccount from './SocialButtons';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useAuthStore } from '../../stores/authStore';

const SignInForm: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setError('');
    
    // Don't submit if already loading
    if (isLoading) {
      return;
    }
    
    try {
      await signIn(formData.email, formData.password);
      
      // Get the user from auth store to check user type
      const { user } = useAuthStore.getState();
      
      // Redirect based on user type
      if (user?.user_type === 'parent' || user?.user_type === 'teacher') {
        navigate('/parent-dashboard');
      } else {
        // Child users go to home page
        navigate('/home');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      // Form data remains intact - not cleared on error
    }
  };

  const handleContinueWithoutAccount = () => {
    setError('');
    
    try {
      // Use the new continueWithoutAccount method from auth store
      const { continueWithoutAccount } = useAuthStore.getState();
      continueWithoutAccount();
      navigate('/home');
    } catch (err) {
      setError('Failed to continue without account. Please try again.');
    }
  };

  return (
    <>
      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
      )}

      <form onSubmit={handleSubmit}>
        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <p>{error}</p>
          </div>
        )}

      {/* Email Input */}
      <FormInput
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={formData.email || ''}
        onChange={(value) => setFormData({ ...formData, email: value })}
        icon={<EnvelopeIcon />}
        required
      />

      {/* Password Input */}
      <FormInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={formData.password || ''}
        onChange={(value) => setFormData({ ...formData, password: value })}
        icon={<LockClosedIcon />}
        required
      />

      {/* Forgot Password Link */}
      <div className="auth-forgot-password">
        <button
          type="button"
          onClick={() => setShowForgotPasswordModal(true)}
          className="auth-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Forgot password?
        </button>
      </div>

      {/* Sign In Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="auth-button-primary"
      >
        {isLoading ? (
          <>
            <div className="auth-spinner"></div>
            <span>Signing In...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      {/* Divider */}
      <div className="auth-divider">
        <span>Or</span>
      </div>

      {/* Continue Without Account */}
      <ContinueWithoutAccount
        onContinueWithoutAccount={handleContinueWithoutAccount}
      />

      {/* Legal Text */}
      <p className="auth-legal">
        By signing in, you agree to our{' '}
        <a href="#" className="auth-link">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="auth-link">
          Privacy Policy
        </a>
      </p>
      </form>
    </>
  );
};

export default SignInForm;
