// ============================================================================
// Professional White Enterprise Login Screen (With Real Password Reset)
// File: src/pages/auth/LoginScreen.jsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../config/apiClient';

export default function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token'); // Checks if user clicked email link

  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password Flow States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // New Password Flow States (When arriving from email link)
  const [newPassword, setNewPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);

  const from = location.state?.from?.pathname || '/home';

  // Automatically show new password screen if token exists
  useEffect(() => {
    if (resetToken) setIsForgotPassword(true);
  }, [resetToken]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return toast.error('Enter both email and password');
    const result = await login(formData.email, formData.password);
    if (result.success) navigate(from, { replace: true });
    else toast.error(result.error || 'Invalid credentials');
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error('Enter your email address');
    setIsResetting(true);
    try {
      // Fixes the double /api/v1/api/v1 error by calling apiClient correctly
      await apiClient.post('/auth/request-password-reset', { email: resetEmail });
      setResetSent(true);
      toast.success('Reset instructions sent');
    } catch (error) {
      toast.error('Failed to send reset email');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setIsResetting(true);
    try {
      await apiClient.post('/auth/reset-password', { token: resetToken, new_password: newPassword });
      setResetComplete(true);
      toast.success('Password updated successfully!');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Invalid or expired link. Request a new one.');
    } finally {
      setIsResetting(false);
    }
  };

  const inputClass = 'w-full rounded-[14px] border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-[15px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition-all';

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#0000c8] rounded-full blur-[100px] opacity-[0.07] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-rose-500 rounded-full blur-[90px] opacity-[0.05] translate-y-1/2 -translate-x-1/2"></div>

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10 -mt-10">
        
        {/* LOGO & HEADER */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex -space-x-2 mb-3">
            <Sparkles className="text-rose-500 fill-rose-500" size={28} />
            <Sparkles className="text-[#0000c8] fill-[#0000c8] mt-2" size={20} />
          </div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none mb-2">EVENT AI</h1>
          <p className="text-[14px] font-bold text-slate-400">
            {resetComplete ? 'Password Updated' : resetToken ? 'Create New Password' : isForgotPassword ? 'Reset your password' : 'Sign in to continue'}
          </p>
        </div>

        {/* FORMS */}
        {resetComplete ? (
          // --- SUCCESS SCREEN ---
          <div className="text-center space-y-5">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="text-green-500" size={28} />
            </div>
            <h3 className="text-[18px] font-bold text-slate-900">You're all set!</h3>
            <p className="text-[14px] text-slate-500">Your password has been successfully reset.</p>
            <button onClick={() => navigate('/login')} className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold mt-4">Sign In Now</button>
          </div>
        ) : resetToken ? (
          // --- ENTER NEW PASSWORD VIEW ---
          <form onSubmit={handleSaveNewPassword} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Lock className="text-slate-400" size={18} /></div>
              <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className={inputClass} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button type="submit" disabled={isResetting} className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold mt-4">
              {isResetting ? 'Saving...' : 'Save New Password'}
            </button>
          </form>
        ) : isForgotPassword ? (
          // --- FORGOT PASSWORD EMAIL INPUT ---
          <div className="bg-white">
            {!resetSent ? (
              <form onSubmit={handleSendResetEmail} className="space-y-5">
                <p className="text-[14px] text-slate-500 text-center mb-2">Enter your email address and we will send you a link to reset your password.</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Mail className="text-slate-400" size={18} /></div>
                  <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email address" className={inputClass} required />
                </div>
                <button type="submit" disabled={isResetting} className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold">
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full py-3 text-[14px] font-bold text-slate-500">Back to Login</button>
              </form>
            ) : (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2"><Mail className="text-[#0000c8]" size={28} /></div>
                <h3 className="text-[18px] font-bold text-slate-900">Check your email</h3>
                <p className="text-[14px] text-slate-500">We've sent password reset instructions to <br/><span className="font-semibold text-slate-700">{resetEmail}</span></p>
                <button onClick={() => { setIsForgotPassword(false); setResetSent(false); }} className="w-full rounded-[14px] bg-slate-100 text-slate-700 py-3.5 text-[15px] font-bold mt-4">Back to Login</button>
              </div>
            )}
          </div>
        ) : (
          // --- STANDARD LOGIN VIEW ---
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Mail className="text-slate-400" size={18} /></div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email address" className={inputClass} required />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Lock className="text-slate-400" size={18} /></div>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Password" className={inputClass} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 pb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-[#0000c8] border-slate-300" />
                <span className="text-[13px] font-semibold text-slate-500">Remember me</span>
              </label>
              <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[13px] font-bold text-[#0000c8]">Forgot password?</button>
            </div>
            <button type="submit" disabled={isLoading} className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center pt-6">
              <p className="text-[14px] font-medium text-slate-500">Don't have an account? <button type="button" onClick={() => navigate('/register')} className="font-bold text-[#0000c8]">Create Account</button></p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}