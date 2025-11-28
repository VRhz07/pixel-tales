import React, { useState } from 'react';
import { BookOpenIcon, SparklesIcon } from '@heroicons/react/24/solid';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import './auth.css';

const AuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const { playSound } = useSoundEffects();

  return (
    <div className="auth-page-container light-mode-only">
      <div className="auth-page-wrapper">
        {/* Logo Section */}
        <div className="auth-logo-section">
          <div className="auth-logo-icons">
            <BookOpenIcon />
            <SparklesIcon />
          </div>
          <h1 className="auth-logo-title">
            Pixel Tales
          </h1>
          <p className="auth-logo-subtitle">
            Where stories come to life
          </p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
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
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
