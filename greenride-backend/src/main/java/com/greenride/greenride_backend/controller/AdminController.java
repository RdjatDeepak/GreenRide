package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.AdminStatsDTO;
import com.greenride.greenride_backend.dto.PendingDriverDTO;
import com.greenride.greenride_backend.dto.VehicleDTO;
import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
// Roles are typically handled in SecurityConfig, but you can add @PreAuthorize here if needed
public class AdminController {

    @Autowired
    private AdminService adminService;

    /**
     * NEW: Fleet Summary Statistics
     * Returns: Total EVs, Active Rides, Charging Status, and Total Fleet Earnings.
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getFleetStats() {
        return ResponseEntity.ok(adminService.getFleetSummary());
    }

    /**
     * Drivers Management
     */
    @GetMapping("/drivers")
    public ResponseEntity<List<User>> getAllApprovedDrivers() {
        return ResponseEntity.ok(adminService.getAllApprovedDrivers());
    }
//@GetMapping("/driver-requests")
    @GetMapping("/pending-drivers")
    public ResponseEntity<List<PendingDriverDTO>> getPendingDriverApplications() {
        return ResponseEntity.ok(adminService.getPendingDriverApplications());
    }

    @PostMapping("/approve-driver/{userId}")
    public ResponseEntity<DriverProfile> approveDriver(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.approveDriver(userId));
    }

    /**
     * Vehicle Fleet Management
     */
    @GetMapping("/vehicles")
    public ResponseEntity<List<VehicleDTO>> getAllVehicles() {
        return ResponseEntity.ok(adminService.getAllVehicles());
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> addVehicle(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(adminService.addVehicle(vehicle));
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        adminService.deleteVehicle(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/vehicle/assign/{vehicleId}/{driverId}")
    public ResponseEntity<Vehicle> assignVehicleToDriver(
            @PathVariable("vehicleId") Long vehicleId,
            @PathVariable("driverId") Long driverId){
        Long finalDriverId = (driverId == 0) ? null : driverId;
        return ResponseEntity.ok(adminService.assignVehicleToDriver(vehicleId, driverId));
    }
}