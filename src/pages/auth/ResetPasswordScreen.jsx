// ============================================================================
// Reset Password Screen (Enterprise White Design)
// File: src/pages/auth/ResetPasswordScreen.jsx
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuthStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // If there is no token in the URL, someone just typed the URL manually
  if (!token) {
    return (
      <div className="min-h-screen bg-white max-w-[430px] mx-auto flex flex-col justify-center items-center p-8 text-center font-sans">
        <h2 className="text-[20px] font-bold text-slate-900 mb-2">Invalid Link</h2>
        <p className="text-slate-500 mb-6">This password reset link is invalid or missing a security token.</p>
        <button onClick={() => navigate('/login')} className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold">Back to Login</button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      toast.error(result.error || 'Failed to reset password');
    }
  };

  const inputClass = 'w-full rounded-[14px] border border-slate-200 bg-slate-50 pl-11 pr-4 py-3.5 text-[15px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0000c8]/20 focus:border-[#0000c8] transition-all';

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto flex flex-col font-sans relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-[#0000c8] rounded-full blur-[100px] opacity-[0.07] -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex-1 flex flex-col justify-center px-8 relative z-10 -mt-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex -space-x-2 mb-3">
            <Sparkles className="text-rose-500 fill-rose-500" size={28} />
            <Sparkles className="text-[#0000c8] fill-[#0000c8] mt-2" size={20} />
          </div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none mb-2">EVENT AI</h1>
          <p className="text-[14px] font-bold text-slate-400">Create new password</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <h2 className="text-[18px] font-bold text-slate-900">Password Updated!</h2>
            <p className="text-[14px] text-slate-500">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Lock className="text-slate-400" size={18} /></div>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password (min 8 chars)" className={inputClass} required />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"><Lock className="text-slate-400" size={18} /></div>
              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className={inputClass} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-[14px] bg-[#0000c8] text-white py-3.5 text-[15px] font-bold shadow-md shadow-blue-900/10 hover:bg-blue-800 transition disabled:opacity-70 mt-2">
              {isSubmitting ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}