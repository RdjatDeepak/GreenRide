import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import polyline from '@mapbox/polyline';
import './LiveMap.css';

import webSocketService from '../../services/WebSocketService';
import { calculateRangePrediction, getTrafficLightColor, getAlertMessage } from '../../services/mlService';
import { getNearbyVehicles } from '../../services/rideService';
import { getAllVehicles } from '../../services/vehicleService';

// Standard Leaflet Icon setup (as per our previous conversation)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// A unique icon for the GreenRide EV - using a data URL to avoid missing file issues
const evIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iMzUiIHZpZXdCb3g9IjAgMCAzNSAzNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM1IiBoZWlnaHQ9IjM1IiByeD0iOCIgZmlsbD0iIzEwYjk4MSIvPgo8cGF0aCBkPSJNMjIgMTJ2NmgtMnYtNmgyem0tNiAwaDZ2NmgtNnYtNnoiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjE3LjUiIHk9IjMwIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RVY8L3RleHQ+Cjwvc3ZnPg==',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

// Icon for passenger's current location
const passengerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iOSIgc3Ryb2tlPSIjZmY2YjZiIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IiNmZjZiNmIiLz4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iNCIgZmlsbD0iI2ZmNmI2YiIvPgo8L3N2Zz4=',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
});

// Helper function to calculate distance between two coordinates
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

