package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.NearbyVehicleDTO;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private UserRepository userRepository;

    public List<Vehicle> getAllVehiclesForAdmin() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
    }
    public List<NearbyVehicleDTO> findNearby(double userLat, double userLng, double radiusInKm) {
        List<Vehicle> allVehicles = vehicleRepository.findAll();

        return allVehicles.stream()
                // 1. Filter only Online and Available vehicles
                .filter(v -> v.isOnline() && v.isAvailable())
                .map(v -> {
                    double dist = calculateDistance(userLat, userLng, v.getLat(), v.getLng());

                    // 2. Check if within range
                    if (dist <= radiusInKm) {
                        NearbyVehicleDTO dto = new NearbyVehicleDTO();
                        dto.setVehicleId(v.getId());
                        dto.setModel(v.getMake() + " " + v.getModel());
                        dto.setLicensePlate(v.getLicensePlate());
                        dto.setBatteryLevel(v.getCurrentBatteryLevel());
                        dto.setLat(v.getLat());
                        dto.setLng(v.getLng());
                        dto.setDistance(Math.round(dist * 100.0) / 100.0); // Round to 2 decimals

                        // 3. Safely get the driver's name
                        if (v.getDriver() != null) {
                            dto.setDriverName(v.getDriver().getName());
                        } else {
                            dto.setDriverName("Eco-Driver"); // Fallback
                        }
                        return dto;
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(NearbyVehicleDTO::getDistance))
                .collect(Collectors.toList());
    }
    // Helper method using Haversine Formula
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371; // Kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }
    // vehicle details to the driver
    public Vehicle getVehicleByDriverEmail(String email) {
        // 1. Find the User first to get their ID
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // 2. Find the vehicle where driver_id matches
        return vehicleRepository.findByDriverId(driver.getId())
                .orElseThrow(() -> new RuntimeException("No vehicle assigned to this driver"));
    }
    //  this for the get available  vehicles to passenger
    public List<Vehicle> getAllAvailableVehicles() {
        return vehicleRepository.findAll().stream()
                .filter(v -> v.isOnline() && v.isAvailable())
                .collect(Collectors.toList());
    }
}