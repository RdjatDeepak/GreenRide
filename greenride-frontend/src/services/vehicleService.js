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
 * @param {string} vehicleData.licensePlate - Vehicle license plate
 * @param {string} vehicleData.make - Vehicle make/brand
 * @param {string} vehicleData.model - Vehicle model
 * @param {number} vehicleData.batteryLevel - Battery level percentage
 * @param {string} vehicleData.status - Vehicle status
 * @param {number} vehicleData.latitude - Latitude
 * @param {number} vehicleData.longitude - Longitude
 * @param {string} vehicleData.color - Vehicle color
 * @param {string} vehicleData.type - Vehicle type
 * @returns {Promise<Object>} Creation response
 */
export const addVehicle = async (vehicleData) => {
  try {
    const response = await api.post('/admin/vehicles', vehicleData);
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
    // Backend expects path params: /api/admin/vehicle/assign/{vehicleId}/{driverId}
    const response = await api.post(`/admin/vehicle/assign/${vehicleId}/${driverId}`);
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
 * Unassign driver from vehicle (Admin only)
 * @param {number} vehicleId - Vehicle ID
 * @returns {Promise<Object>} Unassignment response
 */
export const unassignDriverFromVehicle = async (vehicleId) => {
  try {
    const response = await api.post(`/admin/vehicle/unassign/${vehicleId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to unassign driver from vehicle',
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

