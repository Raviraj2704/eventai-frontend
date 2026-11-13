// ============================================================================
// EventAI Login & Password Reset Screen (Self-Contained, Zero Import Conflicts)
// File: src/pages/auth/LoginScreen.jsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../config/apiClient';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { login: storeLogin, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState(token ? 'reset' : 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const data = res.data;
      storeLogin(data.user || { id: data.user_id, email, role: data.user_role, is_admin: data.is_admin }, data.access_token);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');

    setLoading(true);
    try {
      await apiClient.post('/auth/request-password-reset', { email });
      toast.success('Reset link sent to your email!');
      setView('success');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token: token,
        new_password: newPassword,
      });
      toast.success('Password updated! Please sign in.');
      navigate('/login', { replace: true });
      setView('login');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.data?.detail || 'Reset link expired or invalid.');
      setView('forgot');
    } finally {
      setLoading(false);
    }
  };

  const inputContainerClass = "flex items-center w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all";
  const inputClass = "flex-1 bg-transparent text-[15px] font-medium text-slate-800 focus:outline-none placeholder:text-slate-400";
  const btnClass = "w-full rounded-[14px] bg-[#0000c8] text-white py-4 text-[15px] font-bold shadow-md shadow-blue-900/10 hover:bg-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto flex flex-col justify-center px-6 relative">
      <div className="flex flex-col items-center mb-10 mt-[-6vh]">
        <div className="flex -space-x-2 mb-3">
          <Sparkles className="text-rose-500 fill-rose-500" size={32} />
          <Sparkles className="text-blue-500 fill-blue-500 mt-3" size={24} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">EVENT AI</h1>
        <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
          {view === 'login' && "Welcome Back"}
          {view === 'forgot' && "Reset Your Password"}
          {view === 'success' && "Check Your Email"}
          {view === 'reset' && "Set New Password"}
        </p>
      </div>

      {view === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <p className="text-center text-[13px] text-slate-500 px-2">
            Enter your email address and we will send a reset link straight to your inbox.
          </p>
          <div>
            <div className={inputContainerClass}>
              <Mail size={18} className="text-slate-400 mr-3" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ravirajapanthulu@gmail.com" className={inputClass} disabled={loading} />
            </div>
          </div>
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <button type="button" onClick={() => setView('login')} className="w-full text-[14px] font-bold text-[#0000c8] hover:underline mt-4">
            Back to Login
          </button>
        </form>
      )}

      {view === 'success' && (
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <Mail size={30} className="text-[#0000c8]" />
          </div>
          <p className="text-[14px] font-medium text-slate-600 px-4">
            We've sent password reset instructions to <span className="font-bold text-slate-900">{email}</span>.
          </p>
          <button type="button" onClick={() => setView('login')} className={btnClass}>
            Back to Login
          </button>
        </div>
      )}

      {view === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2 pl-1">New Password</label>
            <div className={inputContainerClass}>
              <Lock size={18} className="text-slate-400 mr-3" />
              <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className={inputClass} disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? 'Updating...' : 'Update Password'} <ArrowRight size={18} />
          </button>
        </form>
      )}

      {view === 'login' && (
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2 pl-1">Email Address</label>
            <div className={inputContainerClass}>
              <Mail size={18} className="text-blue-500 mr-3" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} disabled={loading} />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-2 pl-1">Password</label>
            <div className={inputContainerClass}>
              <Lock size={18} className="text-amber-500 mr-3" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 p-1">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1 pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#0000c8]" />
              <span className="text-[13px] font-medium text-slate-600">Remember me</span>
            </label>
            <button type="button" onClick={() => setView('forgot')} className="text-[13px] font-bold text-[#0000c8] hover:underline">
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
          </button>

          <div className="text-center pt-4">
            <p className="text-[14px] text-slate-500 font-medium">
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/register')} className="text-[#0000c8] font-bold hover:underline">
                Create Account
              </button>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}