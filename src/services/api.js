// API Base URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
/**
 * Make API calls with authentication
 */
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

/**
 * GET request
 */
export const apiGet = (endpoint) => {
  return apiCall(endpoint, { method: 'GET' });
};

/**
 * POST request
 */
export const apiPost = (endpoint, data) => {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 */
export const apiPut = (endpoint, data) => {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 */
export const apiDelete = (endpoint) => {
  return apiCall(endpoint, { method: 'DELETE' });
};