package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.DriverApplicationRequest;
import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.service.DriverService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/apply")
    public ResponseEntity<String> applyForDriver(@AuthenticationPrincipal UserDetails userDetails ,
                                                 @RequestBody DriverApplicationRequest request){
       // Find the user Entity based on the authenticated user's Email
       User user = userRepository.findByEmail(userDetails.getUsername())
               .orElseThrow(()-> new EntityNotFoundException("User not found."));
       driverService.applyToBecomeDriver(user ,request.getLicenseNumber() , request.getAadharNumber());
       return ResponseEntity.ok("Driver application submitted successfully!");
    }
    // Inside com.greenride.greenride_backend.controller.DriverController


    // this to get the status of the driver application
    @GetMapping("/apply/status")
    public ResponseEntity<?> getDriverApplicationStatus(@AuthenticationPrincipal UserDetails userDetails) {
        //Find the User Entity based on the authenticated user's Email
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found."));

        // Call the service layer to get the current application status
        //    We assume your DriverService has a method like this.
        DriverProfile profile = driverService.getDriverApplicationStatus(user);

        if (profile == null) {
            // The frontend can interpret status: "NOT_APPLIED" to show the application form.
            return ResponseEntity.ok(Map.of(
                    "status", "NOT_APPLIED",
                    "message", "Driver application not yet submitted."
            ));
        }
        // Return the necessary status details in the response
        //    This must match what your frontend's `setDriverRequestStatus` expects.

        return ResponseEntity.ok(Map.of(
                "status", profile.getVerificationStatus(),
                "licenseNumber", profile.getLicenseNumber()
        ));
    }
}
