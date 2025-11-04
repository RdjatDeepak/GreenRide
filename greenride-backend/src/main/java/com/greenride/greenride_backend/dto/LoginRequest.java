package com.greenride.greenride_backend.dto;

// Note: Validation constraints are often omitted for LoginRequest in simple APIs,
// but can be added if specific format checks are needed before authentication.

public class LoginRequest {
    private String email;
    private String password;

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}