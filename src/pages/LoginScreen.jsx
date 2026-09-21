// ============================================================================
// Login Screen - REAL API VERSION
// ============================================================================
// File: src/pages/LoginScreen.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '../services/api';

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.usernameOrEmail.trim()) {
      errors.usernameOrEmail = 'Username or email is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      // Connect to real backend login endpoint
      const response = await apiPost('/api/v1/auth/login', {
        email: formData.usernameOrEmail.toLowerCase().trim(),
        password: formData.password
      });

      // Handle successful login (store token and route to home)
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        
        // Store user info if returned by backend
        if (response.user_id) localStorage.setItem('user_id', response.user_id);
        if (response.user) sessionStorage.setItem('userProfile', JSON.stringify(response.user));

        toast.success('Login successful!');
        navigate('/home', { replace: true });
      } else {
        // Fallback for 2FA / Email Verification flow if backend requires it
        sessionStorage.setItem('tempEmail', formData.usernameOrEmail);
        toast.success('Code sent! Please verify your email.');
        navigate('/auth/verify-email', { 
          replace: true,
          state: { email: formData.usernameOrEmail }
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.detail || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            Welcome Back
          </h1>
          
          <p className="text-neutral-600">
            Sign in to your EventAI account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mb-6">
          {/* Username/Email Field */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Username or Email
            </label>
            
            <div className="relative">
              <Mail className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                name="usernameOrEmail"
                value={formData.usernameOrEmail}
                onChange={handleChange}
                placeholder="Enter your username or email"
                className={`pl-12 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  formErrors.usernameOrEmail ? 'border-red-500' : 'border-neutral-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            
            {formErrors.usernameOrEmail && (
              <p className="mt-1 text-sm text-red-500">{formErrors.usernameOrEmail}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                Password
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`pl-12 pr-12 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  formErrors.password ? 'border-red-500' : 'border-neutral-300'
                }`}
                disabled={isSubmitting}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 mt-8 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-neutral-50 text-neutral-600">
              Don't have an account?
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <Link
          to="/auth/register"
          className="block w-full text-center py-3 px-4 rounded-lg border-2 border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
        >
          Create Account
        </Link>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-600 mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;