import apiClient, { setAuthToken, clearAuthData, getAuthToken } from './apiClient';

/**
 * Auth Service - Handles all authentication operations
 * Includes login, register, email verification, profile completion, and token refresh
 */

const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login response with tokens and user data
   */
  async login(email, password) {
    try {
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
          status: 400,
        };
      }

      console.log('🔐 Attempting login for:', email);

      // Make login request
      const response = await apiClient.post('/api/v1/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      // Extract tokens and user data
      const { access_token, refresh_token, user } = response.data;

      if (!access_token) {
        throw new Error('No access token received from server');
      }

      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Store user data
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_id', user.id);
      }

      // Set auth header for future requests
      setAuthToken(access_token);

      console.log('✅ Login successful for:', email);

      return {
        success: true,
        access_token,
        refresh_token,
        user,
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
   * @param {object} userData - User registration data
   * @returns {Promise} Registration response
   */
  async register(userData) {
    try {
      const { email, password, passwordConfirm, name } = userData;

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

      console.log('📝 Registering user:', email);

      const response = await apiClient.post('/api/v1/auth/register', {
        email: email.toLowerCase().trim(),
        password,
        passwordConfirm,
        name: name.trim(),
      });

      console.log('✅ Registration successful');

      return {
        success: true,
        message: response.data?.message || 'Registration successful',
        status: response.status,
        data: response.data,
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
   * @param {string} email - User email
   * @param {string} otp - One-time password
   * @returns {Promise} Verification response
   */
  async verifyEmail(email, otp) {
    try {
      if (!email || !otp) {
        return {
          success: false,
          error: 'Email and OTP are required',
          status: 400,
        };
      }

      console.log('🔍 Verifying email:', email);

      const response = await apiClient.post('/api/v1/auth/verify-email', {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
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
   * @param {string} email - User email
   * @returns {Promise} Response
   */
  async resendVerificationEmail(email) {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email is required',
          status: 400,
        };
      }

      console.log('📧 Resending verification email to:', email);

      const response = await apiClient.post('/api/v1/auth/resend-verification', {
        email: email.toLowerCase().trim(),
      });

      console.log('✅ Verification email resent');

      return {
        success: true,
        message: response.data?.message || 'Verification email sent',
        status: response.status,
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
      };
    }
  },

  /**
   * Complete user profile
   * @param {object} profileData - Profile data
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

      const response = await apiClient.post('/api/v1/auth/complete-profile', profileData);

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
   * @returns {Promise} Logout response
   */
  async logout() {
    try {
      console.log('👋 Logging out...');

      const token = getAuthToken();
      if (token) {
        await apiClient.post('/api/v1/auth/logout');
      }

      // Clear auth data
      clearAuthData();
      delete apiClient.defaults.headers.common['Authorization'];

      console.log('✅ Logout successful');

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('❌ Logout error:', error);

      // Clear auth data anyway
      clearAuthData();
      delete apiClient.defaults.headers.common['Authorization'];

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

      const response = await apiClient.post('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;

      if (!access_token) {
        throw new Error('No access token in refresh response');
      }

      // Update tokens
      localStorage.setItem('access_token', access_token);
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
   * @param {string} email - User email
   * @returns {Promise} Response
   */
  async requestPasswordReset(email) {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email is required',
          status: 400,
        };
      }

      console.log('📧 Requesting password reset for:', email);

      const response = await apiClient.post('/api/v1/auth/request-password-reset', {
        email: email.toLowerCase().trim(),
      });

      console.log('✅ Password reset email sent');

      return {
        success: true,
        message: response.data?.message || 'Password reset email sent',
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
      };
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise} Response
   */
  async resetPassword(token, newPassword) {
    try {
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

      const response = await apiClient.post('/api/v1/auth/reset-password', {
        token,
        password: newPassword,
      });

      console.log('✅ Password reset successful');

      return {
        success: true,
        message: response.data?.message || 'Password reset successful',
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
      };
    }
  },

  /**
   * Get current user data
   * @returns {object} User data
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