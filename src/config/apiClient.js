import axios from 'axios';

// Determine API base URL based on environment
const getBaseURL = () => {
  const isDev = import.meta.env.DEV;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  if (backendUrl) {
    return backendUrl;
  }

  if (isDev) {
    return 'http://localhost:8000';
  }

  // Production URLs
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }

  // For Vercel/Railway production
  return 'https://event-ai-backend-o2f3.onrender.com/api/v1';
};

// Create axios instance
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request metadata
    config.headers['X-Request-ID'] = generateRequestId();
    config.headers['X-Client-Version'] = '1.0.0';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // FIX: Silence 401 errors if we are currently on the login page or splash screen
    // This stops the UI from spamming toasts when logging out.
    const currentPath = window.location.pathname;
    const isPublicPage = currentPath === '/login' || currentPath === '/';
    
    const status = error.response ? error.response.status : null;
    const data = error.response ? error.response.data : null;

    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      // Clear all auth data completely to break loops
      Object.keys(localStorage)
        .filter((key) => key.startsWith('event'))
        .forEach((key) => localStorage.removeItem(key));

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_id');

      if (!isPublicPage) {
        console.error('🚫 Unauthorized - Token expired or invalid');
        window.dispatchEvent(new Event('auth-token-expired'));
        return Promise.reject({
          status: 401,
          message: 'Session expired. Please login again.',
          data,
        });
      } else {
        // Silently fail if they are already logged out / on public page
        return Promise.reject({ status: 401, silent: true });
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.warn('⚠️ Forbidden - Access denied');
      return Promise.reject({
        status: 403,
        message: 'You do not have permission to access this resource.',
        data,
      });
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.warn('⚠️ Not Found - Resource does not exist');
      return Promise.reject({
        status: 404,
        message: 'Resource not found.',
        data,
      });
    }

    // Handle 422 Validation Error
    if (status === 422) {
      console.warn('⚠️ Validation Error');
      return Promise.reject({
        status: 422,
        message: 'Validation error. Please check your input.',
        errors: data?.detail || data?.errors,
        data,
      });
    }

    // Handle 500 Server Error
    if (status >= 500) {
      console.error('🔥 Server Error');
      return Promise.reject({
        status,
        message: 'Server error. Please try again later.',
        data,
      });
    }

    // Generic error response
    if (!isPublicPage) {
      return Promise.reject({
        status,
        message: data?.message || error.response?.statusText || 'An error occurred',
        data,
      });
    } else {
      return Promise.reject({ silent: true });
    }
  }
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate unique request ID for tracking
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear all auth data
 */
export const clearAuthData = () => {
  // Remove the cached profile so the next user doesn't see it
  Object.keys(localStorage)
    .filter((key) => key.startsWith('event'))
    .forEach((key) => localStorage.removeItem(key));

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
};

/**
 * Set auth token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

/**
 * Get auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Get API base URL (useful for debugging)
 */
export const getAPIBaseURL = () => {
  return getBaseURL();
};

export default apiClient;