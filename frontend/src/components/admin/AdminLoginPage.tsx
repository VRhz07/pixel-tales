import { useState, useEffect } from 'react';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import adminAuthService from '../../services/adminAuth.service';
import Logo from '../common/Logo';

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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950 font-sans">
      {/* Abstract Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      <div className="max-w-[420px] w-full relative z-10 flex flex-col">
        {/* Header Section */}
        <div className="text-center mb-8 transform transition-all duration-700 translate-y-0 opacity-100">
          <div className="inline-flex items-center justify-center mb-2 drop-shadow-2xl">
            <Logo width="100px" height="100px" style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">
            PixelTale Administration
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          {/* Subtle Card Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <h2 className="text-xl font-semibold mb-8 text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            Secure Authentication
          </h2>

          {error && (
            <div className="mb-6 rounded-xl p-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">Authentication Failed</p>
                <p className="text-sm mt-1 text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 tracking-wider uppercase">
                Email Address
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl text-sm transition-all duration-300 focus:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-600"
                  placeholder="admin@pixeltale.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 tracking-wider uppercase">
                Password
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-950/50 border border-slate-700 text-slate-200 rounded-xl text-sm transition-all duration-300 focus:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-600"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full mt-8 relative overflow-hidden rounded-xl font-bold text-sm tracking-wide text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0"
              style={{ padding: '16px 24px' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-500 transition-transform duration-500 group-hover/btn:scale-[1.02]" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Authorize Access</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 relative z-10">
            <div className="flex items-start gap-3 text-slate-400">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-500" />
              <div>
                <p className="text-xs font-medium text-slate-300 tracking-wide uppercase mb-1">Restricted Area</p>
                <p className="text-xs leading-relaxed opacity-80">
                  This system is strictly for authorized personnel only. All access attempts are recorded and monitored for security purposes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs font-medium text-slate-500 tracking-wide">
            © {new Date().getFullYear()} PixelTale. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
