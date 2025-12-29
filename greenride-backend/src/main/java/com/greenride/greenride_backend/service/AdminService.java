package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.AdminStatsDTO;
import com.greenride.greenride_backend.dto.PendingDriverDTO;
import com.greenride.greenride_backend.dto.VehicleDTO;
import com.greenride.greenride_backend.model.*;
import com.greenride.greenride_backend.repository.*;
import com.greenride.greenride_backend.repository.TripRepository; // New Import
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private DriverProfileRepository driverProfileRepository;
    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private TripRepository tripRepository; // New Inject

    /**
     * Aggregates live fleet statistics for the Admin Dashboard Header.
     */
    public AdminStatsDTO getFleetSummary() {
        long totalVehicles = vehicleRepository.count();

        // Count trips currently happening
        long activeTrips = tripRepository.countByStatus("IN_PROGRESS");

        // Count vehicles currently plugged in/charging
        long vehiclesCharging = vehicleRepository.countByIsCharging(true);

        // Count vehicles online and ready for a ride
        long availableVehicles = vehicleRepository.countByIsOnlineAndStatus(true, "Online");

        // Total earnings from all successful trips
        Double earnings = tripRepository.sumTotalEarnings();
        double totalFleetEarnings = (earnings != null) ? earnings : 0.0;

        return new AdminStatsDTO(
                totalVehicles,
                activeTrips,
                vehiclesCharging,
                availableVehicles,
                totalFleetEarnings
        );
    }

    // --- YOUR EXISTING METHODS (KEEPING AS IS) ---

    public List<User> getAllApprovedDrivers() {
        Role driverRole = roleRepository.findByName(ERole.ROLE_DRIVER).orElse(null);
        if (driverRole == null) return Collections.emptyList();
        return userRepository.findAllByRolesContaining(driverRole);
    }

    public DriverProfile approveDriver(Long userID) {
        DriverProfile driverProfile = driverProfileRepository.findByUserId(userID)
                .orElseThrow(() -> new EntityNotFoundException("Driver profile not found: " + userID));

        if (driverProfile.getVerificationStatus() == DriverVerificationStatus.VERIFIED) {
            return driverProfile;
        }

        driverProfile.setVerificationStatus(DriverVerificationStatus.VERIFIED);
        User user = driverProfile.getUser();
        Role driverRole = roleRepository.findByName(ERole.ROLE_DRIVER)
                .orElseThrow(() -> new EntityNotFoundException("Driver role not found"));
        user.getRoles().add(driverRole);
        userRepository.save(user);
        return driverProfileRepository.save(driverProfile);
    }

    public List<PendingDriverDTO> getPendingDriverApplications() {
        List<DriverProfile> pendingProfiles = driverProfileRepository.findByVerificationStatus(DriverVerificationStatus.PENDING);
        return pendingProfiles.stream()
                .map(profile -> {
        PendingDriverDTO dto = new PendingDriverDTO();
        User user = profile.getUser();
        dto.setUserId(user.getId());
        dto.setUserName(user.getName());
        dto.setUserEmail(user.getEmail());
        dto.setLicenseNumber(profile.getLicenseNumber());
        dto.setAadharNumber(profile.getAadharNumber());
        dto.setVerificationStatus(profile.getVerificationStatus().name());
        return dto;
    }).collect(Collectors.toList());
}

    public List<VehicleDTO> getAllVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return vehicles.stream()
                .map(vehicle -> {
                    VehicleDTO dto = new VehicleDTO();
                    dto.setId(vehicle.getId());
                    dto.setMake(vehicle.getMake());
                    dto.setModel(vehicle.getModel());
                    dto.setLicensePlate(vehicle.getLicensePlate());

                    // Map the Battery and Status
                    dto.setCurrentBatteryLevel((int) vehicle.getCurrentBatteryLevel());
                    dto.setStatus(vehicle.getStatus()); // Crucial for "Status" column

                    // Map Coordinates
                    dto.setLat(vehicle.getLat());
                    dto.setLng(vehicle.getLng());

                    dto.setAvailable(vehicle.isAvailable());

                    // Map Driver details
                    if (vehicle.getDriver() != null) {
                        dto.setDriverId(vehicle.getDriver().getId());
                        dto.setDriverName(vehicle.getDriver().getName());
                    } else {
                        dto.setDriverName("Unassigned");
                    }

                    return dto;
                }).collect(Collectors.toList());
    }

    public Vehicle addVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(Long vehicleId) {
        vehicleRepository.deleteById(vehicleId);
    }

    public Vehicle assignVehicleToDriver(Long vehicleId, Long driverId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));
        if (driverId == null || driverId == 0) {
            vehicle.setDriver(null);
            vehicle.setAvailable(false); // Can't have a ride without a driver
            return vehicleRepository.save(vehicle);
        }
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new EntityNotFoundException("Driver not Found."));

        boolean isDriver = driver.getRoles().stream()
                .anyMatch(role -> role.getName().equals(ERole.ROLE_DRIVER));
        if (!isDriver) {
            throw new IllegalArgumentException("User is not a Verified Driver");
        }

        vehicle.setDriver(driver);
        vehicle.setAvailable(true);
        return vehicleRepository.save(vehicle);
    }
}