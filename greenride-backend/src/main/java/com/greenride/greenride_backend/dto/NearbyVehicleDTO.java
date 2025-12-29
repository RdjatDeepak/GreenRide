package com.greenride.greenride_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NearbyVehicleDTO {
    @JsonProperty("id")
    private Long vehicleId;
    private String model;
    private String licensePlate;
    private double batteryLevel;
    private double lat;
    private double lng;
    private String driverName; // Just the String name, not the User entity
    private double distance;   // Crucial: This is calculated on the fly
}