import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';
const VEHICLE_TOPIC = import.meta.env.VITE_WS_VEHICLE_TOPIC || '/topic/vehicle-locations';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

class WebSocketService {
  constructor() {
    this.client = null;
    this.connectionPromise = null;
    this.mockFleet = this.createInitialMockFleet();
  }

  createInitialMockFleet() {
    const baseLat = 28.6139;
    const baseLng = 77.209;
    return Array.from({ length: 6 }).map((_, idx) => {
      const offsetLat = (Math.random() - 0.5) * 0.05;
      const offsetLng = (Math.random() - 0.5) * 0.05;
      return {
        id: `EV-${idx + 1}`,
        label: `EV-${idx + 1}`,
        driverName: ['Ayesha', 'Rahul', 'Priya', 'Aman', 'Zara', 'Kabir'][idx % 6],
        latitude: baseLat + offsetLat,
        longitude: baseLng + offsetLng,
        speedKmph: clamp(25 + Math.random() * 30, 10, 60),
        rangeKm: clamp(120 - idx * 8 + Math.random() * 10, 60, 150),
        batteryPct: clamp(80 - idx * 7 + Math.random() * 8, 25, 100),
        totalKmDriven: 1200 + idx * 40 + Math.random() * 50,
        status: 'AVAILABLE',
        heading: Math.random() * 360,
      };
    });
  }

  async connect() {
    if (this.client && this.client.connected) {
      return this.client;
    }
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_BASE_URL),
        connectHeaders: headers,
        onConnect: () => {
          resolve(this.client);
        },
        onStompError: (frame) => {
          this.connectionPromise = null;
          reject(frame.headers['message']);
        },
        onWebSocketError: (error) => {
          this.connectionPromise = null;
          reject(error);
        }
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  async subscribe(topic, handler) {
    const client = await this.connect();
    return new Promise((resolve) => {
      const subscription = client.subscribe(topic, (message) => {
        try {
          const parsed = JSON.parse(message.body);
          handler(parsed);
        } catch (error) {
          handler(message.body);
        }
      });
      resolve(() => {
        subscription.unsubscribe();
      });
    });
  }

  async subscribeToVehicleLocations(callback, options = {}) {
    try {
      const unsubscribe = await this.subscribe(VEHICLE_TOPIC, (payload) => {
        callback({
          ...this.normalizePayload(payload),
          source: 'realtime',
        });
      });
      return unsubscribe;
    } catch (error) {
      console.warn('Falling back to mock vehicle locations', error);
      return this.startMockStream(callback, options);
    }
  }

  normalizePayload(payload) {
    if (!payload) {
      return {
        vehicles: [],
        summary: null,
        receivedAt: new Date().toISOString(),
      };
    }

    const normalizeVehicle = (vehicle, idx) => {
      if (!vehicle) return null;
      const latitude =
        Number(vehicle.latitude ?? vehicle.lat ?? vehicle.location?.lat) || 0;
      const longitude =
        Number(vehicle.longitude ?? vehicle.lng ?? vehicle.location?.lng) || 0;

      return {
        id: vehicle.id ?? vehicle.vehicleId ?? vehicle.licensePlate ?? `vehicle-${idx}`,
        label:
          vehicle.label ??
          vehicle.alias ??
          vehicle.licensePlate ??
          vehicle.vehicleNumber ??
          `Vehicle ${idx + 1}`,
        driverName: vehicle.driverName ?? vehicle.driver ?? 'Unassigned',
        latitude,
        longitude,
        speedKmph: Number(vehicle.speedKmph ?? vehicle.speed ?? 0),
        rangeKm: Number(vehicle.rangeKm ?? vehicle.remainingRange ?? vehicle.estRange ?? 0),
        batteryPct: clamp(Number(vehicle.batteryPct ?? vehicle.battery ?? 0), 0, 100),
        totalKmDriven: Number(vehicle.totalKmDriven ?? vehicle.distanceDriven ?? 0),
        status: vehicle.status ?? vehicle.state ?? 'AVAILABLE',
        heading: Number(vehicle.heading ?? vehicle.bearing ?? 0),
        lastUpdated: vehicle.lastUpdated ?? vehicle.timestamp ?? new Date().toISOString(),
      };
    };

    const vehiclesArray = Array.isArray(payload.vehicles)
      ? payload.vehicles
      : Array.isArray(payload)
        ? payload
        : payload.data?.vehicles ?? [];

    const normalizedVehicles = vehiclesArray
      .map((vehicle, idx) => normalizeVehicle(vehicle, idx))
      .filter(Boolean);

    const summary = payload.summary ?? {
      activeVehicles: normalizedVehicles.length,
      avgRange:
        normalizedVehicles.reduce((acc, curr) => acc + (curr.rangeKm || 0), 0) /
        (normalizedVehicles.length || 1),
      lowBatteryCount: normalizedVehicles.filter((v) => v.batteryPct < 25).length,
      totalKmDriven: normalizedVehicles.reduce(
        (acc, curr) => acc + (curr.totalKmDriven || 0),
        0
      ),
    };

    return {
      vehicles: normalizedVehicles,
      summary,
      receivedAt: payload.receivedAt ?? new Date().toISOString(),
    };
  }

  startMockStream(callback, options = {}) {
    const { mode = 'passenger' } = options;
    const emitSnapshot = () => {
      this.mockFleet = this.mockFleet.map((vehicle) => {
        const latShift = (Math.random() - 0.5) * 0.002;
        const lngShift = (Math.random() - 0.5) * 0.002;
        const consumption = Math.random() * 2;
        const distanceIncrement = 0.5 + Math.random() * 1.5;
        return {
          ...vehicle,
          latitude: vehicle.latitude + latShift,
          longitude: vehicle.longitude + lngShift,
          speedKmph: clamp(vehicle.speedKmph + (Math.random() - 0.5) * 5, 5, 60),
          rangeKm: clamp(vehicle.rangeKm - consumption, 10, 160),
          batteryPct: clamp(vehicle.batteryPct - consumption * 0.6, 5, 100),
          totalKmDriven: vehicle.totalKmDriven + distanceIncrement,
          status: vehicle.batteryPct < 15 ? 'CHARGING' : 'AVAILABLE',
          heading: (vehicle.heading + Math.random() * 15) % 360,
          lastUpdated: new Date().toISOString(),
        };
      });

      const payload = {
        vehicles: this.mockFleet,
        summary: {
          activeVehicles: this.mockFleet.filter((vehicle) => vehicle.status !== 'OFFLINE').length,
          avgRange:
            this.mockFleet.reduce((acc, curr) => acc + curr.rangeKm, 0) /
            this.mockFleet.length,
          lowBatteryCount: this.mockFleet.filter((vehicle) => vehicle.batteryPct < 25).length,
          totalKmDriven: this.mockFleet.reduce(
            (acc, curr) => acc + curr.totalKmDriven,
            0
          ),
        },
        receivedAt: new Date().toISOString(),
        source: 'mock',
        mode,
      };

      callback(payload);
    };

    emitSnapshot();
    const intervalId = setInterval(emitSnapshot, 5000);
    return () => clearInterval(intervalId);
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
