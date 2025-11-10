import api from './api';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Registration response
 */
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Registration failed',
    };
  }
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Login response with token and user data
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, email, roles } = response.data;
    
    // Store token and user data
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('user', JSON.stringify({ email, roles }));
    
    return {
      success: true,
      data: {
        token: accessToken,
        email,
        roles,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Login failed',
    };
  }
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * Get stored user data
 * @returns {Object|null} User data or null
 */
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }
  return null;
};

/**
 * Get stored auth token
 * @returns {string|null} Auth token or null
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

