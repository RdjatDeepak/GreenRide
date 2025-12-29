package com.greenride.greenride_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationUpdateDTO {
    private Long vehicleId;
    Long driverId;
    private double batteryLevel; // Current %
    private double lat;
    private double lng;
    private double totalKmDriven;     // Odometer
    private double remainingRangeKm;  // Calculated by ML or Logic
    private String currentDestination; // Where the cab is going
    private String status;            // "AVAILABLE", "BUSY", "CHARGING"
}
