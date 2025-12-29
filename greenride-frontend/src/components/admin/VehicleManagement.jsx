import React, { useState, useEffect, useCallback } from 'react';
import { getAllVehicles, addVehicle, deleteVehicle, assignDriverToVehicle } from '../../services/vehicleService';
import { getApprovedDrivers } from '../../services/driverService';
import './AdminComponents.css';

// Location Picker Component
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Using Nominatim API for geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
        setSelectedLocation(location);
        onLocationSelect(location);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  return (
    <div className="location-picker">
      <div className="location-search">
        <input
          type="text"
          placeholder="Search for location (e.g., Delhi, India)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="button"
          onClick={searchLocation}
          disabled={isSearching || !searchQuery.trim()}
          className="search-btn"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      {selectedLocation && (
        <div className="selected-location">
          <p><strong>Selected Location:</strong> {selectedLocation.displayName}</p>
          <p><strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
        </div>
      )}
      <div className="location-instructions">
        <small>Enter a location name and click Search, or the coordinates will be set to default (Delhi) if not specified.</small>
      </div>
    </div>
  );
};

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
    make: '',
    model: '',
    batteryLevel: 100,
    status: 'AVAILABLE',
    latitude: 28.6139, // Default to Delhi
    longitude: 77.2090,
    type: 'SEDAN',
    isAvailable: true,
    isOnline: true,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const totalVehicles = vehicles.length;
  const assignedVehicles = vehicles.filter((vehicle) => Boolean(vehicle.driverId || vehicle.driver)).length;
  const unassignedVehicles = totalVehicles - assignedVehicles;
  const batterySamples = vehicles.filter((vehicle) =>
    typeof (vehicle.batteryPct || vehicle.batteryLevel || vehicle.currentBatteryLevel || vehicle.battery) === 'number'
  );
  const averageBatteryLevel =
    batterySamples.length > 0
      ? Math.round(batterySamples.reduce((acc, vehicle) => acc + (vehicle.batteryPct || vehicle.batteryLevel || vehicle.currentBatteryLevel || vehicle.battery), 0) / batterySamples.length)
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
      setFormData({
        licensePlate: '',
        make: '',
        model: '',
        batteryLevel: 100,
        status: 'AVAILABLE',
        latitude: 28.6139,
        longitude: 77.2090,
        type: 'SEDAN',
      });
      setSelectedLocation(null);
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

  const handleUnassignDriver = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to unassign this driver from the vehicle?')) {
      return;
    }

    setAssigningVehicleId(vehicleId);
    setMessage({ type: '', text: '' });

    // Use assignDriverToVehicle with driverId 0 to unassign
    const result = await assignDriverToVehicle(vehicleId, 0);
    if (result.success) {
      setMessage({ type: 'success', text: 'Driver unassigned from vehicle successfully!' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to unassign driver' });
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

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
    setSelectedLocation(location);
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
              <label>Make *</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                placeholder="e.g., Tesla"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., Model 3"
                required
              />
            </div>
            <div className="form-group">
              <label>Battery Level *</label>
              <input
                type="number"
                name="batteryLevel"
                value={formData.batteryLevel}
                onChange={handleInputChange}
                placeholder="e.g., 85"
                min="0"
                max="100"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_RIDE">In Ride</option>
                <option value="CHARGING">Charging</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
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
          <div className="form-row">
            <div className="form-group">
              <label>Available</label>
              <select
                name="isAvailable"
                value={formData.isAvailable}
                onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.value === 'true' }))}
              >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Online</label>
              <select
                name="isOnline"
                value={formData.isOnline}
                onChange={(e) => setFormData(prev => ({ ...prev, isOnline: e.target.value === 'true' }))}
              >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Location</label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={selectedLocation}
              />
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
                    <span className="detail-label">Make:</span>
                    <span className="detail-value">{vehicle.make || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Model:</span>
                    <span className="detail-value">{vehicle.model || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Battery Level:</span>
                    <span className="detail-value">
                      {vehicle.batteryPct != null ? `${vehicle.batteryPct}%` :
                       vehicle.batteryLevel != null ? `${vehicle.batteryLevel}%` :
                       vehicle.currentBatteryLevel != null ? `${vehicle.currentBatteryLevel}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{vehicle.status || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">
                      {(vehicle.latitude != null || vehicle.lat != null) && (vehicle.longitude != null || vehicle.lng != null)
                        ? `${Number(vehicle.latitude || vehicle.lat).toFixed(4)}, ${Number(vehicle.longitude || vehicle.lng).toFixed(4)}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Driver:</span>
                    <span className="detail-value">
                      {vehicle.driver?.email || vehicle.driverName || 'Unassigned'}
                    </span>
                  </div>
                  {vehicle.isAvailable !== undefined || vehicle.available !== undefined ? (
                    <div className="detail-item">
                      <span className="detail-label">Available:</span>
                      <span className="detail-value">
                        {(vehicle.isAvailable ?? vehicle.available) ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ) : null}
                  {vehicle.isOnline !== undefined || vehicle.online !== undefined ? (
                    <div className="detail-item">
                      <span className="detail-label">Online:</span>
                      <span className="detail-value">
                        {(vehicle.isOnline ?? vehicle.online) ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ) : null}
                  {vehicle.color && (
                    <div className="detail-item">
                      <span className="detail-label">Color:</span>
                      <span className="detail-value">{vehicle.color}</span>
                    </div>
                  )}
                  {vehicle.type && (
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{vehicle.type}</span>
                    </div>
                  )}
                  {vehicle.range && (
                    <div className="detail-item">
                      <span className="detail-label">Range:</span>
                      <span className="detail-value">{vehicle.range} km</span>
                    </div>
                  )}
                  {vehicle.lastUpdated && (
                    <div className="detail-item">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{new Date(vehicle.lastUpdated).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="vehicle-actions">
                {drivers.length > 0 && (
                  <>
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
                    {vehicle.driverId && (
                      <button
                        onClick={() => handleUnassignDriver(vehicle.id)}
                        className="btn-unassign"
                        disabled={assigningVehicleId === vehicle.id}
                      >
                        {assigningVehicleId === vehicle.id ? 'Unassigning...' : 'Unassign'}
                      </button>
                    )}
                  </>
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
