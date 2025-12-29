package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.DriverApplicationRequest;
import com.greenride.greenride_backend.dto.DriverStatsDTO; // Create this DTO
import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.Trip;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.service.DriverService;
import com.greenride.greenride_backend.service.TripService;
import com.greenride.greenride_backend.service.VehicleService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private TripService tripService;
    /**
     * TOGGLE ONLINE/OFFLINE STATUS
     * Updates isOnline and tracks session start/end times.
     */
    @PutMapping("/status/toggle")
    public ResponseEntity<DriverProfile> toggleOnlineStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam boolean online) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        return ResponseEntity.ok(driverService.toggleOnlineStatus(user, online));
    }

    /**
     * GET DRIVER DASHBOARD STATS
     * Returns Daily Earnings, Monthly Earnings, and Active Hours.
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DriverStatsDTO> getDriverStats(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        return ResponseEntity.ok(driverService.getDriverStats(user));
    }

    /**
     * GET RECENT RIDES
     * Fetches trip history for the specific driver.
     */
    @GetMapping("/rides/history")
    public ResponseEntity<?> getRideHistory(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        return ResponseEntity.ok(driverService.getRideHistory(user));
    }

    // --- YOUR EXISTING METHODS ---

    @PostMapping("/apply")
    public ResponseEntity<String> applyForDriver(@AuthenticationPrincipal UserDetails userDetails,
                                                 @RequestBody DriverApplicationRequest request) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));
        driverService.applyToBecomeDriver(user, request.getLicenseNumber(), request.getAadharNumber());
        return ResponseEntity.ok("Driver application submitted successfully!");
    }

    @GetMapping("/apply/status")
    public ResponseEntity<?> getDriverApplicationStatus(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        DriverProfile profile = driverService.getDriverApplicationStatus(user);

        if (profile == null) {
            return ResponseEntity.ok(Map.of("status", "NOT_APPLIED"));
        }

        return ResponseEntity.ok(Map.of(
                "status", profile.getVerificationStatus(),
                "isOnline", profile.isOnline(),
                "dailyEarnings", profile.getDailyEarnings()
        ));
    }
    // see the details of the vehicle which is to the driver
    @GetMapping("/my-vehicle")
    public ResponseEntity<Vehicle> getAssignedVehicle(Principal principal) {
        // 1. Get Driver email from login
        String email = principal.getName();

        // 2. Logic to find vehicle where vehicle.driverId matches this user's ID
        Vehicle vehicle = vehicleService.getVehicleByDriverEmail(email);
        return ResponseEntity.ok(vehicle);
    }
    // trip details and the optimized route can be seen to the driver
    @GetMapping("/active-route")
    public ResponseEntity<Trip> getActiveTrip(Principal principal) {
        // This returns the trip containing the 'polyline' and 'predictedEndSOC'
        Trip activeTrip = tripService.getActiveTripForDriver(principal.getName());
        return ResponseEntity.ok(activeTrip);
    }
}