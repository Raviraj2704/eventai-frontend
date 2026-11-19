import axios from 'axios';

// Determine API base URL based on environment
const getBaseURL = () => {
  const raw = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL;
  const base = (raw || (import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://eventai-backend-8txu.onrender.com')).replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
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
    const token = localStorage.getItem('access_token');
    const url = config.url || '';
    const isPublicEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/health');

    // Cancel protected requests cleanly before hitting the network if no token exists
    if (!token && !isPublicEndpoint) {
      return Promise.reject({ status: 401, silent: true, cancelledNoToken: true });
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global flag outside the interceptor to prevent 401 spam loops
let isLoggingOut = false;

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Swallow pre-cancelled unauthenticated requests silently
    if (error?.silent || error?.cancelledNoToken) {
      return Promise.reject(error);
    }

    const currentPath = window.location.pathname;
    const isPublicPage = currentPath === '/login' || currentPath === '/' || currentPath === '/register';

    const status = error.response ? error.response.status : null;
    const data = error.response ? error.response.data : null;

    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      if (!isLoggingOut) {
        isLoggingOut = true;

        // Clear all auth data completely to break loops
        Object.keys(localStorage)
          .filter((key) => key.startsWith('event'))
          .forEach((key) => localStorage.removeItem(key));

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');

        if (!isPublicPage) {
          window.dispatchEvent(new Event('auth-token-expired'));

          // Reset flag after 2 seconds so they can log back in
          setTimeout(() => { isLoggingOut = false; }, 2000);

          return Promise.reject({
            status: 401,
            silent: true,
            message: 'Session expired. Please login again.',
            data,
          });
        }
      }
      // If already logging out, swallow the error silently to prevent console spam
      return Promise.reject({ status: 401, silent: true });
    }

    // Handle 403 Forbidden
    if (status === 403) {
      return Promise.reject({
        status: 403,
        message: 'You do not have permission to access this resource.',
        data,
      });
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject({
        status: 404,
        message: 'Resource not found.',
        data,
      });
    }

    // Handle 422 Validation Error
    if (status === 422) {
      return Promise.reject({
        status: 422,
        message: 'Validation error. Please check your input.',
        errors: data?.detail || data?.errors,
        data,
      });
    }

    // Handle 500 Server Error
    if (status >= 500) {
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

export function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const clearAuthData = () => {
  Object.keys(localStorage)
    .filter((key) => key.startsWith('event'))
    .forEach((key) => localStorage.removeItem(key));

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getAPIBaseURL = () => {
  return getBaseURL();
};

// ============================================
// REQUEST CACHING (Stops API Spam)
// ============================================
const apiCache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const originalGet = apiClient.get;

apiClient.get = async (url, config) => {
  const cacheableEndpoints = ['/session-admin/me/roles', '/session-hub/days'];
  const shouldCache = cacheableEndpoints.some(endpoint => url?.includes(endpoint));

  if (shouldCache) {
    const cached = apiCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.response);
    }

    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }

    const requestPromise = originalGet.call(apiClient, url, config)
      .then(response => {
        apiCache.set(url, { response, timestamp: Date.now() });
        pendingRequests.delete(url);
        return response;
      })
      .catch(error => {
        pendingRequests.delete(url);
        throw error;
      });

    pendingRequests.set(url, requestPromise);
    return requestPromise;
  }

  return originalGet.call(apiClient, url, config);
};

export default apiClient;