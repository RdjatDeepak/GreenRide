import api from './api';

/**
 * Submit a driver request
 * @param {Object} requestData - Driver request data
 * @param {string} requestData.aadharNumber - Aadhar number
 * @param {string} requestData.licenseNumber - License number
 * @returns {Promise<Object>} Request response
 */
export const submitDriverRequest = async (requestData) => {
  try {
    const response = await api.post('/drivers/apply', requestData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to submit driver request',
    };
  }
};

/**
 * Get driver request status for current user
 * @returns {Promise<Object>} Request status
 */
export const getDriverRequestStatus = async () => {
  try {
    const response = await api.get('/drivers/apply/status');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get driver request status',
    };
  }
};

/**
 * Get all driver requests (Admin only)
 * @returns {Promise<Object>} List of driver requests
 */
export const getAllDriverRequests = async () => {
  try {
    const response = await api.get('/admin/pending-drivers');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get driver requests',
    };
  }
};

/**
 * Approve a driver request (Admin only)
 * @param {number} requestId - Request ID
 * @returns {Promise<Object>} Approval response
 */
export const approveDriverRequest = async (requestId) => {
  try {
    const response = await api.post(`/admin/approve-driver/${requestId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to approve driver request',
    };
  }
};

/**
 * Reject a driver request (Admin only)
 * @param {number} requestId - Request ID
 * @returns {Promise<Object>} Rejection response
 */
export const rejectDriverRequest = async (requestId) => {
  try {
    const response = await api.post(`/admin/reject-driver/${requestId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to reject driver request',
    };
  }
};

/**
 * Get all approved drivers (Admin only)
 * @returns {Promise<Object>} List of approved drivers
 */
export const getApprovedDrivers = async () => {
  try {
    const response = await api.get('/admin/drivers');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get approved drivers',
    };
  }
};

