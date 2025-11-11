package com.greenride.greenride_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter //<-lombok
public class VehicleDTO {
    private Long id;
    private String make;
    private String model;
    private String licensePlate;
    private int currentBatteryLevel;
    private boolean available;

    //for driver while sending whole user object create Lazy Loading and JSON Serialization
    private Long driverId;
    private String driverName;
}
