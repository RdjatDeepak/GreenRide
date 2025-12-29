package com.greenride.greenride_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "vehicles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class Vehicle {
    @Id@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String make;
    private String model;

    @Column(unique = true , nullable = false)
    private  String licensePlate;
    @JsonProperty("batteryLevel")
    @Column(name = "current_battery_level")
    private double currentBatteryLevel;
    @JsonProperty("isAvailable")
    private  boolean isAvailable;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id" , nullable = true)
    private User driver;
    @JsonProperty("latitude")
    private double lat;
    @JsonProperty("longitude")
    private double lng;
    private boolean isCharging;
    private boolean isOnline;
    @JsonProperty("status")
    private String status; // e.g., "ACTIVE", "INACTIVE", "MAINTENANCE"

    private double batteryCapacity;
}
