import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ThemedBackground from '../../components/common/ThemedBackground';
import DriverRequestList from '../../components/admin/DriverRequestList';
import VehicleManagement from '../../components/admin/VehicleManagement';
import ApprovedDriversList from '../../components/admin/ApprovedDriversList';
import '../Dashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [driversRefreshKey, setDriversRefreshKey] = useState(0);

  const handleDriverStatusChanged = () => {
    setDriversRefreshKey((prev) => prev + 1);
  };

  return (
    <ThemedBackground>
      <div className="dashboard-container">
        <div className="dashboard-card">
          <div className="welcome-section">
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">Welcome, {user?.email || 'Admin'}! Manage the GreenRide system</p>
          </div>

          <div className="admin-tabs">
            <button
              className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Driver Requests
            </button>
            <button
              className={`tab-button ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              Vehicle Management
            </button>
            <button
              className={`tab-button ${activeTab === 'approvedDrivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvedDrivers')}
            >
              Approved Drivers
            </button>
          </div>

          <div className="admin-content">
            {activeTab === 'requests' && (
              <DriverRequestList onStatusChanged={handleDriverStatusChanged} />
            )}
            {activeTab === 'vehicles' && <VehicleManagement refreshKey={driversRefreshKey} />}
            {activeTab === 'approvedDrivers' && (
              <ApprovedDriversList refreshKey={driversRefreshKey} />
            )}
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
};

export default AdminDashboard;
