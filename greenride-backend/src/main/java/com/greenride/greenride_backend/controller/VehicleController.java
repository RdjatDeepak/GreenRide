package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.NearbyVehicleDTO;
import com.greenride.greenride_backend.model.Vehicle; // Ensure this matches your package
import com.greenride.greenride_backend.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    /**
     * Fetches all vehicles with full details for the Admin Dashboard.
     * Includes battery, status, location, and total KM.
     */
    @GetMapping
    public ResponseEntity<List<Vehicle>> getPublicVehicles() {
        // This handles GET /api/vehicles
        // It should return only vehicles that are AVAILABLE and ONLINE
        return ResponseEntity.ok(vehicleService.getAllAvailableVehicles());
    }
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehiclesForAdmin());
    }
    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyVehicleDTO>> getNearbyVehicles(
            @RequestParam("latitude") double lat,
            @RequestParam("longitude") double lng) {
        // Logic to find vehicles within e.g., 5km
        List<NearbyVehicleDTO> nearby = vehicleService.findNearby(lat, lng, 5.0);
        return ResponseEntity.ok(nearby);
    }
    /**
     * Fetches a single vehicle's full history and health stats.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleDetails(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }
}