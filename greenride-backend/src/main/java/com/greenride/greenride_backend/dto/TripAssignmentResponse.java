package com.greenride.greenride_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripAssignmentResponse {
    private Long tripId; // ID of the newly created trip record
    private Long assignedVehicleId; // ID of the EV assigned (for WebSocket subscription)
    private String driverName;
    private String vehicleModel;

    // The fixed dropoff location (for the map component to plot the destination marker)
    private double dropoffLat;
    private double dropoffLng;

    private int estimatedFare; // Example fare
    private String estimatedArrivalTime; // Example time
}