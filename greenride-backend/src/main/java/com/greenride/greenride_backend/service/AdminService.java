package com.greenride.greenride_backend.service;

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
import java.util.List;
import java.util.Optional;
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
    public List<DriverProfile> getPendingDriverApplications(){
        return driverProfileRepository.findByVerificationStatus(DriverVerificationStatus.PENDING);
    }
    public List<Vehicle> getAllVehicles(){
        return  vehicleRepository.findAll();
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
        vehicle.setDriver(driver);
        vehicle.setAvailable(true);
        return vehicleRepository.save(vehicle);
    }
}
