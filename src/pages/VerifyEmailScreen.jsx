// ============================================================================
// Email Verification Screen - REAL API VERSION
// ============================================================================
// File: src/pages/VerifyEmailScreen.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, Loader, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '../services/api';

const VerifyEmailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Redirect if no email is found
  useEffect(() => {
    const sessionEmail = location.state?.email || sessionStorage.getItem('tempEmail');
    if (!sessionEmail) {
      toast.error('Session expired. Please log in or sign up again.');
      navigate('/auth/login');
    } else {
      setEmail(sessionEmail);
    }
  }, [location, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value;

    setCodes(newCodes);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const verificationCode = codes.join('');

    if (verificationCode.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setIsSubmitting(true);

    try {
      // Connect to real backend verification endpoint
      const response = await apiPost('/api/v1/auth/verify-email', {
        email: email,
        code: verificationCode
      });

      // If backend returns a new access token on successful verification, store it
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        if (response.user_id) localStorage.setItem('user_id', response.user_id);
      }
      
      sessionStorage.setItem('emailVerified', 'true');
      sessionStorage.setItem('verifiedEmail', email);
      
      toast.success('Email verified successfully!');
      navigate('/auth/complete-profile', { replace: true });
    } catch (err) {
      console.error('Verification error:', err);
      toast.error(err.response?.data?.detail || err.message || 'Verification failed. Please check the code.');
      setCodes(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);

    try {
      // Connect to real backend resend verification endpoint
      await apiPost('/api/v1/auth/resend-code', { email });
      
      toast.success('Verification code sent to your email!');
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend error:', err);
      toast.error(err.response?.data?.detail || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4 shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Verify Email
          </h1>
          
          <p className="text-neutral-600 mb-2">
            Enter the 6-digit code sent to
          </p>
          
          <p className="text-sm font-medium text-blue-600 break-all">
            {email}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-4 text-center">
              Verification Code
            </label>
            
            <div className="flex justify-center gap-3">
              {codes.map((code, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength="1"
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-neutral-300 focus:border-blue-500 focus:outline-none transition-colors bg-white shadow-sm"
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || codes.join('').length !== 6}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Email
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Resend Code */}
        <div className="mt-6 text-center border-t border-neutral-200 pt-6">
          <p className="text-sm text-neutral-600 mb-3">
            Didn't receive the code?
          </p>
          
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || resendLoading}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 disabled:text-neutral-400 transition-colors font-medium"
          >
            {resendLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Resend in {resendCooldown}s
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Resend Code
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-600 mt-8">
          This code will expire in 15 minutes
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailScreen;