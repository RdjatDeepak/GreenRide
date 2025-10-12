package com.greenride.greenride_backend.dto;

public class DriverApplicationRequest {
    private String licenseNumber;
    private String aadharNumber;
    public String getLicenseNumber(){
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }

    public String getAadharNumber() {
        return aadharNumber;
    }

    public void setAadharNumber(String aadharNumber) {
        this.aadharNumber = aadharNumber;
    }
}
