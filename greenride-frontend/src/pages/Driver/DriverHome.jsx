import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemedBackground from '../../components/common/ThemedBackground';
import '../Dashboard.css';

const DriverHome = () => {
  const { user } = useAuth();

  return (
    <ThemedBackground>
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome, {user?.email || 'Driver'}!</h1>
            <p className="dashboard-subtitle">Manage your rides and serve passengers</p>
          </div>

          <div className="dashboard-content">
            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">🚦</div>
              <div className="dashboard-feature-title">Go Online</div>
              <div className="dashboard-feature-description">Start accepting ride requests</div>
            </div>

            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">📍</div>
              <div className="dashboard-feature-title">Update Location</div>
              <div className="dashboard-feature-description">Share your current location</div>
            </div>

            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">📋</div>
              <div className="dashboard-feature-title">Active Rides</div>
              <div className="dashboard-feature-description">View and manage active rides</div>
            </div>

            <div className="dashboard-feature">
              <div className="dashboard-feature-icon">📊</div>
              <div className="dashboard-feature-title">Earnings</div>
              <div className="dashboard-feature-description">Track your daily earnings</div>
            </div>
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
};

export default DriverHome;
