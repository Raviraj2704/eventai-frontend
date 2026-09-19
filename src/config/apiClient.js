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

    // Log request in development
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', {
        method: config.method.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log('📥 API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        data: response.data,
      });
    }

    // Transform response if needed
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      config: response.config,
    };
  },
  (error) => {
    // Handle different error scenarios
    if (!error.response) {
      // Network error
      console.error('🌐 Network Error:', error.message);
      
      // Check if backend is actually running
      const errorMsg = `Network Error: Cannot reach server at ${getBaseURL()}. 
        Ensure backend is running and CORS is configured properly.`;
      
      return Promise.reject({
        status: 0,
        message: errorMsg,
        originalError: error,
      });
    }

    const { status, data } = error.response;

    // Log error response
    console.error('❌ API Error Response:', {
      status,
      statusText: error.response.statusText,
      data,
      url: error.config.url,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      console.warn('⚠️ Unauthorized - Token expired or invalid');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Redirect to login (if not already on login page)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject({
        status: 401,
        message: 'Session expired. Please login again.',
        data,
      });
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
    return Promise.reject({
      status,
      message: data?.message || error.response.statusText || 'An error occurred',
      data,
    });
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