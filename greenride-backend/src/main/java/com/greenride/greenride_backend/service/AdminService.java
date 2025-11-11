package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.PendingDriverDTO;
import com.greenride.greenride_backend.dto.VehicleDTO;
import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.DriverVerificationStatus;
import com.greenride.greenride_backend.model.ERole;
import com.greenride.greenride_backend.model.Role;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.repository.RoleRepository;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.repository.DriverProfileRepository;
import com.greenride.greenride_backend.repository.VehicleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityNotFoundException;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
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

    public List<User> getAllApprovedDrivers(){
        final String Driver_ROLE_STRING = ERole.ROLE_DRIVER.name();
        Role driverRole = roleRepository.findByName(ERole.valueOf(Driver_ROLE_STRING)).orElse(null);

        if(driverRole == null){
            return Collections.emptyList();
        }
        return userRepository.findAllByRolesContaining(driverRole);
    }
    //approval for driver verification status
    public DriverProfile approveDriver(Long userID){
        DriverProfile driverProfile = driverProfileRepository.findByUserId(userID)
                .orElseThrow(()-> new EntityNotFoundException("Driver profile not found for user ID:"+ userID));
        if(driverProfile.getVerificationStatus() == DriverVerificationStatus.VERIFIED){
            return  driverProfile; // Return the profile if it is verified
        }
        //update the status of user as Driver if it right details
        driverProfile.setVerificationStatus(DriverVerificationStatus.VERIFIED);
        User user =driverProfile.getUser();
        Role driverRole = roleRepository.findByName(ERole.ROLE_DRIVER)
                .orElseThrow(()-> new EntityNotFoundException("Driver role not found"));
        user.getRoles().add(driverRole);
        userRepository.save(user);
        return driverProfileRepository.save(driverProfile);
    }
    // this for get pending applicationss
    public List<PendingDriverDTO> getPendingDriverApplications(){
        //get the list of all Driver Applications
        List<DriverProfile> pendingProfiles = driverProfileRepository.findByVerificationStatus(DriverVerificationStatus.PENDING);
        return pendingProfiles.stream()
                .map(profile -> {
                    PendingDriverDTO dto = new PendingDriverDTO();
                    User user = profile.getUser();
                    dto.setUserId(user.getId()); //<-- ID of the User_Id table primary key
                    dto.setUserName(user.getName());
                    dto.setUserEmail(user.getEmail());

                    dto.setLicenseNumber(profile.getLicenseNumber());
                    dto.setAadharNumber(profile.getAadharNumber());
                    dto.setVerificationStatus(profile.getVerificationStatus().name());
                    return dto;
                })
                .collect(Collectors.toList());
    }
    public List<VehicleDTO> getAllVehicles(){ // <-- Change return type!
        List<Vehicle> vehicles = vehicleRepository.findAll();

        // Map the entities to DTOs
        return vehicles.stream()
                .map(vehicle -> {
                    VehicleDTO dto = new VehicleDTO();
                    dto.setId(vehicle.getId());
                    dto.setMake(vehicle.getMake());
                    dto.setModel(vehicle.getModel());
                    dto.setLicensePlate(vehicle.getLicensePlate());
                    dto.setCurrentBatteryLevel((int) vehicle.getCurrentBatteryLevel());
                    dto.setAvailable(vehicle.isAvailable());

                    // CRITICAL MAPPING: Safely handle the driver relationship
                    if (vehicle.getDriver() != null) {
                        dto.setDriverId(vehicle.getDriver().getId());
                        dto.setDriverName(vehicle.getDriver().getName());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
    public Vehicle addVehicle(Vehicle vehicle){
        return  vehicleRepository.save(vehicle);
    }
    public void deleteVehicle(Long vehicleId){
        vehicleRepository.deleteById(vehicleId);
    }

    public Vehicle assignVehicleToDriver(Long vehicleId , Long driverId){
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(()-> new EntityNotFoundException("Vehicle not found"));
        User driver = userRepository.findById(driverId)
                .orElseThrow(()-> new EntityNotFoundException("Driver not Found."));
        // before assigning ensure that the user have the driver role
        boolean isDriver = driver.getRoles().stream()
                .anyMatch(role -> role.getName().equals(ERole.ROLE_DRIVER));
        if(!isDriver){
            throw  new IllegalArgumentException("User is not a Verified Driver");
        }
        // check for existing assignment
//        Optional<Vehicle> existingAssignment = vehicleRepository.findByDriverId(driverId);
////
//        if (existingAssignment.isPresent()) {
////            // If the driver is assigned, prevent the assignment
//            Vehicle currentlyAssignedVehicle = existingAssignment.get();
////
////            // If they are already assigned to THIS vehicle, we can safely return or update status
//            if(currentlyAssignedVehicle.getId().equals(vehicleId)) {
////                // Already assigned to this vehicle, just ensure availability is false
//                vehicle.setAvailable(false);
//                return vehicleRepository.save(vehicle);
//            }
//            throw new IllegalArgumentException("Driver ID " + driverId + " is already assigned to Vehicle ID " + currentlyAssignedVehicle.getId() + ".");
//        }
        vehicle.setDriver(driver);
        vehicle.setAvailable(true);
        return vehicleRepository.save(vehicle);
    }
}
