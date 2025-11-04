package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.UserRegistrationRequest;
import com.greenride.greenride_backend.dto.LoginRequest;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.security.JwtUtils;
import com.greenride.greenride_backend.service.UserService;

// Spring Imports
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Validation Imports (You need these for @Valid)
import jakarta.validation.Valid;

import java.util.Map;
import java.util.Optional; // Use Optional for clean handling
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;
//      Handles new user registration.
//      Maps to: POST /api/auth/register

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserRegistrationRequest request) {

        // 1. Check for existing email (Business Logic Validation)
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            // Return 400 Bad Request if email exists, with a clear message map
            return ResponseEntity.badRequest().body(Map.of("message", "Error: Email is already in use!"));
        }

        // 2. Create and save the new user (UserService handles hashing and role assignment)
        User newUser = new User(request.getName(), request.getEmail(), request.getPassword());
        User createdUser = userService.registerNewUser(newUser);

        // 3. Return 201 Created with clean user data (REST standard)
        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "id", createdUser.getId(),
                        "email", createdUser.getEmail(),
                        "name", createdUser.getName(),
                        "message", "Registration successful."
                )
        );
    }
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> authenticateUser(@RequestBody LoginRequest loginRequest) {

        try {
            // Attempt to authenticate the user using Spring Security

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // generate the Jwt Tokens
            String jwt = jwtUtils.generateJwtToken(authentication);

            //  Prepare the successful response
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // *** FUTURE STEP: JWT generation will replace this simple response ***
            return ResponseEntity.ok(Map.of(
                    "message", "Login successful.",
                    "email", userDetails.getUsername(),
                    "roles", userDetails.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority).collect(Collectors.toList()),
                    "accessToken", jwt
            ));

        } catch (Exception e) {
            // Handle failed authentication (e.g., bad credentials)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "Invalid email or password.")
            );
        }
    }

}