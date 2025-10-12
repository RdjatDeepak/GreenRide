package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;
    //approve driver applications
    @PostMapping("/approve-driver/{userId}")
    public ResponseEntity<DriverProfile> approveDriver(@PathVariable Long userId){
        DriverProfile approvedDriver = adminService.approveDriver(userId);
        return  ResponseEntity.ok(approvedDriver);
    }
    //get all pending driver applications for review
    @GetMapping("/pending-drivers")
    public ResponseEntity<List<DriverProfile>> getPendingDriverApplication(){
        List<DriverProfile>pendingDrivers = adminService.getPendingDriverApplications();
        return ResponseEntity.ok(pendingDrivers);
    }

    //add new Vehicle to flee
    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> addVehicle (@RequestBody Vehicle vehicle){
        Vehicle newVehicle = adminService.addVehicle(vehicle);
        return ResponseEntity.ok(newVehicle);
    }

    //Get list of all vehicle
    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getAllVehicles(){
        List<Vehicle> vehicles= adminService.getAllVehicles();
        return ResponseEntity.ok(vehicles);
    }

    //Delete vehicle from fleet
    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void>deleteVehicle(@PathVariable Long id){
        adminService.deleteVehicle(id);
        return ResponseEntity.ok().build();
    }

    //Assign a vehicle to verified driver
    @PutMapping("/vehicle/assign/{vehicleId}/{driverId}")
    public ResponseEntity<Vehicle> assignVehicleToDriver(@PathVariable Long vehicleId , @PathVariable Long driverId){
        Vehicle assignedVehicle = adminService.assignVehicleToDriver(vehicleId , driverId);
        return  ResponseEntity.ok(assignedVehicle);
    }
}
