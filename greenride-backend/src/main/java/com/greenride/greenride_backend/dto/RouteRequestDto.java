package com.greenride.greenride_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RouteRequestDto {
    // 1. Vehicle Identification & Battery Specs
    private Long vehicleId;
    private double currentBatterySOC;  // Current % of battery
    private double batteryCapacity;     // Total kWh capacity of the vehicle

    // 2. Journey Data (Start and End)
    private double startLat;
    private double startLng;
    private double endLat;
    private double endLng;

    // 3. Computed Features for ML
    // These must be calculated before sending to the ML Service
    private double distanceKm;
    private double avgSpeedKmh;

    // 4. Environmental & Contextual Data
    private double currentTempCelsius;
    private int passengerCount;

    // 5. Route Geometry
    private List<String> routePoints;

    /**
     * Helper method to calculate straight-line distance if needed.
     * Note: In a real app, 'distanceKm' should come from your Map API.
     */
    public double calculateTotalDistance() {
        double theta = startLng - endLng;
        double dist = Math.sin(Math.toRadians(startLat)) * Math.sin(Math.toRadians(endLat))
                + Math.cos(Math.toRadians(startLat)) * Math.cos(Math.toRadians(endLat))
                * Math.cos(Math.toRadians(theta));
        dist = Math.acos(dist);
        dist = Math.toDegrees(dist);
        return dist * 60 * 1.1515 * 1.609344; // Returns Kilometers
    }
}