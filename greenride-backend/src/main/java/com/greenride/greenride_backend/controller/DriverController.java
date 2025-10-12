package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.DriverApplicationRequest;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.service.DriverService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
