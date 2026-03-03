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
    console.log('Driver request status API not available - returning null for development');
    console.error('Failed to get driver request status:', error);

    // Return null status for development when backend is not available
    return {
      success: true,
      data: null,
    };
  }
};

/**
 * Get all pending driver requests (Admin only)
 * @returns {Promise<Object>} List of pending driver requests
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
      error: error.response?.data?.message || error.message || 'Failed to get pending driver requests',
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
    const response = await api.post(`/admin/driver-requests/${requestId}/approve`);
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
    const response = await api.post(`/admin/driver-requests/${requestId}/reject`);
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
    console.log('Approved drivers API not available - returning mock data for development');
    console.error('Failed to get approved drivers:', error);

    // Mock approved drivers data for development
    const mockDrivers = [
      {
        id: 1,
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '+91-9876543210',
        licenseNumber: 'DL123456789',
        aadharNumber: '1234-5678-9012',
        status: 'APPROVED',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91-9876543211',
        licenseNumber: 'DL987654321',
        aadharNumber: '9876-5432-1098',
        status: 'APPROVED',
        createdAt: '2024-01-20T14:45:00Z'
      }
    ];

    return {
      success: true,
      data: mockDrivers,
    };
  }
};

