import React, { useEffect, useState, useCallback } from 'react';
import { getApprovedDrivers } from '../../services/driverService';
import './AdminComponents.css';

const ApprovedDriversList = ({ refreshKey = 0 }) => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    const result = await getApprovedDrivers();
    if (result.success) {
      setDrivers(result.data || []);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to load drivers' });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers, refreshKey]);

  if (isLoading) {
    return <div className="loading">Loading approved drivers...</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h3>Approved Drivers</h3>
        <button className="refresh-btn" onClick={loadDrivers}>
          Refresh
        </button>
      </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="close-message">
            ×
          </button>
        </div>
      )}

      {drivers.length === 0 ? (
        <div className="empty-state">No approved drivers yet. Approve pending requests to see them here.</div>
      ) : (
        <div className="approved-drivers-table">
          <div className="drivers-table-header">
            <span>Name</span>
            <span>Email</span>
            <span>License</span>
            <span>Status</span>
          </div>
          {drivers.map((driver) => (
            <div key={driver.id || driver.userId} className="drivers-table-row">
              <span>{driver.name || driver.fullName || driver.email || 'N/A'}</span>
              <span>{driver.email || driver.username || 'N/A'}</span>
              <span>{driver.licenseNumber || driver.driverDetails?.licenseNumber || 'N/A'}</span>
              <span className="status-badge approved">Approved</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovedDriversList;

