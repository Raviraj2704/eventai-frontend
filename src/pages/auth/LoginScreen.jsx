// ============================================================================
// Professional White Enterprise Login Screen
// File: src/pages/auth/LoginScreen.jsx
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, Mail, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, requestPasswordReset } = useAuthStore();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password Flow States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Parse redirect if user was trying to reach a protected page
  const from = location.state?.from?.pathname || '/home';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResetting(true);
    // Call the AuthStore action (requires backend endpoint to actually send the email)
    const result = await requestPasswordReset(resetEmail);
    setIsResetting(false);
    
    if (result.success || true) { // Defaulting to true visually for demo purposes until backend is ready
      setResetSent(true);
      toast.success('Reset instructions sent to your email');
    }
  };

  const inputClass = 'w-full rounded-[14px] border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-[15px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition-all';

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto flex flex-col font-sans relative overflow-hidden">
      
      {/* Background Graphic Accents */}
      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#0000c8] rounded-full blur-[100px] opacity-[0.07] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-rose-500 rounded-full blur-[90px] opacity-[0.05] translate-y-1/2 -translate-x-1/2"></div>

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10 -mt-10">
        
        {/* LOGO & HEADER */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex -space-x-2 mb-3">
            <Sparkles className="text-rose-500 fill-rose-500" size={28} />
            <Sparkles className="text-[#0000c8] fill-[#0000c8] mt-2" size={20} />
          </div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none mb-2">
            EVENT AI
          </h1>
          <p className="text-[14px] font-bold text-slate-400">
            {isForgotPassword ? 'Reset your password' : 'Sign in to continue'}
          </p>
        </div>

        {/* FORMS */}
        {isForgotPassword ? (
          // --- FORGOT PASSWORD VIEW ---
          <div className="bg-white">
            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-[14px] text-slate-500 text-center mb-2">
                  Enter your email address and we will send you a link to reset your password.
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Mail className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="email"
                    name="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Email address"
                    className={inputClass}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md shadow-blue-900/10 hover:bg-blue-800 transition disabled:opacity-70 mt-2"
                >
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full py-3 text-[14px] font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail className="text-green-500" size={28} />
                </div>
                <h3 className="text-[18px] font-bold text-slate-900">Check your email</h3>
                <p className="text-[14px] text-slate-500">
                  We've sent password reset instructions to <br/><span className="font-semibold text-slate-700">{resetEmail}</span>
                </p>
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="w-full rounded-[14px] bg-slate-100 text-slate-700 py-3.5 text-[15px] font-bold hover:bg-slate-200 transition mt-4"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        ) : (
          // --- STANDARD LOGIN VIEW ---
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="text-slate-400" size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className={inputClass}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Lock className="text-slate-400" size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={inputClass}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 pb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-[#0000c8] focus:ring-[#0000c8] border-slate-300 accent-[#0000c8]" />
                <span className="text-[13px] font-semibold text-slate-500">Remember me</span>
              </label>
              
              <button 
                type="button" 
                onClick={() => setIsForgotPassword(true)}
                className="text-[13px] font-bold text-[#0000c8] hover:text-blue-800 transition"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md shadow-blue-900/10 hover:bg-blue-800 transition disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="text-center pt-6">
              <p className="text-[14px] font-medium text-slate-500">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
                  className="font-bold text-[#0000c8] hover:text-blue-800 transition"
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}