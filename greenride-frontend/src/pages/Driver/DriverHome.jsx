import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemedBackground from '../../components/common/ThemedBackground';
import { calculateRangePrediction, getTrafficLightColor, getAlertMessage } from '../../services/mlService';
import { toggleDriverStatus, updateDriverLocation, getActiveRides, getDriverEarnings, acceptTripRequest, rejectTripRequest, startTrip, completeTrip, calculateDistance } from '../../services/rideService';
import webSocketService from '../../services/WebSocketService';
import '../Dashboard.css';

const DriverHome = () => {
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeRides, setActiveRides] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [showActiveRidesModal, setShowActiveRidesModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [tripStatus, setTripStatus] = useState(null);
  const [incomingTripRequest, setIncomingTripRequest] = useState(null);

  // Function to calculate range prediction when trip is accepted
  const calculateTripPrediction = async (tripRequest) => {
    if (!tripRequest) return;
    
    setPredictionLoading(true);
    try {
      // Calculate distance from pickup to dropoff coordinates
      const distance = calculateDistance(
        [tripRequest.pickupLat, tripRequest.pickupLng],
        [tripRequest.dropoffLat, tripRequest.dropoffLng]
      );

      const predictionData = {
        vehicleId: tripRequest.vehicleId || 1, // Use vehicleId from trip request
        distance: distance,
        temperature: 22.0, // Default temperature - could get from weather API
        current_soc: 85.0, // This should come from vehicle data in real implementation
        avg_speed: 55.0
      };

      const result = await calculateRangePrediction(predictionData);
      if (result.success) {
        setPrediction(result.data);
      }
    } catch (error) {
      console.error('Failed to calculate prediction:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  // WebSocket subscription for trip requests
  useEffect(() => {
    let unsubscribe = null;

    const setupWebSocket = async () => {
      try {
        await webSocketService.connect();

        // Subscribe to trip requests for this driver
        unsubscribe = webSocketService.subscribeToTripRequests((tripRequest) => {
          console.log('New trip request received:', tripRequest);
          setIncomingTripRequest(tripRequest);
          setTripStatus('PENDING');
        });

      } catch (error) {
        console.error('WebSocket setup error:', error);
      }
    };

    if (user && isOnline) {
      setupWebSocket();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, isOnline]);

  const handleToggleOnline = async () => {
    setMessage({ type: '', text: '' });
    try {
      const result = await toggleDriverStatus(!isOnline);
      if (result.success) {
        setIsOnline(!isOnline);
        setMessage({
          type: 'success',
          text: `You are now ${!isOnline ? 'online' : 'offline'}`
        });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleUpdateLocation = async () => {
    setMessage({ type: '', text: '' });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const result = await updateDriverLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            if (result.success) {
              setMessage({ type: 'success', text: 'Location updated successfully' });
            } else {
              setMessage({ type: 'error', text: result.error });
            }
          } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update location' });
          }
        },
        (error) => {
          setMessage({ type: 'error', text: 'Unable to get your location' });
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation is not supported by this browser' });
    }
  };

  const handleViewActiveRides = async () => {
    setMessage({ type: '', text: '' });
    try {
      const result = await getActiveRides();
      if (result.success) {
        setActiveRides(result.data);
        setShowActiveRidesModal(true);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load active rides' });
    }
  };

  const handleViewEarnings = async () => {
    setMessage({ type: '', text: '' });
    try {
      const result = await getDriverEarnings();
      if (result.success) {
        setEarnings(result.data);
        setShowEarningsModal(true);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load earnings' });
    }
  };

  const handleAcceptTrip = async () => {
    if (!incomingTripRequest) return;

    try {
      const result = await acceptTripRequest(incomingTripRequest.tripId);
      if (result.success) {
        setTripStatus('EN_ROUTE');
        setMessage({ type: 'success', text: 'Trip accepted! Navigate to pickup location.' });
        
        // Calculate range prediction after accepting the trip
        await calculateTripPrediction(incomingTripRequest);
        
        setIncomingTripRequest(null);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to accept trip' });
    }
  };

  const handleRejectTrip = async () => {
    if (!incomingTripRequest) return;

    try {
      const result = await rejectTripRequest(incomingTripRequest.tripId);
      if (result.success) {
        setMessage({ type: 'info', text: 'Trip request rejected.' });
        setIncomingTripRequest(null);
        setTripStatus(null);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject trip' });
    }
  };

  const handleStartTrip = async () => {
    if (!incomingTripRequest) return;

    try {
      const result = await startTrip(incomingTripRequest.tripId);
      if (result.success) {
        setTripStatus('IN_PROGRESS');
        setMessage({ type: 'success', text: 'Trip started! Safe journey!' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start trip' });
    }
  };

  const handleCompleteTrip = async () => {
    if (!incomingTripRequest) return;

    try {
      const result = await completeTrip(incomingTripRequest.tripId);
      if (result.success) {
        setTripStatus('COMPLETED');
        setMessage({ type: 'success', text: 'Trip completed successfully!' });
        setIncomingTripRequest(null);
        setTripStatus(null);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to complete trip' });
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

        {/* Trip Status Banner */}
        {tripStatus && (
          <div className={`trip-status-banner ${tripStatus.toLowerCase().replace('_', '-')}`}>
            <p className="trip-status-text">
              Trip Status: {tripStatus === 'EN_ROUTE' ? 'En Route to Pickup' :
                           tripStatus === 'IN_PROGRESS' ? 'Trip in Progress' :
                           tripStatus === 'COMPLETED' ? 'Trip Completed' : tripStatus}
            </p>
            {tripStatus === 'EN_ROUTE' && (
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleStartTrip} className="dashboard-feature" style={{ margin: '0', padding: '10px 20px', fontSize: '14px' }}>
                  Start Trip (Passenger Picked Up)
                </button>
              </div>
            )}
            {tripStatus === 'IN_PROGRESS' && (
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleCompleteTrip} className="dashboard-feature" style={{ margin: '0', padding: '10px 20px', fontSize: '14px' }}>
                  Complete Trip (Arrived at Destination)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trip Request Notification */}
        {incomingTripRequest && (
          <div className="trip-request-notification">
            <div className="trip-request-header">
              <h3 className="trip-request-title">🚗 New Trip Request!</h3>
              <p className="trip-request-timer">Accept within 30 seconds</p>
            </div>
            <div className="trip-request-details">
              <div className="trip-request-detail">
                <span>Pickup:</span>
                <strong>{incomingTripRequest.dropoffLat?.toFixed(4)}, {incomingTripRequest.dropoffLng?.toFixed(4)}</strong>
              </div>
              <div className="trip-request-detail">
                <span>Dropoff:</span>
                <strong>{incomingTripRequest.dropoffLat?.toFixed(4)}, {incomingTripRequest.dropoffLng?.toFixed(4)}</strong>
              </div>
              <div className="trip-request-detail">
                <span>Estimated Fare:</span>
                <strong>₹{incomingTripRequest.estimatedFare}</strong>
              </div>
              <div className="trip-request-detail">
                <span>ETA:</span>
                <strong>{incomingTripRequest.estimatedArrivalTime}</strong>
              </div>
            </div>
            <div className="trip-request-actions">
              <button onClick={handleAcceptTrip} className="trip-request-accept">
                ✅ Accept
              </button>
              <button onClick={handleRejectTrip} className="trip-request-reject">
                ❌ Reject
              </button>
            </div>
          </div>
        )}
        <div className={`dashboard-card ${isOnline ? 'online' : 'offline'}`}>
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome, {user?.name || 'Driver'}!</h1>
            <p className="dashboard-subtitle">Manage your rides and serve passengers</p>
          </div>

          {prediction && (
            <div className="prediction-card">
              <div className="prediction-header">
                <h3>Range Prediction</h3>
                <div className={`prediction-alert ${getTrafficLightColor(prediction.finalSOC)}`}>
                  {getAlertMessage(prediction.finalSOC)}
                </div>
              </div>
              <div className="prediction-details">
                <div className="prediction-metric">
                  <span>Final Battery Level</span>
                  <strong>{prediction.finalSOC?.toFixed(1)}%</strong>
                </div>
                <div className="prediction-metric">
                  <span>Energy Consumption</span>
                  <strong>{prediction.predictedEnergyConsumptionKwh?.toFixed(2)} kWh</strong>
                </div>
                <div className="prediction-metric">
                  <span>Confidence</span>
                  <strong>{(prediction.predictionConfidence * 100)?.toFixed(0)}%</strong>
                </div>
              </div>
              {prediction.recommendation && (
                <div className="prediction-recommendation">
                  <p>{prediction.recommendation}</p>
                </div>
              )}
            </div>
          )}

          <div className="dashboard-content">
            <button className="dashboard-feature" onClick={handleToggleOnline}>
              <div className="dashboard-feature-icon">🚦</div>
              <div className="dashboard-feature-title">{isOnline ? 'Go Offline' : 'Go Online'}</div>
              <div className="dashboard-feature-description">{isOnline ? 'Stop accepting ride requests' : 'Start accepting ride requests'}</div>
            </button>

            <button className="dashboard-feature" onClick={handleUpdateLocation}>
              <div className="dashboard-feature-icon">📍</div>
              <div className="dashboard-feature-title">Update Location</div>
              <div className="dashboard-feature-description">Share your current location</div>
            </button>

            <button className="dashboard-feature" onClick={handleViewActiveRides}>
              <div className="dashboard-feature-icon">📋</div>
              <div className="dashboard-feature-title">Active Rides</div>
              <div className="dashboard-feature-description">View and manage active rides</div>
            </button>

            <button className="dashboard-feature" onClick={handleViewEarnings}>
              <div className="dashboard-feature-icon">📊</div>
              <div className="dashboard-feature-title">Earnings</div>
              <div className="dashboard-feature-description">Track your daily earnings</div>
            </button>
          </div>
        </div>

        {/* Active Rides Modal */}
        {showActiveRidesModal && (
          <div className="modal-overlay" onClick={() => setShowActiveRidesModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Active Rides</h2>
                <button className="close-modal" onClick={() => setShowActiveRidesModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {activeRides.length === 0 ? (
                  <p className="no-data">No active rides at the moment</p>
                ) : (
                  <div className="rides-list">
                    {activeRides.slice(0, 1).map((ride) => (
                      <div key={ride.id} className="ride-card">
                        <div className="ride-info">
                          <h3>Ride #{ride.id}</h3>
                          <p><strong>Passenger:</strong> {ride.passengerName}</p>
                          <p><strong>From:</strong> {ride.pickupLocation}</p>
                          <p><strong>To:</strong> {ride.dropLocation}</p>
                          <p><strong>Status:</strong> <span className={`status-${ride.status.toLowerCase().replace(' ', '-')}`}>{ride.status}</span></p>
                          <p><strong>Fare:</strong> ₹{ride.fare}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Earnings Modal */}
        {showEarningsModal && (
          <div className="modal-overlay" onClick={() => setShowEarningsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Your Earnings</h2>
                <button className="close-modal" onClick={() => setShowEarningsModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {earnings ? (
                  <div className="earnings-summary">
                    <div className="earnings-grid">
                      <div className="earnings-item">
                        <h3>Today's Earnings</h3>
                        <p className="earnings-amount">₹{earnings.today || 0}</p>
                      </div>
                      <div className="earnings-item">
                        <h3>This Week</h3>
                        <p className="earnings-amount">₹{earnings.week || 0}</p>
                      </div>
                      <div className="earnings-item">
                        <h3>This Month</h3>
                        <p className="earnings-amount">₹{earnings.month || 0}</p>
                      </div>
                      <div className="earnings-item">
                        <h3>Active Hours Today</h3>
                        <p className="earnings-amount">{earnings.activeHoursToday || 0} hrs</p>
                      </div>
                      <div className="earnings-item">
                        <h3>Total Rides</h3>
                        <p className="earnings-amount">{earnings.totalRides || 0}</p>
                      </div>
                      <div className="earnings-item">
                        <h3>Average Rating</h3>
                        <p className="earnings-amount">{earnings.averageRating || 0} ⭐</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">Unable to load earnings data</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemedBackground>
  );
};

export default DriverHome;
