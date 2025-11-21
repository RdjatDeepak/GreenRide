package com.greenride.greenride_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationUpdateDTO {
    private Long vehicleId;
    Long driverId;
    int batteryLevel;
    private double lat;
    private double lng;
}
