import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemedBackground from '../../components/common/ThemedBackground';
import DriverRequestForm from '../../components/driver/DriverRequestForm';
import { submitDriverRequest, getDriverRequestStatus } from '../../services/driverService';
import '../Dashboard.css';
import './PassengerHome.css';

const PassengerHome = () => {
  const { user } = useAuth();
  const [showDriverRequestForm, setShowDriverRequestForm] = useState(false);
  const [driverRequestStatus, setDriverRequestStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
            <h1 className="dashboard-title">Welcome, {user?.email || 'Passenger'}!</h1>
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
            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">📍</div>
              <div className="dashboard-feature-title">Book a Ride</div>
              <div className="dashboard-feature-description">Find available EV drivers near you</div>
            </div>

            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">🗺️</div>
              <div className="dashboard-feature-title">Track Ride</div>
              <div className="dashboard-feature-description">Real-time location tracking</div>
            </div>

            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">📱</div>
              <div className="dashboard-feature-title">My Rides</div>
              <div className="dashboard-feature-description">View your ride history</div>
            </div>

            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">⭐</div>
              <div className="dashboard-feature-title">Rate & Review</div>
              <div className="dashboard-feature-description">Share your experience</div>
            </div>
          </div>
        </div>
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
