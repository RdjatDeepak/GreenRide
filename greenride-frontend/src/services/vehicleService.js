import api from './api';

/**
 * Get all vehicles (Admin only)
 * @returns {Promise<Object>} List of vehicles
 */
export const getAllVehicles = async () => {
  try {
    const response = await api.get('/admin/vehicles');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get vehicles',
    };
  }
};

/**
 * Add a new vehicle (Admin only)
 * @param {Object} vehicleData - Vehicle data
 * @param {string} vehicleData.vehicleNumber - Vehicle number/plate
 * @param {string} vehicleData.model - Vehicle model
 * @param {string} vehicleData.color - Vehicle color
 * @param {string} vehicleData.type - Vehicle type
 * @returns {Promise<Object>} Creation response
 */
export const addVehicle = async (vehicleData) => {
  try {
    // Ensure licensePlate is present and non-null string
    const payload = {
      licensePlate: String(vehicleData.licensePlate || '').trim(),
      model: vehicleData.model,
      color: vehicleData.color,
      type: vehicleData.type,
    };
    const response = await api.post('/admin/vehicles', payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to add vehicle',
    };
  }
};

/**
 * Delete a vehicle (Admin only)
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<Object>} Deletion response
 */
export const deleteVehicle = async (vehicleId) => {
  try {
    const response = await api.delete(`/admin/vehicles/${vehicleId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete vehicle',
    };
  }
};

/**
 * Assign driver to vehicle (Admin only)
 * @param {number} vehicleId - Vehicle ID
 * @param {number} driverId - Driver ID
 * @returns {Promise<Object>} Assignment response
 */
export const assignDriverToVehicle = async (vehicleId, driverId) => {
  try {
    const response = await api.post(`/admin/vehicles/${vehicleId}/assign-driver`, { driverId });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to assign driver to vehicle',
    };
  }
};

/**
 * Get all drivers (Admin only)
 * @returns {Promise<Object>} List of drivers
 */
export const getAllDrivers = async () => {
  try {
    const response = await api.get('/admin/drivers');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get drivers',
    };
  }
};

