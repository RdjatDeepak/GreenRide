package com.greenride.greenride_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalVehicles;
    private long activeTrips;
    private long vehiclesCharging;
    private long availableVehicles;
    private double totalFleetEarnings;
}