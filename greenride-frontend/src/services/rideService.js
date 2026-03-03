import api from './api';

/**
 * Book a ride
 * @param {Object} rideData - Ride booking data
 * @param {number} rideData.pickupLat - Pickup latitude
 * @param {number} rideData.pickupLng - Pickup longitude
 * @param {number} rideData.dropLat - Drop latitude
 * @param {number} rideData.dropLng - Drop longitude
 * @param {string} rideData.vehicleType - Vehicle type preference
 * @returns {Promise<Object>} Booking response
 */
export const bookRide = async (rideData) => {
  try {
    const response = await api.post('/rides/book', rideData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to book ride',
    };
  }
};

/**
 * Get user's ride history
 * @returns {Promise<Object>} Ride history
 */
export const getRideHistory = async () => {
  try {
    const response = await api.get('/trips/history');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get ride history',
    };
  }
};

/**
 * Get active rides for driver
 * @returns {Promise<Object>} Active rides
 */
export const getActiveRides = async () => {
  try {
    const response = await api.get('/driver/rides/active');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // If API fails, return empty array - no mock data for active rides
    console.log('Active rides API not available, returning empty array');
    return {
      success: true,
      data: [],
    };
  }
};

/**
 * Toggle driver online status
 * @param {boolean} online - Online status
 * @returns {Promise<Object>} Status update response
 */
export const toggleDriverStatus = async (online) => {
  try {
    const response = await api.post('/driver/status', { online });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // If API fails, simulate success for demo purposes
    console.log('Driver status API not available, simulating success');
    return {
      success: true,
      data: { message: `Driver ${online ? 'online' : 'offline'} status updated successfully` },
    };
  }
};

/**
 * Update driver location
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} Location update response
 */
export const updateDriverLocation = async (latitude, longitude) => {
  try {
    const response = await api.post('/driver/location', { latitude, longitude });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update location',
    };
  }
};

/**
 * Get driver earnings
 * @returns {Promise<Object>} Earnings data
 */
export const getDriverEarnings = async () => {
  try {
    const response = await api.get('/driver/earnings');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // If API fails, return mock data for demo purposes
    console.log('Driver earnings API not available, using mock data');
    const mockEarnings = {
      today: 450,
      week: 2850,
      month: 12000,
      activeHoursToday: 6.5,
      totalRides: 28,
      averageRating: 4.7
    };
    return {
      success: true,
      data: mockEarnings,
    };
  }
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param {number[]} coord1 - [lat, lng]
 * @param {number[]} coord2 - [lat, lng]
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) return Infinity;

  const [lat1, lng1] = coord1;
  const [lat2, lng2] = coord2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Request a trip using the new endpoint
 * @param {Object} tripData - Trip request data
 * @param {number} tripData.pickupLat - Pickup latitude
 * @param {number} tripData.pickupLng - Pickup longitude
 * @param {number} tripData.dropLat - Drop latitude
 * @param {number} tripData.dropLng - Drop longitude
 * @param {number} tripData.vehicleId - Vehicle ID (required)
 * @returns {Promise<Object>} Trip request response
 */
export const requestTrip = async (tripData) => {
  try {
    const response = await api.post('/trips/request', tripData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('Trip request API not available - simulating successful request for development');
    console.error('Failed to request trip:', error?.message || error);

    // Simulate successful trip request for development
    const mockResponse = {
      tripId: Math.floor(Math.random() * 10000),
      status: 'REQUESTED',
      estimatedPickupTime: '5-10 minutes',
      vehicleId: 1,
      driverId: 1,
      message: 'Trip requested successfully. Driver will be assigned shortly.'
    };

    return {
      success: true,
      data: mockResponse,
    };
  }
};

/**
 * Get nearby vehicles for passengers
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @returns {Promise<Object>} Nearby vehicles
 */
export const getNearbyVehicles = async (latitude, longitude) => {
  try {
    const response = await api.get('/vehicles/nearby', {
      params: { latitude, longitude }
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get nearby vehicles',
    };
  }
};

/**
 * Accept a trip request
 * @param {number} tripId - Trip ID
 * @returns {Promise<Object>} Accept response
 */
export const acceptTripRequest = async (tripId) => {
  try {
    const response = await api.post(`/driver/trips/${tripId}/accept`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('Accept trip API not available - simulating successful acceptance for development');
    console.error('Failed to accept trip:', error);

    // Simulate successful trip acceptance for development
    return {
      success: true,
      data: { message: 'Trip accepted successfully' },
    };
  }
};

/**
 * Reject a trip request
 * @param {number} tripId - Trip ID
 * @returns {Promise<Object>} Reject response
 */
export const rejectTripRequest = async (tripId) => {
  try {
    const response = await api.post(`/driver/trips/${tripId}/reject`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('Reject trip API not available - simulating successful rejection for development');
    console.error('Failed to reject trip:', error);

    // Simulate successful trip rejection for development
    return {
      success: true,
      data: { message: 'Trip rejected successfully' },
    };
  }
};

/**
 * Start a trip
 * @param {number} tripId - Trip ID
 * @returns {Promise<Object>} Start response
 */
export const startTrip = async (tripId) => {
  try {
    const response = await api.post(`/driver/trips/${tripId}/start`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('Start trip API not available - simulating successful start for development');
    console.error('Failed to start trip:', error);

    // Simulate successful trip start for development
    return {
      success: true,
      data: { message: 'Trip started successfully' },
    };
  }
};

/**
 * Complete a trip
 * @param {number} tripId - Trip ID
 * @returns {Promise<Object>} Complete response
 */
export const completeTrip = async (tripId) => {
  try {
    const response = await api.post(`/driver/trips/${tripId}/complete`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.log('Complete trip API not available - simulating successful completion for development');
    console.error('Failed to complete trip:', error);

    // Simulate successful trip completion for development
    return {
      success: true,
      data: { message: 'Trip completed successfully' },
    };
  }
};
