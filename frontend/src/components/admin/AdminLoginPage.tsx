import { useState, useEffect } from 'react';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import adminAuthService from '../../services/adminAuth.service';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
}

export default function AdminLoginPage({ onLoginSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add keyframes for floating animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(30px, -30px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use admin auth service for login
      const response = await adminAuthService.login(email, password);
      
      if (response.success) {
        console.log('✅ Admin login successful');
        onLoginSuccess();
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('❌ Admin login error:', err);
      setError(err.response?.data?.error || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute rounded-full opacity-20"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
            top: '-100px',
            left: '-100px',
            animation: 'float 20s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute rounded-full opacity-20"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
            bottom: '-100px',
            right: '-100px',
            animation: 'float 25s ease-in-out infinite reverse'
          }}
        />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Shield className="w-12 h-12 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ 
            color: 'white',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>Admin Portal</h1>
          <p className="text-lg" style={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>PixelTale Administration</p>
        </div>

        {/* Login Card */}
        <div 
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ 
            color: '#667eea'
          }}>Welcome Back</h2>

          {error && (
            <div 
              className="mb-6 rounded-2xl p-4 flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>Authentication Failed</p>
                <p className="text-sm mt-1" style={{ color: '#991b1b' }}>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                Email Address
              </label>
              <div className="relative">
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '16px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User className="h-5 w-5" style={{ color: '#9ca3af' }} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-login-input"
                  style={{
                    width: '100%',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    color: '#1f2937',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    display: 'block',
                    boxSizing: 'border-box'
                  }}
                  placeholder="admin@pixeltale.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="relative">
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '16px',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Lock className="h-5 w-5" style={{ color: '#9ca3af' }} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-login-input"
                  style={{
                    width: '100%',
                    paddingLeft: '48px',
                    paddingRight: '56px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    color: '#1f2937',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    display: 'block',
                    boxSizing: 'border-box'
                  }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={{ 
                    position: 'absolute',
                    top: '50%',
                    right: '16px',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    opacity: 1,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" style={{ color: '#6b7280' }} />
                  ) : (
                    <Eye className="h-5 w-5" style={{ color: '#6b7280' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '17px',
                paddingTop: '18px',
                paddingBottom: '18px',
                paddingLeft: '24px',
                paddingRight: '24px',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
                opacity: (loading || !email || !password) ? 0.6 : 1,
                cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
                border: 'none',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!loading && email && password) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div 
            className="mt-6 rounded-2xl p-4"
            style={{
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#667eea' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#374151' }}>Secure Admin Access</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Only authorized administrators can access this portal. All login attempts are monitored.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm font-medium" style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            © 2025 PixelTale. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
