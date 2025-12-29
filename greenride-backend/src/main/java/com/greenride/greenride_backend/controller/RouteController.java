package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.RangePredictionDTO;
import com.greenride.greenride_backend.dto.RouteRequestDto;
import com.greenride.greenride_backend.dto.RouteResponseDTO;
import com.greenride.greenride_backend.exception.ResourceNotFoundException;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.repository.VehicleRepository;
import com.greenride.greenride_backend.service.MLService;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/route")
public class RouteController {

    @Autowired
    private MLService mlService;

    @Autowired
    private VehicleRepository vehicleRepository;
    private static final Logger logger = (Logger) LoggerFactory.getLogger(RouteController.class);
    @PostMapping("/calculate-optimize")
    public ResponseEntity<RouteResponseDTO> getOptimizedRoute(@RequestBody RouteRequestDto request) {

       if (request.getVehicleId() == null || request.getVehicleId() == 0) {
        // You might need to change return type to ResponseEntity<?> to send this error
        throw new IllegalArgumentException("Vehicle ID is missing in the request");
    }
        // 1. Get real-time car data from Database
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        // 2. Sync the request with actual car battery levels
        request.setCurrentBatterySOC(vehicle.getCurrentBatteryLevel());
        request.setBatteryCapacity(vehicle.getBatteryCapacity());

        // 3. Call ML Service (Python)
        RangePredictionDTO prediction = mlService.getOptimizedRange(request);

        // 4. Build Response
        RouteResponseDTO response = new RouteResponseDTO();
        Double mlFinalSoc = (prediction != null) ? prediction.getFinalSOC() : null;
        if (mlFinalSoc != null && mlFinalSoc != null) {
            response.setPredictedFinalSOC(mlFinalSoc);
            response.setRecommendedChargingStopLocation(prediction.getRecommendation());
        } else {
            double manualSoc = request.getCurrentBatterySOC() - (request.getDistanceKm() * 0.15);
            response.setPredictedFinalSOC(Math.max(0, manualSoc));
            response.setChargingStopInserted(false);
            response.setRecommendedChargingStopLocation("ML Service Error - Using Estimate");
            logger.warn("Using manual fallback SOC calculation");
        }
        double mlSoc = prediction.getFinalSOC();
        System.out.println("Building Response with SOC: " + mlSoc);
        response.setPredictedFinalSOC(prediction.getFinalSOC());
        response.setChargingStopInserted(prediction.isRequiresChargingStop());
        response.setRecommendedChargingStopLocation(prediction.getRecommendation());
        // 5. Dynamic Time Calculation
        double dist = request.getDistanceKm();
        double speed = request.getAvgSpeedKmh();
        int time;
        if (speed > 0) {
            time = (int) ((dist / speed) * 60);
        } else {
            // Default to a 40km/h speed estimate if speed is missing or zero
            time = (int) ((dist / 40.0) * 60);
            logger.warn("Average speed was 0. Using default 40km/h for time calculation.");
        }
        response.setEstimatedTotalTimeMinutes(time);

        return ResponseEntity.ok(response);
    }
}
