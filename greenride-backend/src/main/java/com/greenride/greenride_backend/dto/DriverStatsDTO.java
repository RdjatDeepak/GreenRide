package com.greenride.greenride_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DriverStatsDTO {
    private double dailyEarnings;
    private double monthlyEarnings;
    private double activeHoursToday;
    private int completedTrips;
}