const LiveMap = ({ mode = 'passenger', bookedVehicleId, height = 500, onVehicleSelect, selectedVehicle, onDestinationSelect, destination, route, onLocationUpdate }) => {
    console.log('LiveMap rendered with mode:', mode, 'height:', height);

    // State to hold the live position update
    const [livePosition, setLivePosition] = useState(null);

    // State for ML predictions
    const [prediction, setPrediction] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(false);

    // State for vehicles (for passenger/admin modes)
    const [vehicles, setVehicles] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [mapError, setMapError] = useState(null);
    const [mapLoading, setMapLoading] = useState(true);

    // State for destination and route
    const [map, setMap] = useState(null);

    // Default position (e.g., center of your city)
    const defaultPosition = [28.6139, 77.2090];

    useEffect(() => {
        let unsubscribe = null;

        // Function to handle connection success
        const onConnected = async () => {
            console.log("WebSocket Connected!");

            // Subscribe to vehicle locations for real-time updates
            if (bookedVehicleId || mode === 'admin') {
                try {
                    unsubscribe = await webSocketService.subscribeToVehicleLocations((data) => {
                        if (bookedVehicleId) {
                            // Driver mode: Find the specific vehicle data
                            const vehicleData = data.vehicles?.find(vehicle => vehicle.id === bookedVehicleId);
                            if (vehicleData) {
                                // Update the state with the new live location
                                setLivePosition([vehicleData.latitude, vehicleData.longitude]);
                                console.log(`Driver at: ${vehicleData.latitude}, ${vehicleData.longitude}. Battery: ${vehicleData.batteryPct}%`);
                                // Note: fetchPrediction is now called explicitly when trip is confirmed, not on every location update
                                // This prevents unnecessary API calls with null/empty values
                            }
                        } else if (mode === 'admin') {
                            // Admin mode: Only update existing vehicles with real-time data, don't replace the full list
                            setVehicles(currentVehicles => {
                                if (!data.vehicles || data.vehicles.length === 0) return currentVehicles;

                                // Update existing vehicles with real-time data only
                                const updatedVehicles = currentVehicles.map(existingVehicle => {
                                    const wsVehicle = data.vehicles.find(v => v.id === existingVehicle.id);
                                    if (wsVehicle) {
                                        // Merge real-time data with existing vehicle
                                        return { ...existingVehicle, ...wsVehicle };
                                    }
                                    return existingVehicle;
                                });
                                console.log(`Admin: Updated ${data.vehicles.length} vehicles with real-time data`);
                                return updatedVehicles;
                            });
                        }
                    });
                } catch (error) {
                    console.error("WebSocket subscription error:", error);
                }
            }
        };

        // Connect when the component mounts
        webSocketService.connect().then(onConnected).catch((error) => console.error("WebSocket Error:", error));

        // Disconnect when the component unmounts
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [bookedVehicleId, mode]); // Re-run effect if the booked vehicle or mode changes

    // Fetch vehicles based on mode
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                if (mode === 'passenger') {
                    // Get user's location for nearby vehicles
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            async (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                console.log('Geolocation obtained:', [lat, lng]);
                                setUserLocation([lat, lng]);

                                const result = await getNearbyVehicles(lat, lng);
                                if (result.success) {
                                    console.log('Nearby vehicles fetched:', result.data);
                                    console.log('User location:', [lat, lng]);
                                    console.log('Number of vehicles:', result.data.length);
                                    setVehicles(result.data);
                                } else {
                                    console.error('Failed to fetch nearby vehicles:', result.error);
                                }
                                setMapLoading(false);
                            },
                            async (error) => {
                                console.error('Geolocation error:', error);
                                console.log('Using default location:', defaultPosition);
                                // Fallback to default location
                                setUserLocation(defaultPosition);

                                // Still try to fetch vehicles with default location
                                const result = await getNearbyVehicles(defaultPosition[0], defaultPosition[1]);
                                if (result.success) {
                                    console.log('Nearby vehicles fetched with default location:', result.data);
                                    setVehicles(result.data);
                                } else {
                                    console.error('Failed to fetch nearby vehicles with default location:', result.error);
                                }
                                setMapLoading(false);
                            }
                        );
                    } else {
                        setUserLocation(defaultPosition);
                        setMapLoading(false);
                    }
                } else if (mode === 'admin') {
                    // Get all vehicles for admin
                    const result = await getAllVehicles();
                    if (result.success && result.data) {
                        // Show all vehicles, even those without coordinates
                        setVehicles(result.data);
                        console.log(`Admin: Loaded ${result.data.length} vehicles`);
                    } else {
                        // No fallback data - vehicles must be added by admin
                        console.log('Admin: No vehicles available - please add vehicles through admin panel');
                        setVehicles([]);
                    }
                    setMapLoading(false);
                }
            } catch (error) {
                console.error('Failed to fetch vehicles:', error);
                setMapLoading(false);
            }
        };

        if (mode !== 'driver') {
            fetchVehicles();
        } else {
            setMapLoading(false);
        }
    }, [mode]);

    // Callback to parent component when user location is obtained
    useEffect(() => {
        if (onLocationUpdate && userLocation) {
            onLocationUpdate(userLocation);
        }
    }, [userLocation, onLocationUpdate]);

    // Function to fetch ML prediction
    // Only call when there's an actual trip with known pickup/dropoff locations
    const fetchPrediction = async (vehicleData, tripDistance = null) => {
        if (!vehicleData) return;

        // Skip if no valid distance (tripDistance should be passed from parent component)
        if (!tripDistance || tripDistance <= 0) {
            console.log('Skipping prediction - no valid trip distance available');
            return;
        }

        setPredictionLoading(true);
        try {
            const predictionData = {
                vehicleId: vehicleData.id, // Required for route optimization
                distance: tripDistance, // Use actual trip distance
                temperature: 22.0,
                current_soc: vehicleData.batteryLevel || 85.0,
                avg_speed: 55.0
            };

            const result = await calculateRangePrediction(predictionData);
            if (result.success) {
                setPrediction(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch prediction:', error);
        } finally {
            setPredictionLoading(false);
        }
    };

    // Determine map center based on mode
    let mapCenter = defaultPosition;
    if (mode === 'driver' && livePosition) {
        mapCenter = livePosition;
    } else if (mode === 'passenger' && userLocation) {
        mapCenter = userLocation;
    } else if (mode === 'admin') {
        mapCenter = defaultPosition;
    }

    if (mapLoading) {
        return (
            <div style={{
                height: `${height}px`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <p>🗺️ Loading map...</p>
                    <p style={{ fontSize: '14px' }}>Fetching vehicle data</p>
                </div>
            </div>
        );
    }

    try {
        // Validate map center coordinates
        const validCenter = Array.isArray(mapCenter) && mapCenter.length === 2 &&
                           !isNaN(mapCenter[0]) && !isNaN(mapCenter[1]) ? mapCenter : defaultPosition;

        return (
            <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
                <MapContainer
                    center={validCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    key={`map-${mode}-${vehicles.length}`} // Force re-render when vehicles change
                    whenReady={(mapInstance) => {
                        setMap(mapInstance.target);
                    }}
                    eventHandlers={{
                        click: (e) => {
                            if (mode === 'passenger' && onDestinationSelect) {
                                onDestinationSelect([e.latlng.lat, e.latlng.lng]);
                            }
                        },
                    }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Show live position for driver mode */}
                    {mode === 'driver' && livePosition && Array.isArray(livePosition) && livePosition.length === 2 && (
                        <Marker position={livePosition} icon={evIcon}>
                            <Popup>
                                Your GreenRide Driver is here!
                                {prediction && (
                                    <div>
                                        <p>Battery: {prediction.finalSOC?.toFixed(1)}%</p>
                                        <p>Range: ~{prediction.predictedEnergyConsumptionKwh?.toFixed(1)} kWh</p>
                                    </div>
                                )}
                            </Popup>
                        </Marker>
                    )}

                    {/* Show passenger's current location */}
                    {mode === 'passenger' && userLocation && (
                        <Marker
                            position={userLocation}
                            icon={passengerIcon}
                        >
                            <Popup>
                                <div>
                                    <h4>Your Current Location</h4>
                                    <p>You are here!</p>
                                    <p><strong>Coordinates:</strong> {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Show nearby vehicles for passenger mode */}
                    {mode === 'passenger' && vehicles.filter(vehicle =>
                        vehicle && (vehicle.latitude || vehicle.lat) && (vehicle.longitude || vehicle.lng)
                    ).map((vehicle) => (
                        <Marker
                            key={`passenger-${vehicle.id}`}
                            position={[vehicle.latitude || vehicle.lat, vehicle.longitude || vehicle.lng]}
                            icon={evIcon}
                            eventHandlers={{
                                click: () => onVehicleSelect && onVehicleSelect(vehicle),
                            }}
                        >
                            <Popup>
                                <div>
                                    <h4>GreenRide Vehicle #{vehicle.id}</h4>
                                    <p><strong>License Plate:</strong> {vehicle.licensePlate || vehicle.vehicleNumber || 'N/A'}</p>
                                    <p><strong>Make:</strong> {vehicle.make || 'N/A'}</p>
                                    <p><strong>Model:</strong> {vehicle.model || 'EV'}</p>
                                    <p><strong>Type:</strong> {vehicle.type || 'N/A'}</p>
                                    <p><strong>Color:</strong> {vehicle.color || 'N/A'}</p>
                                    <p><strong>Battery Level:</strong> {vehicle.currentBatteryLevel || vehicle.batteryLevel || vehicle.batteryPct || 'N/A'}%</p>
                                    <p><strong>Range:</strong> {vehicle.range || 'N/A'} km</p>
                                    <p><strong>Status:</strong> {vehicle.status || 'Available'}</p>
                                    <p><strong>Location:</strong> {(vehicle.latitude || vehicle.lat).toFixed(4)}, {(vehicle.longitude || vehicle.lng).toFixed(4)}</p>
                                    <p><strong>Distance:</strong> ~{calculateDistance(userLocation, [vehicle.latitude || vehicle.lat, vehicle.longitude || vehicle.lng]).toFixed(1)} km</p>
                                    <button onClick={() => onVehicleSelect && onVehicleSelect(vehicle)} style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Select Vehicle</button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Show all vehicles for admin mode */}
                    {mode === 'admin' && vehicles.map((vehicle) => {
                        // Use vehicle coordinates if available, otherwise use default position
                        const lat = vehicle.latitude || vehicle.lat || defaultPosition[0];
                        const lng = vehicle.longitude || vehicle.lng || defaultPosition[1];
                        const hasValidCoords = (vehicle.latitude || vehicle.lat) && (vehicle.longitude || vehicle.lng);

                        return (
                            <Marker
                                key={`admin-${vehicle.id}`}
                                position={[lat, lng]}
                                icon={evIcon}
                            >
                            <Popup>
                                <div>
                                    <h4>Vehicle #{vehicle.id}</h4>
                                    <p><strong>License Plate:</strong> {vehicle.licensePlate || vehicle.vehicleNumber || 'N/A'}</p>
                                    {vehicle.make && <p><strong>Make:</strong> {vehicle.make}</p>}
                                    {vehicle.model && <p><strong>Model:</strong> {vehicle.model}</p>}
                                    {vehicle.type && <p><strong>Type:</strong> {vehicle.type}</p>}
                                    {vehicle.color && <p><strong>Color:</strong> {vehicle.color}</p>}
                                    <p><strong>Battery Level:</strong> {vehicle.batteryPct || vehicle.batteryLevel || vehicle.currentBatteryLevel || 'N/A'}%</p>
                                    {vehicle.range && <p><strong>Range:</strong> {vehicle.range} km</p>}
                                    <p><strong>Status:</strong> {vehicle.status || 'Unknown'}</p>
                                    <p><strong>Location:</strong> {(vehicle.latitude || vehicle.lat).toFixed(4)}, {(vehicle.longitude || vehicle.lng).toFixed(4)}</p>
                                    <p><strong>Driver:</strong> {vehicle.driver?.email || vehicle.driverName || 'Unassigned'}</p>
                                    {vehicle.driverId && <p><strong>Assigned Driver ID:</strong> {vehicle.driverId}</p>}
                                    {vehicle.isAvailable !== undefined && <p><strong>Available:</strong> {vehicle.isAvailable ? 'Yes' : 'No'}</p>}
                                    {vehicle.isOnline !== undefined && <p><strong>Online:</strong> {vehicle.isOnline ? 'Yes' : 'No'}</p>}
                                    {vehicle.lastUpdated && <p><strong>Last Updated:</strong> {new Date(vehicle.lastUpdated).toLocaleString()}</p>}
                                </div>
                            </Popup>
                        </Marker>
                        );
                    })}

                    {/* Show destination marker for passenger mode */}
                    {mode === 'passenger' && destination && (
                        <Marker
                            position={destination}
                            icon={L.icon({
                                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iOSIgc3Ryb2tlPSIjZmYwMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IiNmZjAwMDAiLz4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iNCIgZmlsbD0iI2ZmMDAwMCIvPgo8L3N2Zz4=',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10],
                                popupAnchor: [0, -10],
                            })}
                        >
                            <Popup>
                                <div>
                                    <h4>Destination</h4>
                                    <p>Lat: {destination[0].toFixed(4)}, Lng: {destination[1].toFixed(4)}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Show route polyline */}
                    {route && (
                        <Polyline
                            positions={typeof route === 'string' ? polyline.decode(route) : route}
                            color="#2e7d32" // Eco-green color
                            weight={6}
                            opacity={0.8}
                        />
                    )}
                </MapContainer>
            </div>
        );
    } catch (error) {
        console.error('Map rendering error:', error);
        setMapError(error.message);
        return (
            <div style={{
                height: `${height}px`,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <p>🚗 Unable to load map</p>
                    <p style={{ fontSize: '14px' }}>Error: {error.message}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>Mode: {mode}, Vehicles: {vehicles.length}</p>
                </div>
            </div>
        );
    }
};

export default LiveMap;