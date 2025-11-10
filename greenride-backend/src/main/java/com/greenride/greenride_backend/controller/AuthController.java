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

        // Check for existing email (Business Logic Validation)
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            // Return 400 Bad Request if email exists, with a clear message map
            return ResponseEntity.badRequest().body(Map.of("message", "Error: Email is already in use!"));
        }

        // Create and save the new user (UserService handles hashing and role assignment)
        User newUser = new User(request.getName(), request.getEmail(), request.getPassword());
        User createdUser = userService.registerNewUser(newUser);

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


            return ResponseEntity.ok(Map.of(
                    "message", "Login successful.",
                    "email", userDetails.getUsername(),
                    "roles", userDetails.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority).collect(Collectors.toList()),
                    "accessToken", jwt
            ));

        } catch (Exception e) {
            // Print the full stack trace to see the REAL error
            e.printStackTrace();

            // Check if the exception is a specific Spring one (like BadCredentialsException)
            if (e instanceof org.springframework.security.core.AuthenticationException) {
                // If it's a security exception, it means the password failed verification,
                // but based on logs, this is unlikely.
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        Map.of("message", "Invalid email or password.") // Your existing message
                );
            }

            // If it's any other exception (like a NullPointerException from JwtUtils),
            // return a generic error or the actual exception message.
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("message", "Token generation failed: " + e.getMessage())
            );
        }
    }

}