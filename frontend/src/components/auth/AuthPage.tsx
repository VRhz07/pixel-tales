import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/solid';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import Logo from '../common/Logo';
import DeveloperModeModal from '../settings/DeveloperModeModal';
import './auth.css';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { playSound } = useSoundEffects();
  const [showDeveloperMode, setShowDeveloperMode] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { continueWithoutAccount } = useAuthStore();
  const { t } = useI18nStore();

  // Soft wall: if the user was redirected here from a protected page, explain why
  const redirectReason = (location.state as any)?.reason;
  const redirectFrom = (location.state as any)?.from?.pathname;
  const wasBlocked = redirectReason === 'auth-required';

  const handleContinueAsGuest = () => {
    playSound('button-click');
    continueWithoutAccount();
    // If a route guard sent us here (auth-required), navigating back to the
    // protected page would bounce the guest straight back to /auth - an infinite
    // loop. They are already a guest cancelling the sign-in prompt, so send
    // them safely to /home instead.
    navigate(wasBlocked ? '/home' : (redirectFrom || '/home'), { replace: true });
  };
  
  // Developer mode trigger - tap logo 5 times
  useEffect(() => {
    if (logoClickCount >= 5) {
      setShowDeveloperMode(true);
      setLogoClickCount(0);
      playSound('button-click');
    }
    
    // Reset counter after 3 seconds of inactivity
    if (logoClickCount > 0) {
      const timer = setTimeout(() => setLogoClickCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [logoClickCount, playSound]);

  return (
    <div className="auth-page-container light-mode-only">
      <div className="auth-page-wrapper">
        {/* Logo Section */}
        <div className="auth-logo-section">
          <div className="auth-logo-icons" style={{ marginBottom: '0', position: 'relative' }}>
            <div 
              onClick={() => setLogoClickCount(prev => prev + 1)}
              style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
              title="Tap 5 times for developer mode"
            >
              <Logo width="200px" height="200px" />
              {logoClickCount > 0 && logoClickCount < 5 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(102, 126, 234, 0.9)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  animation: 'pulse 0.3s ease-out',
                  zIndex: 10
                }}>
                  {logoClickCount}
                </div>
              )}
            </div>
            <SparklesIcon />
          </div>
          <p className="auth-logo-subtitle" style={{ marginTop: '-3.5rem' }}>
            Where stories come to life
          </p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          {/* Redirect notice - shown when a guest tried to access a protected page */}
          {redirectReason === 'auth-required' && (
            <div style={{
              margin: '0 0 16px 0',
              padding: '12px 16px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              color: '#6d28d9',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              🔒 Please sign in or create an account to access this feature and save your work.
            </div>
          )}
          {/* Card Header */}
          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="auth-card-subtitle">
              {activeTab === 'signin' 
                ? 'Sign in to continue your storytelling journey' 
                : 'Join our community of storytellers'
              }
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="auth-tabs">
            <button
              onClick={() => {
                playSound('tab-switch');
                setActiveTab('signin');
              }}
              className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                playSound('tab-switch');
                setActiveTab('signup');
              }}
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          {activeTab === 'signin' ? <SignInForm key="signin-form" /> : <SignUpForm key="signup-form" />}

          {/* Continue as Guest - soft wall: let users back out and keep browsing */}
          <button
            onClick={handleContinueAsGuest}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '12px',
              color: '#8b5cf6',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {wasBlocked ? t('auth.cancelReturnHome') : t('auth.continueWithoutAccount')}
          </button>
        </div>
      </div>
      
      {/* Developer Mode Modal */}
      <DeveloperModeModal
        isOpen={showDeveloperMode}
        onClose={() => setShowDeveloperMode(false)}
      />
    </div>
  );
};

export default AuthPage;
