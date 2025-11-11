package com.greenride.greenride_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PendingDriverDTO {
    // This is the ID the frontend MUST use for approval/rejection.
    private Long userId;
    // Add other details needed for the admin to review
    private String userName;
    private String userEmail;
    private String licenseNumber;
    private String aadharNumber;
    private String verificationStatus;
}
