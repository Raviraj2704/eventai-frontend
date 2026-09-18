import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAuthLoading, useAuthError } from '../../store/authStore';
import styles from '../../styles/LoginPage.module.css';

/**
 * LoginScreen Component
 * Handles user login with email and password
 * Uses Zustand auth store for state management
 */

function LoginScreen() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthLoading();
  const error = useAuthError();
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

  /**
   * Validate form inputs
   */
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

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setLocalError('');

    if (!validateForm()) {
      return;
    }

    const result = await login(email.toLowerCase().trim(), password);

    if (result.success) {
      // Redirect to home after successful login
      navigate('/home');
    } else {
      setLocalError(result.error || 'Login failed. Please try again.');
    }
  };

  /**
   * Handle email input change
   */
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear error when user starts typing
    if (localError) {
      setLocalError('');
    }
  };

  /**
   * Handle password input change
   */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear error when user starts typing
    if (localError) {
      setLocalError('');
    }
  };

  /**
   * Display error message from store or local error
   */
  const displayError = error || localError;

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        {/* Logo or Brand */}
        <div className={styles.header}>
          <h1 className={styles.title}>EventAI</h1>
          <p className={styles.subtitle}>Welcome Back</p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div className={styles.errorAlert} role="alert">
            <span className={styles.errorIcon}>⚠️</span>
            <span>{displayError}</span>
            <button
              type="button"
              className={styles.closeError}
              onClick={() => {
                setLocalError('');
                clearError();
              }}
              aria-label="Close error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Email Input */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>📧</span>
              <input
                id="email"
                type="email"
                className={`${styles.input} ${
                  validated && !email ? styles.invalid : ''
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                required
                aria-label="Email address"
                autoComplete="email"
              />
            </div>
            {validated && !email && (
              <span className={styles.fieldError}>Email is required</span>
            )}
          </div>

          {/* Password Input */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${
                  validated && !password ? styles.invalid : ''
                }`}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                required
                aria-label="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validated && !password && (
              <span className={styles.fieldError}>Password is required</span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className={styles.formActions}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                defaultChecked={false}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className={styles.link}>
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className={styles.loadingSpinner}>
                <span className={styles.spinner}></span>
                Signing In...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <span className={styles.arrow}>→</span>
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <a href="/register" className={styles.link}>
              Create Account
            </a>
          </p>
        </div>

        {/* Debug Info (Dev Only) */}
        {import.meta.env.DEV && (
          <details className={styles.debugInfo}>
            <summary>Debug Info</summary>
            <pre>
              Backend URL:{' '}
              {import.meta.env.VITE_BACKEND_URL ||
                'http://localhost:8000'}
              {'\n'}
              Form State:
              {JSON.stringify({ email, password, isLoading }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;