// ============================================================================
// EventAI - Premium Login Screen
// File: src/pages/auth/LoginScreen.jsx
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Sparkles, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [validated, setValidated] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    return () => {
      clearError();
      setLocalError('');
    };
  }, [clearError]);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setLocalError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setLocalError('');

    if (!validateForm()) return;

    const result = await login(email.toLowerCase().trim(), password);

    if (result.success) {
      navigate('/home');
    } else {
      setLocalError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (localError) setLocalError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (localError) setLocalError('');
  };

  const displayError = error || localError;
  const inputBaseClass = "w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition-all";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        {/* Main Card */}
        <div className="bg-white py-10 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-[28px] rounded-[24px] sm:px-10 border border-slate-100 relative overflow-hidden">
          
          {/* Subtle top gradient bar for premium feel */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0000c8] via-blue-500 to-indigo-400"></div>

          {/* Header & Branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <div className="flex -space-x-2">
                <Sparkles className="text-rose-500 fill-rose-500" size={30} />
                <Sparkles className="text-blue-500 fill-blue-500 mt-2" size={22} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              EVENT AI
            </h1>
            <p className="text-[11px] font-bold text-slate-400 tracking-[0.15em] uppercase">
              Welcome Back
            </p>
          </div>

          {/* Error Alert */}
          {displayError && (
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-[13px] font-medium text-red-800 flex-1 leading-relaxed">
                {displayError}
              </p>
              <button onClick={() => { setLocalError(''); clearError(); }} className="text-red-400 hover:text-red-600 transition">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${validated && !email ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="email"
                  type="email"
                  className={`${inputBaseClass} ${validated && !email ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-bold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${validated && !password ? 'text-red-400' : 'text-slate-400'}`} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputBaseClass} pr-12 ${validated && !password ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-300 text-[#0000c8] focus:ring-[#0000c8]"
                />
                <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-800 transition">
                  Remember me
                </span>
              </label>
              <a href="/forgot-password" className="text-[13px] font-bold text-[#0000c8] hover:text-blue-800 transition">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md shadow-blue-900/10 text-[15px] font-bold text-white bg-[#0000c8] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-[13px] font-medium text-slate-500">
              Don't have an account?{' '}
              <a href="/register" className="font-bold text-[#0000c8] hover:text-blue-800 transition">
                Create Account
              </a>
            </p>
          </div>

        </div>

        {/* Debug Info (Dev Only) */}
        {import.meta.env.DEV && (
          <div className="mt-8">
            <details className="text-xs text-slate-400 bg-slate-200/50 rounded-lg p-3">
              <summary className="cursor-pointer font-bold select-none">Debug Info</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
                Backend URL: {import.meta.env.VITE_BACKEND_URL || 'https://event-ai-backend-o2f3.onrender.com'}
                {'\n'}
                Form State: {JSON.stringify({ email, isLoading }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}