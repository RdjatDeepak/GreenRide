import React, { useState, useEffect } from 'react';
import { useState as useStateHook } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemedBackground from '../../components/common/ThemedBackground';
import DriverRequestForm from '../../components/driver/DriverRequestForm';
import { submitDriverRequest, getDriverRequestStatus } from '../../services/driverService';
import { calculateRangePrediction, getTrafficLightColor, getAlertMessage } from '../../services/mlService';
import { getRideHistory, requestTrip, getNearbyVehicles } from '../../services/rideService';

// Calculate distance between two coordinates in kilometers
const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) return 0;

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

// Reverse geocode lat/lng to address
const getAddressFromLatLng = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Error fetching address:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};
import '../Dashboard.css';
import './PassengerHome.css';
import LiveMap from '../../components/Map/LiveMap';

const PassengerHome = () => {
  const { user } = useAuth();
  const [showDriverRequestForm, setShowDriverRequestForm] = useState(false);
  const [driverRequestStatus, setDriverRequestStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [nearbyVehicles, setNearbyVehicles] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingForm, setBookingForm] = useState({ dropLat: '', dropLng: '', vehicleType: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [destination, setDestination] = useState(null);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [route, setRoute] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Check driver request status
    const checkDriverRequestStatus = async () => {
      setIsLoadingStatus(true);
      const result = await getDriverRequestStatus();
      if (result.success) {
        setDriverRequestStatus(result.data);
      }
      setIsLoadingStatus(false);
    };

    if (user && !user.roles?.includes('ROLE_DRIVER')) {
      checkDriverRequestStatus();
    } else {
      setIsLoadingStatus(false);
    }
  }, [user]);

  // Fetch prediction on component mount and periodically
  useEffect(() => {
    const fetchPrediction = async () => {
      setPredictionLoading(true);
      try {
        // Mock prediction data for passenger's trip
        const mockPredictionData = {
          distance: 45.0, // This should come from booked trip data
          temperature: 22.0,
          current_soc: 85.0,
          avg_speed: 55.0
        };

        const result = await calculateRangePrediction({
            vehicleId: selectedVehicle?.id || 1, // Required for route optimization - fallback to 1 if no vehicle selected
            ...mockPredictionData
        });
        if (result.success) {
          setPrediction(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch prediction:', error);
      } finally {
        setPredictionLoading(false);
      }
    };

    // Initial fetch
    fetchPrediction();

    // Set up polling every 5 minutes
    const interval = setInterval(fetchPrediction, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmitDriverRequest = async (formData) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await submitDriverRequest(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Driver request submitted successfully! Admin will review your request.' });
        setShowDriverRequestForm(false);
        // Refresh status
        const statusResult = await getDriverRequestStatus();
        if (statusResult.success) {
          setDriverRequestStatus(statusResult.data);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to submit driver request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDriverRequestButtonText = () => {
    if (isLoadingStatus) return 'Loading...';
    if (!driverRequestStatus) return 'Become a Driver';
    
    const status = driverRequestStatus.status?.toUpperCase();
    if (status === 'PENDING') return 'Request Pending';
    if (status === 'APPROVED') return 'Request Approved';
    if (status === 'REJECTED') return 'Request Rejected';
    return 'Become a Driver';
  };

  const canSubmitRequest = () => {
    if (isLoadingStatus) return false;
    if (!driverRequestStatus) return true;
    const rawStatus = driverRequestStatus.status || driverRequestStatus.state || driverRequestStatus.currentStatus;
    const status = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : undefined;
    // Allow submit when there is no status yet, or when previously rejected
    return !status || status === 'REJECTED';
  };

  const handleBookRide = async () => {
    setMessage({ type: '', text: '' });
    if (!selectedVehicle) {
      setMessage({ type: 'info', text: 'Please select a vehicle from the map first.' });
      return;
    }
    if (!destination) {
      setMessage({ type: 'info', text: 'Please select a destination by searching or clicking on the map.' });
      return;
    }
    setShowBookingModal(true);
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setMessage({ type: 'success', text: `Selected vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate || vehicle.vehicleNumber})` });
  };

  const handleConfirmBooking = async () => {
    setMessage({ type: '', text: '' });
    if (!selectedVehicle || !destination) {
      setMessage({ type: 'error', text: 'Please select a vehicle and destination.' });
      return;
    }

    // Validate coordinates to prevent unrealistic distance calculations
    const pickupLat = userLocation ? userLocation[0] : 28.6139;
    const pickupLng = userLocation ? userLocation[1] : 77.2090;
    const dropLat = destination[0];
    const dropLng = destination[1];

    // Check for invalid coordinates (0.0, null, or out of reasonable range)
    const isValidCoordinate = (coord) => {
      return coord !== null && coord !== undefined && coord !== 0.0 &&
             coord >= -90 && coord <= 90 && !isNaN(coord);
    };

    const isValidLngCoordinate = (coord) => {
      return coord !== null && coord !== undefined && coord !== 0.0 &&
             coord >= -180 && coord <= 180 && !isNaN(coord);
    };

    // Explicitly check for (0,0) coordinates which indicate no destination selected
    if (dropLat === 0 && dropLng === 0) {
      setMessage({ type: 'error', text: 'Please select a valid destination on the map. Coordinates (0,0) are not allowed.' });
      return;
    }

    if (!isValidCoordinate(pickupLat) || !isValidLngCoordinate(pickupLng)) {
      setMessage({ type: 'error', text: 'Invalid pickup location coordinates. Please refresh and try again.' });
      return;
    }

    if (!isValidCoordinate(dropLat) || !isValidLngCoordinate(dropLng)) {
      setMessage({ type: 'error', text: 'Invalid destination coordinates. Please select a valid destination.' });
      return;
    }

    // Calculate distance to ensure it's reasonable (not thousands of km)
    const distance = calculateDistance([pickupLat, pickupLng], [dropLat, dropLng]);
    if (distance > 500) { // Assuming max reasonable trip distance is 500km
      setMessage({ type: 'error', text: `Trip distance (${distance.toFixed(1)} km) is too long. Please select a closer destination.` });
      return;
    }

    try {
      const tripData = {
        pickupLat,
        pickupLng,
        dropoffLat: dropLat,
        dropoffLng: dropLng,
        vehicleId: selectedVehicle.id,
      };

      const result = await requestTrip(tripData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Trip requested successfully!' });
        setShowBookingModal(false);
        setSelectedVehicle(null);
        setDestination(null);
        setDestinationSearch('');
        // Calculate route for display
        calculateRoute(userLocation, destination);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to request trip.' });
    }
  };

  const handleTrackRide = async () => {
    setMessage({ type: '', text: '' });
    setMessage({ type: 'info', text: 'No active rides to track. Book a ride first!' });
  };

  const handleViewMyRides = async () => {
    setMessage({ type: '', text: '' });
    try {
      const result = await getRideHistory();
      if (result.success) {
        setRideHistory(result.data);
        setMessage({ type: 'success', text: `You have ${result.data.length} rides in your history` });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load ride history' });
    }
  };

  const handleRateReview = async () => {
    setMessage({ type: '', text: '' });
    setMessage({ type: 'info', text: 'Rate & Review feature coming soon!' });
  };

  // Geocoding function using OpenStreetMap Nominatim
  const searchDestination = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=IN`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    }
  };

  const handleDestinationSearch = (e) => {
    const query = e.target.value;
    setDestinationSearch(query);
    searchDestination(query);
  };

  const selectDestinationFromSearch = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setDestination([lat, lng]);
    setDestinationSearch(result.display_name);
    setSearchResults([]);
  };

  const handleDestinationSelect = (coords) => {
    setDestination(coords);
    setDestinationSearch(`${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
  };

  const calculateRoute = async (start, end) => {
    if (!start || !end) return;

    try {
      // Use OSRM routing service
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoute(routeCoords);
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      setRoute(null);
    }
  };

  return (
    <ThemedBackground>
      <div className="dashboard-container">
        {message.text && (
          <div className={`message-alert ${message.type}`}>
            {message.text}
            <button onClick={() => setMessage({ type: '', text: '' })} className="close-message">×</button>
          </div>
        )}

        <div className="dashboard-card">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome, {user?.name || 'Passenger'}!</h1>
            <p className="dashboard-subtitle">Book your eco-friendly ride and travel green</p>
          </div>



          {!user?.roles?.includes('ROLE_DRIVER') && (
            <div className="driver-request-section">
              <button
                onClick={() => setShowDriverRequestForm(true)}
                className="become-driver-btn"
              >
                {getDriverRequestButtonText()}
              </button>
              {driverRequestStatus?.status === 'PENDING' && (
                <p className="status-message pending">
                  Your driver request is under review by the admin.
                </p>
              )}
              {driverRequestStatus?.status === 'APPROVED' && (
                <p className="status-message approved">
                  Congratulations! Your driver request has been approved.
                </p>
              )}
              {driverRequestStatus?.status === 'REJECTED' && (
                <p className="status-message rejected">
                  Your driver request was rejected. You can submit a new request.
                </p>
              )}
            </div>
          )}

          <div className="dashboard-content">
            <button className="dashboard-feature" onClick={handleBookRide}>
              <div className="dashboard-feature-icon">📍</div>
              <div className="dashboard-feature-title">Book a Ride</div>
              <div className="dashboard-feature-description">Find available EV drivers near you</div>
            </button>

            <button className="dashboard-feature" onClick={handleTrackRide}>
              <div className="dashboard-feature-icon">🗺️</div>
              <div className="dashboard-feature-title">Track Ride</div>
              <div className="dashboard-feature-description">Real-time location tracking</div>
            </button>

            <button className="dashboard-feature" onClick={handleViewMyRides}>
              <div className="dashboard-feature-icon">📱</div>
              <div className="dashboard-feature-title">My Rides</div>
              <div className="dashboard-feature-description">View your ride history</div>
            </button>

            <button className="dashboard-feature" onClick={handleRateReview}>
              <div className="dashboard-feature-icon">⭐</div>
              <div className="dashboard-feature-title">Rate & Review</div>
              <div className="dashboard-feature-description">Share your experience</div>
            </button>
          </div>
        </div>

        <div className="dashboard-card live-map-card">
          <div className="destination-search-container">
            <input
              type="text"
              placeholder="Search destination or click on map..."
              value={destinationSearch}
              onChange={handleDestinationSearch}
              className="destination-search-input"
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => selectDestinationFromSearch(result)}
                  >
                    {result.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <LiveMap
            mode="passenger"
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
            onDestinationSelect={handleDestinationSelect}
            destination={destination}
            route={route}
          />
        </div>

        {/* Nearby Vehicles Section */}
        {nearbyVehicles.length > 0 && (
          <div className="dashboard-card nearby-vehicles-card">
            <h3 className="card-title">Nearby Vehicles</h3>
            <div className="nearby-vehicles-list">
              {nearbyVehicles.map((vehicle) => {
                const distance = userLocation ? calculateDistance(userLocation, [vehicle.latitude || vehicle.lat, vehicle.longitude || vehicle.lng]) : 0;
                return (
                  <div
                    key={vehicle.id}
                    className={`vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <div className="vehicle-header">
                      <h4>{vehicle.make} {vehicle.model}</h4>
                      <span className="distance-badge">{distance.toFixed(1)} km away</span>
                    </div>
                    <div className="vehicle-details">
                      <div className="vehicle-detail-row">
                        <span className="label">ID:</span>
                        <span className="value">{vehicle.id || 'N/A'}</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">Model:</span>
                        <span className="value">{vehicle.model || 'N/A'}</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">License Plate:</span>
                        <span className="value">{vehicle.licensePlate || vehicle.vehicleNumber || 'N/A'}</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">Battery Level:</span>
                        <span className="value">{vehicle.currentBatteryLevel || vehicle.batteryLevel || vehicle.batteryPct || 'N/A'}%</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">Driver Name:</span>
                        <span className="value">{vehicle.driverName || vehicle.driver?.name || 'N/A'}</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">Distance:</span>
                        <span className="value">{distance.toFixed(1)} km</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">Latitude:</span>
                        <span className="value">{(vehicle.latitude || vehicle.lat).toFixed(4)}</span>
                      </div>
                      <div className="vehicle-detail-row">
                        <span className="label">Longitude:</span>
                        <span className="value">{(vehicle.longitude || vehicle.lng).toFixed(4)}</span>
                      </div>
                    </div>
                    <button
                      className="select-vehicle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVehicleSelect(vehicle);
                      }}
                    >
                      {selectedVehicle?.id === vehicle.id ? 'Selected' : 'Select Vehicle'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showBookingModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirm Trip Request</h3>
              <div className="booking-details">
                <p><strong>Selected Vehicle:</strong> {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.licensePlate})</p>
                <p><strong>Pickup Location:</strong> {userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : 'Current location'}</p>
                <p><strong>Destination:</strong> {destination ? `${destinationSearch || `${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}`}` : 'Not selected'}</p>
                {destination && (
                  <p><strong>Coordinates:</strong> {destination[0].toFixed(6)}, {destination[1].toFixed(6)}</p>
                )}
              </div>
              <div className="modal-actions">
                <button onClick={handleConfirmBooking} className="confirm-btn" disabled={!destination}>Request Trip</button>
                <button onClick={() => setShowBookingModal(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDriverRequestForm && (
        <DriverRequestForm
          onSubmit={handleSubmitDriverRequest}
          onCancel={() => setShowDriverRequestForm(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </ThemedBackground>
  );
};

export default PassengerHome;
