package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.DriverStatsDTO;
import com.greenride.greenride_backend.model.*;
import com.greenride.greenride_backend.repository.DriverProfileRepository;
import com.greenride.greenride_backend.repository.TripRepository;
import com.greenride.greenride_backend.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DriverService {

    @Autowired
    private DriverProfileRepository driverProfileRepository;

    @Autowired
    private TripRepository tripRepository;
    @Autowired
    private VehicleRepository vehicleRepository;

    /**
     * Toggles the driver's online status.
     * If going offline, it calculates the session duration and updates active hours.
     */
    public DriverProfile toggleOnlineStatus(User user, boolean online) {
        DriverProfile profile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));

        if (profile.isOnline() && !online) {
            // Driver is going OFFLINE: Calculate the time spent online
            if (profile.getLastOnlineTime() != null) {
                long minutes = Duration.between(profile.getLastOnlineTime(), LocalDateTime.now()).toMinutes();
                double hours = minutes / 60.0;
                profile.setActiveHoursToday(profile.getActiveHoursToday() + hours);
            }
        } else if (online) {
            // Driver is going ONLINE: Mark the start time
            profile.setLastOnlineTime(LocalDateTime.now());
        }

        profile.setOnline(online);
        return driverProfileRepository.save(profile);
    }
    /**
     * Retrieves aggregated statistics for the Driver's dashboard.
     */
    public DriverStatsDTO getDriverStats(User user) {
        DriverProfile profile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));

        // 1. Find the vehicle assigned to this driver to get the correct ID
        Vehicle vehicle = vehicleRepository.findByDriverId(user.getId())
                .orElseThrow(() -> new RuntimeException("No vehicle assigned to this driver"));

        // 2. Fetch the count using the new "findAllBy" method
        List<Trip> completedTrips = tripRepository.findAllByVehicleIdAndStatus(vehicle.getId(), "COMPLETED");

        return new DriverStatsDTO(
                profile.getDailyEarnings(),
                profile.getMonthlyEarnings(),
                profile.getActiveHoursToday(),
                completedTrips.size()
        );
    }

    /**
     * Fetches the history of completed rides for the driver.
     */
    public List<Trip> getRideHistory(User user) {
        // Find the vehicle first
        Vehicle vehicle = vehicleRepository.findByDriverId(user.getId())
                .orElseThrow(() -> new RuntimeException("No vehicle assigned to this driver"));

        // Use the List version of the repository method
        return tripRepository.findAllByVehicleIdAndStatus(vehicle.getId(), "COMPLETED");
    }
    // --- YOUR EXISTING METHODS ---

    public Optional<DriverProfile> applyToBecomeDriver(User user, String licenseNumber, String aadharNumber) {
        Optional<DriverProfile> existingApplication = driverProfileRepository.findByUserId(user.getId());
        if (existingApplication.isPresent()) {
            return Optional.empty();
        }
        DriverProfile driverProfile = new DriverProfile();
        driverProfile.setUser(user);
        driverProfile.setLicenseNumber(licenseNumber);
        driverProfile.setAadharNumber(aadharNumber);
        driverProfile.setVerificationStatus(DriverVerificationStatus.PENDING);
        driverProfile.setOnline(false); // Default to offline
        return Optional.of(driverProfileRepository.save(driverProfile));
    }

    public DriverProfile getDriverApplicationStatus(User user) {
        return driverProfileRepository.findByUserId(user.getId()).orElse(null);
    }
}