package com.greenride.greenride_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripRequestDTO {
    // Current location of the passenger (for dispatch logic)
    private double pickupLat;
    private double pickupLng;

    // The final destination
    private double dropoffLat;
    private double dropoffLng;

    // The type of EV requested (if applicable, e.g., 'SUV', 'Sedan')
    private String vehicleType;
    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId; // the ID of car user clicked
    private Long passengerId;
}