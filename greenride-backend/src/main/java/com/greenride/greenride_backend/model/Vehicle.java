package com.greenride.greenride_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String make;
    private String model;

    @Column(unique = true , nullable = false)
    private  String licensePlate;
    private double currentBatteryLevel;
    private  boolean isAvailable;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    public Long getId() {
        return id;
    }

    public String getMake() {
        return make;
    }

    public double getCurrentBatteryLevel() {
        return currentBatteryLevel;
    }

    public User getDriver() {
        return driver;
    }

    public void setDriver(User driver) {
        this.driver = driver;
    }

    public boolean isAvailable() {
        return isAvailable;
    }

    public void setAvailable(boolean available) {
        isAvailable = available;
    }

    public void setCurrentBatteryLevel(double currentBatteryLevel) {
        this.currentBatteryLevel = currentBatteryLevel;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
