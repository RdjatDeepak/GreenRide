import api from './api';

/**
 * Calculate range prediction using ML model
 * @param {Object} predictionData - Prediction input data
 * @param {number} predictionData.vehicleId - Vehicle ID (required)
 * @param {number} predictionData.distance - Trip distance in km
 * @param {number} predictionData.temperature - Current temperature in Celsius
 * @param {number} predictionData.current_soc - Current battery SOC percentage
 * @param {number} predictionData.avg_speed - Average speed in km/h
 * @returns {Promise<Object>} Prediction response
 */
export const calculateRangePrediction = async (predictionData) => {
  try {
    // Ensure vehicleId is present
    if (!predictionData.vehicleId) {
      throw new Error('vehicleId is required for route optimization');
    }

    const response = await api.post('/route/calculate-optimize', predictionData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to calculate range prediction',
    };
  }
};

/**
 * Get traffic light alert color based on final SOC
 * @param {number} finalSOC - Final battery SOC percentage
 * @returns {string} Alert color ('green', 'yellow', 'red')
 */
export const getTrafficLightColor = (finalSOC) => {
  if (finalSOC > 25) return 'green';
  if (finalSOC >= 15) return 'yellow';
  return 'red';
};

/**
 * Get alert message based on final SOC
 * @param {number} finalSOC - Final battery SOC percentage
 * @returns {string} Alert message
 */
export const getAlertMessage = (finalSOC) => {
  if (finalSOC > 25) return 'Battery level sufficient for trip';
  if (finalSOC >= 15) return 'Caution: Consider eco-driving';
  return 'Charging stop required!';
};
