package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.TripRequestDTO;
import com.greenride.greenride_backend.dto.TripAssignmentResponse;
import com.greenride.greenride_backend.model.Trip;
import com.greenride.greenride_backend.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    @Autowired
    private TripService tripService;

    /**
     * Endpoint for a passenger to request a ride.
     * Logic: Now uses TripService to calculate ML route and assign the real vehicle.
     */
    @PostMapping("/request")
    public ResponseEntity<TripAssignmentResponse> requestTrip(@RequestBody TripRequestDTO request) {
        // This now performs real ML prediction, saves to DB, and gets real vehicle details
        TripAssignmentResponse response = tripService.processTripRequest(request);
        return ResponseEntity.ok(response);
    }
    //for history
    @GetMapping("/history")
    public ResponseEntity<List<Trip>> getTripHistory(Principal principal) {
        // 'principal.getName()' gets the email of the logged-in user (passenger)
        String userName = principal.getName();
        List<Trip> history = tripService.getTripsByUserId(userName);
        return ResponseEntity.ok(history);
    }
    /**
     * Endpoint for the Driver to end the trip.
     * Triggers: Fare calculation, Driver earnings update, and Vehicle availability.
     */
    @PostMapping("/complete/{tripId}")
    public ResponseEntity<String> completeTrip(@PathVariable Long tripId) {
        tripService.completeTrip(tripId);
        return ResponseEntity.ok("Trip completed successfully. Driver earnings updated.");
    }
}