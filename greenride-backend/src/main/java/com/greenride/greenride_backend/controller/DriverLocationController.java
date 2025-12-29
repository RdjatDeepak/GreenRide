package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.LocationUpdateDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;

@Controller
public class DriverLocationController {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/update-location")
    public void handleDriverUpdate(@Payload LocationUpdateDTO update){
        //Broadcast to AdminDashBoard
        // Subscription Topic :/topic/admin/fleet
        messagingTemplate.convertAndSend("/topic/admin/fleet", update);
        // 2. BROADCAST TO PASSENGERS
        // We filter the data to only show what the passenger needs: location and range.
        // Subscription topic: /topic/passenger/nearby
        Map<String , Object> passengerData = new HashMap<>();
        passengerData.put("vehicleId" , update.getVehicleId());
        passengerData.put("lat", update.getLat());
        passengerData.put("lng", update.getLng());
        passengerData.put("batteryLevel", update.getBatteryLevel());

        // Assume a basic range in % ==> 1 % = 4.5 km
         double estimatedRange = update.getBatteryLevel()*4.5;
         passengerData.put("remainingRange", estimatedRange);
         messagingTemplate.convertAndSend("/topic/passenger/nearby", passengerData);
    }
}
