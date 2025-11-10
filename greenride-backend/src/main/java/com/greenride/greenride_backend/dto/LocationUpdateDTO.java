package com.greenride.greenride_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationUpdateDTO {
    private Long vehicleId;
    private double lat;
    private double lng;
}
