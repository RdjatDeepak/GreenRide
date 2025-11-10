import React, { useState, useEffect, useCallback } from 'react';
import { getAllVehicles, addVehicle, deleteVehicle, assignDriverToVehicle } from '../../services/vehicleService';
import { getApprovedDrivers } from '../../services/driverService';
import './AdminComponents.css';

const VehicleManagement = ({ refreshKey = 0 }) => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [processingId, setProcessingId] = useState(null);
  const [assigningVehicleId, setAssigningVehicleId] = useState(null);
  const [formData, setFormData] = useState({
    licensePlate: '',
    model: '',
    color: '',
    type: 'SEDAN',
  });

  const totalVehicles = vehicles.length;
  const assignedVehicles = vehicles.filter((vehicle) => Boolean(vehicle.driverId || vehicle.driver)).length;
  const unassignedVehicles = totalVehicles - assignedVehicles;
  const batterySamples = vehicles.filter((vehicle) => typeof vehicle.batteryLevel === 'number');
  const averageBatteryLevel =
    batterySamples.length > 0
      ? Math.round(batterySamples.reduce((acc, vehicle) => acc + vehicle.batteryLevel, 0) / batterySamples.length)
      : null;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [vehiclesResult, driversResult] = await Promise.all([
      getAllVehicles(),
      getApprovedDrivers(),
    ]);

    if (vehiclesResult.success) {
      setVehicles(vehiclesResult.data || []);
    }
    if (driversResult.success) {
      setDrivers(driversResult.data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const result = await addVehicle(formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Vehicle added successfully!' });
      setShowAddForm(false);
      setFormData({ licensePlate: '', model: '', color: '', type: 'SEDAN' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add vehicle' });
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    setProcessingId(vehicleId);
    setMessage({ type: '', text: '' });

    const result = await deleteVehicle(vehicleId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Vehicle deleted successfully!' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete vehicle' });
    }
    setProcessingId(null);
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    setAssigningVehicleId(vehicleId);
    setMessage({ type: '', text: '' });

    const result = await assignDriverToVehicle(vehicleId, driverId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Driver assigned to vehicle successfully!' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to assign driver' });
    }
    setAssigningVehicleId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h3>Vehicle Management</h3>
        <div>
          <button onClick={loadData} className="refresh-btn">Refresh</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-add">
            {showAddForm ? 'Cancel' : 'Add Vehicle'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message-alert ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="close-message">×</button>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddVehicle} className="add-vehicle-form">
          <div className="form-row">
            <div className="form-group">
              <label>License Plate *</label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                placeholder="e.g., DL-01-AB-1234"
                required
              />
            </div>
            <div className="form-group">
              <label>Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., Tesla Model 3"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Color *</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g., White"
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="COMPACT">Compact</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-submit">Add Vehicle</button>
        </form>
      )}

      <div className="vehicle-summary">
        <div className="summary-card">
          <span className="summary-label">Total Vehicles</span>
          <span className="summary-value">{totalVehicles}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Assigned Vehicles</span>
          <span className="summary-value">{assignedVehicles}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Unassigned Vehicles</span>
          <span className="summary-value">{unassignedVehicles}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Average Battery</span>
          <span className="summary-value">
            {Number.isFinite(averageBatteryLevel) ? `${averageBatteryLevel}%` : 'N/A'}
          </span>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-state">No vehicles found. Add a vehicle to get started.</div>
      ) : (
        <div className="vehicles-list">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-info">
                <div className="vehicle-header">
                  <h4>{vehicle.licensePlate || vehicle.vehicleNumber || `Vehicle-${vehicle.id}`}</h4>
                  <span className="vehicle-type">{vehicle.type}</span>
                </div>
                <div className="vehicle-details">
                  <div className="detail-item">
                    <span className="detail-label">License Plate:</span>
                    <span className="detail-value">{vehicle.licensePlate || vehicle.vehicleNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Model:</span>
                    <span className="detail-value">{vehicle.model || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Color:</span>
                    <span className="detail-value">{vehicle.color || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Battery:</span>
                    <span className="detail-value">
                      {typeof vehicle.batteryLevel === 'number'
                        ? `${vehicle.batteryLevel}%`
                        : vehicle.chargingStatus || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Driver:</span>
                    <span className="detail-value">
                      {vehicle.driver?.email || vehicle.driverName || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="vehicle-actions">
                {drivers.length > 0 && (
                  <select
                    className="driver-select"
                    value={vehicle.driverId || ''}
                    onChange={(e) => {
                      const driverId = e.target.value;
                      if (driverId) {
                        const numericId = Number(driverId);
                        handleAssignDriver(vehicle.id, Number.isNaN(numericId) ? driverId : numericId);
                      }
                    }}
                    disabled={assigningVehicleId === vehicle.id}
                  >
                    <option value="">Assign Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.email || driver.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => handleDeleteVehicle(vehicle.id)}
                  className="btn-delete"
                  disabled={processingId === vehicle.id}
                >
                  {processingId === vehicle.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {drivers.length === 0 && (
        <div className="info-banner">
          No approved drivers available yet. Approve driver requests to enable vehicle assignment.
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;

