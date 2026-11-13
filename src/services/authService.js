// ============================================================================
// Auth Service - Handles all authentication operations
// File: src/services/authService.js
// Includes login, register, email verification, profile completion, and token refresh
// ============================================================================

import apiClient, { setAuthToken, clearAuthData, getAuthToken } from '../config/apiClient';

/**
 * Helper to safely extract an email string whether a caller passes:
 * - two arguments: (email, password)
 * - or a single object: ({ email, password })
 * This prevents "TypeError: email.toLowerCase is not a function" crashes.
 */
const extractEmailString = (input) => {
  if (typeof input === 'string') {
    return input;
  }
  if (input && typeof input === 'object' && typeof input.email === 'string') {
    return input.email;
  }
  return '';
};

/**
 * Auth Service - Handles all authentication operations
 * Includes login, register, email verification, profile completion, and token refresh
 */
const authService = {
  /**
   * Login user with email and password
   * Supports both login(email, password) and login({ email, password })
   * @param {string|object} emailOrObj User email string or credentials object
   * @param {string} [passwordArg] User password
   * @returns {Promise} Login response with tokens and user data
   */
  async login(emailOrObj, passwordArg) {
    try {
      // Safely unpack if called as login({ email, password }) or login(email, password)
      const email = extractEmailString(emailOrObj);
      const password =
        typeof emailOrObj === 'object' && emailOrObj !== null
          ? emailOrObj.password ?? passwordArg
          : passwordArg;

      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
          status: 400,
        };
      }

      const normalizedEmail = email.toLowerCase().trim();

      console.log('🔐 Attempting login for:', normalizedEmail);

      // Make login request
      const response = await apiClient.post('/auth/login', {
        email: normalizedEmail,
        password,
      });

      // Extract tokens and user data (supports both flat response.data and nested response.data.data)
      const payload = response.data?.data || response.data || {};
      const access_token =
        response.data?.access_token ||
        payload?.access_token ||
        response.data?.token ||
        payload?.token;
      const refresh_token =
        response.data?.refresh_token ||
        payload?.refresh_token;
      const user =
        response.data?.user ||
        payload?.user ||
        (payload?.id || payload?.email ? payload : null);

      if (!access_token) {
        throw new Error('No access token received from server');
      }

      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Store user data
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.id !== undefined && user.id !== null) {
          localStorage.setItem('user_id', user.id);
        }
      }

      // Set auth header for future requests
      setAuthToken(access_token);

      console.log('✅ Login successful for:', normalizedEmail);

      return {
        success: true,
        access_token,
        token: access_token,
        refresh_token,
        user,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('❌ Login error:', error);

      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}. Ensure backend is running.`,
          status: 0,
        };
      }

      const { status, data } = error.response;

      // Handle specific error statuses
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Login failed. Please try again.',
        status,
        data,
      };
    }
  },

  /**
   * Register new user
   * Supports both register(userDataObject) and register(email, password, name)
   * @param {object|string} userData User registration data
   * @returns {Promise} Registration response
   */
  async register(userData, passwordArg, nameArg) {
    try {
      const normalizedData =
        typeof userData === 'object' && userData !== null
          ? userData
          : {
              email: userData,
              password: passwordArg,
              passwordConfirm: passwordArg,
              name: nameArg,
            };

      const email = extractEmailString(normalizedData.email);
      const password = normalizedData.password;
      const passwordConfirm =
        normalizedData.passwordConfirm ?? normalizedData.confirmPassword ?? normalizedData.password;
      const name = normalizedData.name || normalizedData.full_name || normalizedData.username || '';

      // Validate input
      if (!email || !password || !passwordConfirm || !name) {
        return {
          success: false,
          error: 'All fields are required',
          status: 400,
        };
      }

      if (password !== passwordConfirm) {
        return {
          success: false,
          error: 'Passwords do not match',
          status: 400,
        };
      }

      if (password.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters',
          status: 400,
        };
      }

      const normalizedEmail = email.toLowerCase().trim();

      console.log('📝 Registering user:', normalizedEmail);

      const response = await apiClient.post('/auth/register', {
        ...normalizedData,
        email: normalizedEmail,
        password,
        passwordConfirm,
        name: name.trim(),
      });

      // If the backend also returns tokens upon registration, store them
      const payload = response.data?.data || response.data || {};
      const access_token = response.data?.access_token || payload?.access_token || payload?.token;
      const refresh_token = response.data?.refresh_token || payload?.refresh_token;
      const user = response.data?.user || payload?.user;

      if (access_token) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('token', access_token);
        setAuthToken(access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.id !== undefined && user.id !== null) {
          localStorage.setItem('user_id', user.id);
        }
      }

      console.log('✅ Registration successful');

      return {
        success: true,
        message: response.data?.message || 'Registration successful',
        status: response.status,
        data: response.data,
        user,
        access_token,
      };
    } catch (error) {
      console.error('❌ Registration error:', error);

      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}`,
          status: 0,
        };
      }

      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Registration failed',
        status,
        data,
      };
    }
  },

  /**
   * Verify email with OTP
   * Supports both verifyEmail(email, otp) and verifyEmail({ email, otp })
   * @param {string|object} emailOrObj User email or object containing { email, otp }
   * @param {string} [otpArg] One-time password
   * @returns {Promise} Verification response
   */
  async verifyEmail(emailOrObj, otpArg) {
    try {
      const email = extractEmailString(emailOrObj);
      const otp =
        typeof emailOrObj === 'object' && emailOrObj !== null
          ? emailOrObj.otp ?? otpArg
          : otpArg;

      if (!email || !otp) {
        return {
          success: false,
          error: 'Email and OTP are required',
          status: 400,
        };
      }

      const normalizedEmail = email.toLowerCase().trim();

      console.log('🔍 Verifying email:', normalizedEmail);

      const response = await apiClient.post('/auth/verify-email', {
        email: normalizedEmail,
        otp: String(otp).trim(),
      });

      console.log('✅ Email verified successfully');

      return {
        success: true,
        message: response.data?.message || 'Email verified',
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Email verification error:', error);

      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}`,
          status: 0,
        };
      }

      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Email verification failed',
        status,
        data,
      };
    }
  },

  /**
   * Resend verification email
   * Supports both resendVerificationEmail(email) and resendVerificationEmail({ email })
   * @param {string|object} emailOrObj User email
   * @returns {Promise} Response
   */
  async resendVerificationEmail(emailOrObj) {
    try {
      const email = extractEmailString(emailOrObj);

      if (!email) {
        return {
          success: false,
          error: 'Email is required',
          status: 400,
        };
      }

      const normalizedEmail = email.toLowerCase().trim();

      console.log('📧 Resending verification email to:', normalizedEmail);

      const response = await apiClient.post('/auth/resend-verification', {
        email: normalizedEmail,
      });

      console.log('✅ Verification email resent');

      return {
        success: true,
        message: response.data?.message || 'Verification email sent',
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Resend email error:', error);

      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}`,
          status: 0,
        };
      }

      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Failed to resend verification email',
        status,
        data,
      };
    }
  },

  /**
   * Alias for resendVerificationEmail in case components call authService.resendVerification()
   */
  async resendVerification(emailOrObj) {
    return this.resendVerificationEmail(emailOrObj);
  },

  /**
   * Complete user profile
   * @param {object} profileData Profile data
   * @returns {Promise} Response
   */
  async completeProfile(profileData) {
    try {
      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          error: 'Not authenticated',
          status: 401,
        };
      }

      console.log('👤 Completing profile');

      const response = await apiClient.post('/auth/complete-profile', profileData);

      // Update stored user data
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      console.log('✅ Profile completed successfully');

      return {
        success: true,
        message: response.data?.message || 'Profile completed',
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ Profile completion error:', error);

      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}`,
          status: 0,
        };
      }

      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Failed to complete profile',
        status,
        data,
      };
    }
  },

  /**
   * Logout user
   * Clears local tokens immediately first so in-flight requests don't spam 401 errors
   * @returns {Promise} Logout response
   */
  async logout() {
    try {
      console.log('👋 Logging out...');

      const token = getAuthToken();

      // Remove the cached profile so the next user doesn't see it
      Object.keys(localStorage)
        .filter((key) => key.startsWith('event'))
        .forEach((key) => localStorage.removeItem(key));

      // Clear auth data & headers first to prevent background 401 console spam
      clearAuthData();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_id');
      if (apiClient?.defaults?.headers?.common) {
        delete apiClient.defaults.headers.common['Authorization'];
      }

      // Notify backend if token was present (ignore any 401/network failure silently)
      if (token) {
        await apiClient
          .post(
            '/auth/logout',
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          .catch(() => null);
      }

      console.log('✅ Logout successful');

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('❌ Logout error:', error);

      // Remove the cached profile so the next user doesn't see it
      Object.keys(localStorage)
        .filter((key) => key.startsWith('event'))
        .forEach((key) => localStorage.removeItem(key));

      // Clear auth data anyway
      clearAuthData();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_id');
      if (apiClient?.defaults?.headers?.common) {
        delete apiClient.defaults.headers.common['Authorization'];
      }

      return {
        success: true,
        message: 'Logged out',
      };
    }
  },

  /**
   * Refresh access token
   * @returns {Promise} New tokens
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing token...');

      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;

      if (!access_token) {
        throw new Error('No access token in refresh response');
      }

      // Update tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token', access_token);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }

      setAuthToken(access_token);

      console.log('✅ Token refreshed successfully');

      return {
        success: true,
        access_token,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      console.error('❌ Token refresh error:', error);

      // Clear auth data on refresh failure
      clearAuthData();

      return {
        success: false,
        error: error.message || 'Token refresh failed',
      };
    }
  },

  /**
   * Reset password with email
   * Supports both requestPasswordReset(email) and requestPasswordReset({ email })
   * @param {string|object} emailOrObj User email
   * @returns {Promise} Response
   */
  async requestPasswordReset(emailOrObj) {
    try {
      const email = extractEmailString(emailOrObj);

      if (!email) {
        return {
          success: false,
          error: 'Email is required',
          status: 400,
        };
      }

      const normalizedEmail = email.toLowerCase().trim();

      console.log('📧 Requesting password reset for:', normalizedEmail);

      // FIXED: Removed duplicate /api/v1/ prefix
      const response = await apiClient.post('/auth/request-password-reset', {
        email: normalizedEmail,
      });

      console.log('✅ Password reset email sent');

      return {
        success: true,
        message: response.data?.message || 'Password reset email sent',
        reset_link: response.data?.reset_link,
        token: response.data?.token,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('❌ Password reset request error:', error);

      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}`,
          status: 0,
        };
      }

      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Failed to request password reset',
        status,
        data,
      };
    }
  },

  /**
   * Reset password with token
   * Supports both resetPassword(token, newPassword) and resetPassword({ token, newPassword })
   * @param {string|object} tokenOrObj Reset token or object
   * @param {string} [newPasswordArg] New password
   * @returns {Promise} Response
   */
  async resetPassword(tokenOrObj, newPasswordArg) {
    try {
      const token =
        typeof tokenOrObj === 'object' && tokenOrObj !== null
          ? tokenOrObj.token
          : tokenOrObj;
      const newPassword =
        typeof tokenOrObj === 'object' && tokenOrObj !== null
          ? tokenOrObj.new_password || tokenOrObj.newPassword || tokenOrObj.password || newPasswordArg
          : newPasswordArg;

      if (!token || !newPassword) {
        return {
          success: false,
          error: 'Token and password are required',
          status: 400,
        };
      }

      if (newPassword.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters',
          status: 400,
        };
      }

      console.log('🔒 Resetting password');

      // FIXED: Removed duplicate /api/v1/ prefix
      const response = await apiClient.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });

      console.log('✅ Password reset successful');

      return {
        success: true,
        message: response.data?.message || 'Password reset successful',
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error('❌ Password reset error:', error);

      if (!error.response) {
        return {
          success: false,
          error: `Network error: ${error.message}`,
          status: 0,
        };
      }

      const { status, data } = error.response;
      const errorMessage = data?.message || data?.detail || error.message;

      return {
        success: false,
        error: errorMessage || 'Password reset failed',
        status,
        data,
      };
    }
  },

  /**
   * Get current user data synchronously from localStorage
   * @returns {object|null} User data
   */
  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Fetch fresh user profile from backend API when needed
   * @returns {Promise} Response with user profile
   */
  async fetchCurrentUser() {
    try {
      const token = getAuthToken();
      if (!token) {
        return { success: false, status: 401, error: 'Not authenticated' };
      }
      const response = await apiClient.get('/users/me');
      const user = response.data?.data || response.data?.user || response.data;
      if (user && typeof user === 'object') {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return { success: true, user, data: user, status: response.status };
    } catch (error) {
      return {
        success: false,
        status: error?.response?.status || 401,
        error: error?.response?.data?.detail || error?.message,
      };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!getAuthToken();
  },

  /**
   * Get current access token
   * @returns {string} Access token
   */
  getAccessToken() {
    return getAuthToken();
  },
};

export default authService;