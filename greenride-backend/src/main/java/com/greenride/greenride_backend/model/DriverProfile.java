package com.greenride.greenride_backend.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import  jakarta.persistence.*;
@Entity
@Table(name = "driver_profiles")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DriverProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id" , unique = true , nullable = false)
    @JsonIgnore
    private  User user;

    private String licenseNumber;
    private String aadharNumber;
    @Enumerated(EnumType.STRING)
    private DriverVerificationStatus verificationStatus;

    public Long getId() { return id;}

    public void setId(Long id) { this.id = id;}

    public String getLicenseNumber() { return licenseNumber;}

    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber;}

    public User getUser() { return user; }

    public void setUser(User user) { this.user = user;}

    public String getAadharNumber() {return aadharNumber;}

    public void setAadharNumber(String aadharNumber) {this.aadharNumber = aadharNumber;}

    public DriverVerificationStatus getVerificationStatus() { return verificationStatus; }

    public void setVerificationStatus(DriverVerificationStatus verificationStatus) { this.verificationStatus = verificationStatus;}
}
