package com.greenride.greenride_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter // <-- Lombok generates getter
@Setter //Setters
public class DriverApplicationRequest {

    @NotBlank(message = "License number is required.")
    private String licenseNumber;

    @NotBlank(message = "Aadhar number is required.")
    @Pattern(regexp = "^[2-9]{1}[0-9]{3}[0-9]{4}[0-9]{4}$", message = "Aadhar number must be 12 digits.")
    private String aadharNumber;
}