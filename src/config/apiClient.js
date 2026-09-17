// ============================================
// API CLIENT FIX (frontend/src/api/client.js)
// ============================================

import axios from 'axios';

// ✅ Uses Vite environment variables with your Render URL as the bulletproof fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://event-ai-backend-o2f3.onrender.com/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

console.log('🔗 API Base URL:', API_BASE_URL);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for CORS
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    // 1. Try common direct token names
    let token = localStorage.getItem('access_token') || localStorage.getItem('token');
    
    // 2. Try to extract it if you are using Zustand persist (commonly named auth-storage or auth-store)
    if (!token) {
        ['auth-storage', 'auth-store', 'auth'].forEach(key => {
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    token = token || parsed?.state?.token || parsed?.state?.access_token;
                } catch (e) {}
            }
        });
    }

    // 3. Attach the token if we found it
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR (With Token Refresh)
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    // If the request succeeds, just pass the data through normally
    return response; 
  },
  async (error) => {
    const originalRequest = error.config;

    // Catch 401 Unauthorized errors and try to refresh the token silently
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      try {
        const refreshToken = localStorage.getItem('refresh_token'); 
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Use the base 'axios' (imported at top) to avoid triggering this interceptor again
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const newAccessToken = response.data.access_token;

        // Save the new token(s) to storage
        localStorage.setItem('access_token', newAccessToken);
        if (response.data.refresh_token) {
            localStorage.setItem('refresh_token', response.data.refresh_token);
        }

        // Update the failed request's header with the new token and try it again!
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // If the refresh token is also expired or invalid, violently clear and kick to login
        console.warn("⚠️ Refresh token failed/expired. Kicking to login.");
        localStorage.clear();
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }

    // For all other errors (404, 500, etc.), log them normally
    if (error.response) {
      console.error(`❌ ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('❌ No response from server:', error.request);
    } else {
      console.error('❌ Error setup:', error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================
// API METHODS
// ============================================

export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export const getEvents = async () => {
  try {
    const response = await apiClient.get('/events');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Failed to create event:', error);
    throw error;
  }
};

export default apiClient;