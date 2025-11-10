package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.DriverVerificationStatus;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.repository.DriverProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
@Service
public class DriverService {
    @Autowired
    private DriverProfileRepository driverProfileRepository;

    public Optional<DriverProfile>applyToBecomeDriver(User user , String licenseNumber , String aadharNumber){
        Optional<DriverProfile> existingApplication= driverProfileRepository.findByUserId(user.getId());
        if(existingApplication.isPresent()){
            return Optional.empty();
        }
        DriverProfile driverProfile = new DriverProfile();
        driverProfile.setUser(user);
        driverProfile.setLicenseNumber(licenseNumber);
        driverProfile.setAadharNumber(aadharNumber);
        driverProfile.setVerificationStatus(DriverVerificationStatus.PENDING);
        return Optional.of(driverProfileRepository.save(driverProfile));
    }
    public DriverProfile getDriverApplicationStatus(User user) {
        // Reuse the existing repository method to find the profile by User ID.
        return driverProfileRepository.findByUserId(user.getId())
                .orElse(null); // earlier I was throwing () -> new EntityNotFoundException("Driver application profile not found for user ID: " + user.getId())
    }
}
