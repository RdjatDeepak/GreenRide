package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.model.Trip;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.service.TripService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripService tripService;

    // 1. GET User Profile
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return ResponseEntity.ok(user);
    }

    // 2. UPDATE User Profile (e.g., Phone number)
    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                              @RequestBody User updatedData) {
        // 1. Find the existing user from the database
        User existingUser = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // 2. Update only specific fields (Don't just overwrite the whole object!)
        existingUser.setName(updatedData.getName());
//        existingUser.setPhoneNumber(updatedData.getPhoneNumber());
        // Add other fields you want to allow users to change...

        // 3. Save the updated entity back to the database
        User savedUser = userRepository.save(existingUser);

        // 4. Return the saved object
        return ResponseEntity.ok(savedUser);
    }

    // 3. User-Specific Trip History (Moved from TripController if you prefer)
    @GetMapping("/trips")
    public ResponseEntity<List<Trip>> getMyTrips(Principal principal) {
        return ResponseEntity.ok(tripService.getTripsByUserId(principal.getName()));
    }
}