import React, { useState, useEffect } from 'react';
import { LockClosedIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth.service';
import { storage } from '../../utils/storage';

interface ParentPasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  parentName: string;
}

export const ParentPasswordVerificationModal: React.FC<ParentPasswordVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  parentName
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      // Check if dark class is on document element
      const hasClassDark = document.documentElement.classList.contains('dark');
      
      // Also check zustand theme store
      const themeSettings = localStorage.getItem('theme-settings');
      let themeFromStorage = 'light';
      if (themeSettings) {
        try {
          const parsed = JSON.parse(themeSettings);
          themeFromStorage = parsed.state?.theme || 'light';
        } catch (e) {
          console.error('Failed to parse theme settings:', e);
        }
      }
      
      const isDark = hasClassDark || themeFromStorage === 'dark';
      console.log('🌙 Dark mode check:', { hasClassDark, themeFromStorage, isDark });
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get parent session data
      const parentSessionStr = storage.getItemSync('parent_session');
      if (!parentSessionStr) {
        throw new Error('Parent session not found');
      }

      const parentSession = JSON.parse(parentSessionStr);
      const parentEmail = parentSession.userData?.email;

      if (!parentEmail) {
        throw new Error('Parent email not found');
      }

      // Verify password using the dedicated endpoint
      try {
        const isValid = await authService.verifyPassword(parentEmail, password);
        
        if (isValid) {
          // Password is correct, proceed with switching
          onVerified();
          onClose();
        } else {
          setError('Incorrect password. Please try again.');
        }
      } catch (verifyError: any) {
        // Verification failed
        setError('Incorrect password. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: isDarkMode ? '#1f2937' : '#ffffff',
          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <LockClosedIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Parent Verification
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Enter parent password to continue
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
              style={{
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
              }}
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form 
          onSubmit={handleVerify} 
          className="px-6 py-6"
          style={{
            background: isDarkMode ? '#1f2937' : '#ffffff',
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          }}
        >
          <div className="mb-6">
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              To switch back to <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>{parentName}</strong>, please verify your identity by entering the parent account password.
            </p>
            
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Parent Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter parent password"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl outline-none transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                  }`}
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '4px',
                    zIndex: 10,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2} 
                      stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                      style={{ 
                        width: '20px',
                        height: '20px',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2} 
                      stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                      style={{ 
                        width: '20px',
                        height: '20px',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className={`mt-3 p-3 border rounded-lg flex items-start gap-2 ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-800'
                  : 'bg-red-50 border-red-200'
              }`}>
                <span className={isDarkMode ? 'text-red-400' : 'text-red-600'} style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                <p className={`text-sm flex-1 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className={`mb-6 p-4 border rounded-lg ${
            isDarkMode
              ? 'bg-blue-900/20 border-blue-800'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              <strong>🔒 Security Note:</strong> This ensures that only parents can access the parent dashboard and settings.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              style={{
                backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                color: isDarkMode ? '#e5e7eb' : '#374151',
              }}
              className="flex-1 px-4 py-3 border-2 rounded-xl font-semibold transition-colors hover:opacity-80"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isLoading || !password.trim() 
                  ? (isDarkMode ? '#4b5563' : '#9ca3af')
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: isLoading || !password.trim() 
                  ? 'none' 
                  : '0 4px 12px rgba(102, 126, 234, 0.3)',
                color: '#ffffff',
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
