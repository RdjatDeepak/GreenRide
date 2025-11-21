import React, { useEffect, useMemo, useState } from 'react';
import WebSocketService from '../../services/WebSocketService';
import './LiveMap.css';

const haversineDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(pointB.latitude - pointA.latitude);
  const dLng = toRad(pointB.longitude - pointA.longitude);
  const lat1 = toRad(pointA.latitude);
  const lat2 = toRad(pointB.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
};

const formatRelativeTime = (date) => {
  if (!date) return '—';
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) {
    const mins = Math.floor(diff / 60_000);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  const hrs = Math.floor(diff / 3_600_000);
  return `${hrs}h ago`;
};

const LiveMap = ({ mode = 'passenger', height = 360 }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (mode !== 'passenger' || userLocation || locationError) return undefined;
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setLocationError('Geolocation unavailable in this browser.');
      return undefined;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (cancelled) return;
        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      },
      () => {
        if (!cancelled) {
          setLocationError('Permission denied for location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, [mode, userLocation, locationError]);

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const subscribeToStream = async () => {
      try {
        setStatus('connecting');
        unsubscribe = await WebSocketService.subscribeToVehicleLocations((payload) => {
          if (!mounted) return;
          const snapshotVehicles = payload?.vehicles || [];
          setVehicles(snapshotVehicles);
          setSummary(payload?.summary || null);
          setLastUpdated(payload?.receivedAt ? new Date(payload.receivedAt) : new Date());
          setStatus(payload?.source === 'mock' ? 'demo' : 'live');
          setSelectedVehicleId((prev) => {
            if (prev && snapshotVehicles.some((vehicle) => vehicle.id === prev)) {
              return prev;
            }
            return snapshotVehicles[0]?.id ?? null;
          });
        }, { mode });
      } catch (error) {
        if (mounted) {
          setStatus('demo');
        }
      }
    };

    subscribeToStream();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [mode]);

  const bounds = useMemo(() => {
    if (!vehicles.length) {
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    }
    const latitudes = vehicles.map((vehicle) => vehicle.latitude);
    const longitudes = vehicles.map((vehicle) => vehicle.longitude);
    return {
      minLat: Math.min(...latitudes),
      maxLat: Math.max(...latitudes),
      minLng: Math.min(...longitudes),
      maxLng: Math.max(...longitudes),
    };
  }, [vehicles]);

  const vehiclesWithPosition = useMemo(() => {
    if (!vehicles.length) return [];
    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    return vehicles.map((vehicle) => {
      const left = ((vehicle.longitude - bounds.minLng) / lngRange) * 80 + 10;
      const top = 90 - ((vehicle.latitude - bounds.minLat) / latRange) * 80;
      return {
        ...vehicle,
        position: {
          left: `${Math.min(95, Math.max(5, left))}%`,
          top: `${Math.min(90, Math.max(10, top))}%`,
        },
      };
    });
  }, [vehicles, bounds]);

  const userMarkerStyle = useMemo(() => {
    if (!userLocation) return null;
    const latRange = bounds.maxLat - bounds.minLat || 0.01;
    const lngRange = bounds.maxLng - bounds.minLng || 0.01;
    const left = ((userLocation.longitude - bounds.minLng) / lngRange) * 80 + 10;
    const top = 90 - ((userLocation.latitude - bounds.minLat) / latRange) * 80;
    return {
      left: `${Math.min(95, Math.max(5, left))}%`,
      top: `${Math.min(90, Math.max(10, top))}%`,
    };
  }, [userLocation, bounds]);

  const selectedVehicle = useMemo(
    () => vehiclesWithPosition.find((vehicle) => vehicle.id === selectedVehicleId),
    [vehiclesWithPosition, selectedVehicleId]
  );

  const vehiclesForPanel = useMemo(() => {
    if (!vehicles.length) return [];
    return vehicles.map((vehicle) =>
      mode === 'passenger' && userLocation
        ? {
            ...vehicle,
            distanceKm: haversineDistanceKm(userLocation, vehicle),
          }
        : { ...vehicle }
    );
  }, [vehicles, userLocation, mode]);

  const fleetStats = useMemo(() => {
    if (!vehicles.length) {
      return {
        activeVehicles: 0,
        avgRange: 0,
        lowBatteryCount: 0,
        totalKmDriven: 0,
      };
    }
    return {
      activeVehicles: summary?.activeVehicles ?? vehicles.length,
      avgRange:
        summary?.avgRange ??
        vehicles.reduce((acc, vehicle) => acc + (vehicle.rangeKm || 0), 0) / vehicles.length,
      lowBatteryCount: summary?.lowBatteryCount ?? vehicles.filter((vehicle) => (vehicle.batteryPct ?? 100) < 25).length,
      totalKmDriven:
        summary?.totalKmDriven ??
        vehicles.reduce((acc, vehicle) => acc + (vehicle.totalKmDriven || 0), 0),
    };
  }, [vehicles, summary]);

  const statusLabel = {
    connecting: 'Connecting…',
    live: 'Live data',
    demo: 'Demo mode',
  }[status] || 'Connecting…';

  const renderPassengerPanel = () => (
    <div className="live-map-panel">
      <div className="panel-header">
        <h4>Vehicles near you</h4>
        {userLocation && <span className="panel-pill">Precise location</span>}
      </div>
      {locationError && <p className="panel-hint">{locationError}</p>}
      {!vehicles.length && <p className="panel-hint">Waiting for vehicles...</p>}
      <ul className="vehicle-list">
        {vehiclesForPanel
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
          .slice(0, 4)
          .map((vehicle) => (
            <li
              key={vehicle.id}
              className={`vehicle-list-item ${selectedVehicleId === vehicle.id ? 'active' : ''}`}
              onClick={() => setSelectedVehicleId(vehicle.id)}
            >
              <div>
                <p className="vehicle-label">{vehicle.label}</p>
                <p className="vehicle-meta">{vehicle.driverName}</p>
              </div>
              <div>
                <p className="vehicle-distance">
                  {vehicle.distanceKm != null ? `${vehicle.distanceKm} km away` : 'Distance n/a'}
                </p>
                <p className="vehicle-range">{vehicle.rangeKm?.toFixed?.(0) ?? '--'} km range</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );

  const renderAdminPanel = () => (
    <div className="live-map-panel">
      <div className="panel-header">
        <h4>Vehicle telemetry</h4>
        {selectedVehicle && (
          <span className="panel-pill">{selectedVehicle.status}</span>
        )}
      </div>
      {selectedVehicle ? (
        <>
          <div className="telemetry-card">
            <h5>{selectedVehicle.label}</h5>
            <p className="vehicle-meta">Driver: {selectedVehicle.driverName}</p>
            <div className="telemetry-grid">
              <div>
                <span>Remaining range</span>
                <strong>{selectedVehicle.rangeKm?.toFixed?.(0) ?? '--'} km</strong>
              </div>
              <div>
                <span>Distance driven</span>
                <strong>{selectedVehicle.totalKmDriven?.toFixed?.(1) ?? '--'} km</strong>
              </div>
              <div>
                <span>Battery</span>
                <strong>{selectedVehicle.batteryPct ?? '--'}%</strong>
              </div>
              <div>
                <span>Speed</span>
                <strong>{selectedVehicle.speedKmph ?? '--'} km/h</strong>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="panel-hint">Select a vehicle marker to view details.</p>
      )}

      <h4>Fleet snapshot</h4>
      <div className="fleet-stats-grid">
        <div className="fleet-stat">
          <span>Active EVs</span>
          <strong>{fleetStats.activeVehicles}</strong>
        </div>
        <div className="fleet-stat">
          <span>Avg range</span>
          <strong>{fleetStats.avgRange.toFixed(0)} km</strong>
        </div>
        <div className="fleet-stat">
          <span>Driven today</span>
          <strong>{fleetStats.totalKmDriven.toFixed(0)} km</strong>
        </div>
        <div className="fleet-stat warning">
          <span>Low battery</span>
          <strong>{fleetStats.lowBatteryCount}</strong>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`live-map-wrapper live-map-${mode}`}>
      <div className="live-map-header">
        <div>
          <p className="label">Live EV map</p>
          <h3>Real-time vehicle visibility</h3>
        </div>
        <div className="status-block">
          <span className={`connection-pill status-${status}`}>{statusLabel}</span>
          <span className="updated-at">Updated {formatRelativeTime(lastUpdated)}</span>
        </div>
      </div>

      <div className="live-map-body">
          <div className="map-canvas" style={{ minHeight: height }}>
            <div className="map-grid" />
            {vehiclesWithPosition.map((vehicle) => (
              <button
                key={vehicle.id}
                className={`vehicle-marker ${selectedVehicleId === vehicle.id ? 'active' : ''}`}
                style={vehicle.position}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                type="button"
              >
                <span className="marker-label">{vehicle.label}</span>
                <span className="marker-battery">{vehicle.batteryPct ?? '--'}%</span>
              </button>
            ))}
            {userMarkerStyle && (
              <div className="user-marker" style={userMarkerStyle}>
                <span>You</span>
              </div>
            )}
          </div>

        {mode === 'passenger' ? renderPassengerPanel() : renderAdminPanel()}
      </div>
    </div>
  );
};

export default LiveMap;

