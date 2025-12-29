package com.greenride.greenride_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.context.annotation.Primary;

import java.time.LocalDateTime;

@Entity
@Table(name= "trips")
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //passenger And Vehicle
    private Long passengerId;
    private Long vehicleId;

    //Location
    private double startLat;
    private double startLng;
    private double endLat;
    private double endLng;

    //ML & Route Data
    @Column(columnDefinition = "Text")
    private String polyline; // the actual path draw on frontEnd (React)
    private double predictedEndSOC;
    private boolean chargingStopRequired;
    private String chargingStationLocation;

    //Status : Required , IN_Progress , Completed , Cancelled
    private String status;
    private LocalDateTime startTime;
    // end time of trip
    private LocalDateTime EndTime ;

    private double fare;
}
