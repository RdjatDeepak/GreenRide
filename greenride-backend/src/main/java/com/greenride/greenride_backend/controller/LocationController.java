package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.LocationUpdateDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class LocationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * DRIVER SENDS LOCATION TO SERVER
     * Maps to: /app/update-location
     * Driver sends: { "carId": 1, "lat": 28.1234, "lng": 77.5678 } << NCR
     */
    @MessageMapping("/update-location")
    public void receiveLocation(@Payload LocationUpdateDTO update) {
        // Business Logic: You would typically validate the carId and update the DB here.
        // For now, we immediately broadcast it.

        // Destination: /topic/tracking/{carId}
        // Only passengers subscribed to that specific carId topic will receive the update.
        String destination = "/topic/tracking/" + update.getVehicleId();

        messagingTemplate.convertAndSend(destination, update);
    }
}
