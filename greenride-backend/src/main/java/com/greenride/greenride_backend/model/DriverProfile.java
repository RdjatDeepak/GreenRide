package com.greenride.greenride_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "driver_profiles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DriverProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    @JsonIgnore
    private User user;

    private String licenseNumber;
    private String aadharNumber;

    @Enumerated(EnumType.STRING)
    private DriverVerificationStatus verificationStatus;

    // --- NEW STATUS & TRACKING FIELDS ---
    private boolean isOnline;
    private LocalDateTime lastOnlineTime; // To calculate active hours

    // --- EARNINGS & PERFORMANCE ---
    private double dailyEarnings;
    private double monthlyEarnings;
    private double totalEarnings;
    private double activeHoursToday;

    // --- LIVE TRIP DATA ---
    private Long currentTripId; // Null if no active ride
    private String currentDestination;
}