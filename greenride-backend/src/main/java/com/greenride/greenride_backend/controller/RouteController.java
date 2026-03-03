package com.greenride.greenride_backend.controller;

import com.greenride.greenride_backend.dto.RangePredictionDTO;
import com.greenride.greenride_backend.dto.RouteRequestDto;
import com.greenride.greenride_backend.dto.RouteResponseDTO;
import com.greenride.greenride_backend.exception.ResourceNotFoundException;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.repository.VehicleRepository;
import com.greenride.greenride_backend.service.MLService;
import com.greenride.greenride_backend.service.RouteCalculationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/route")
@CrossOrigin(origins = "*")
public class RouteController {

    @Autowired
    private MLService mlService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private RouteCalculationService routeCalculationService;

    private static final Logger logger = LoggerFactory.getLogger(RouteController.class);

    @PostMapping("/calculate-optimize")
    public ResponseEntity<RouteResponseDTO> getOptimizedRoute(@RequestBody RouteRequestDto request) {

        // 1. Validation
        if (request.getVehicleId() == null || request.getVehicleId() == 0) {
            throw new IllegalArgumentException("Vehicle ID is missing in the request");
        }
        // 2. Get real-time car data from Database
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        // 3. Sync the request with actual car battery levels
        request.setCurrentBatterySOC(vehicle.getCurrentBatteryLevel());
        request.setBatteryCapacity(vehicle.getBatteryCapacity());

        // 4. Populate the distance BEFORE calling ML Service
        // Note: Ensure calculateManualDistance is PUBLIC in your RouteCalculationService
        double distance = routeCalculationService.calculateManualDistance(request);
        request.setDistanceKm(distance);
        logger.info("Calculating route for distance: {} km", distance);
        // 5. Call ML Service (Python)
        RangePredictionDTO prediction = mlService.getOptimizedRange(request);

        // 6. Build Response using the dedicated Service
        // This avoids manual SOC overwriting and uses your optimized logic
        RouteResponseDTO response;

        if (prediction != null && prediction.getFinalSOC() != null) {
            // Use the service to map ML results to the response
            response = routeCalculationService.calculateOptimizedRoute(request, prediction);
            logger.info("ML Prediction successful. Predicted SOC: {}", prediction.getFinalSOC());
        } else {
            // Fallback logic if ML service fails
            response = handleFallback(request);
            logger.warn("ML Service failed or returned null. Using manual fallback.");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Fallback helper to keep the main method clean
     */
    private RouteResponseDTO handleFallback(RouteRequestDto request) {
        RouteResponseDTO response = new RouteResponseDTO();

        // Simple linear estimation: 0.15% SOC per KM
        double manualSoc = request.getCurrentBatterySOC() - (request.getDistanceKm() * 0.15);
        response.setPredictedFinalSOC(Math.max(0, manualSoc));
        response.setChargingStopInserted(false);
        response.setRecommendedChargingStopLocation("Service Unavailable - Using Estimate");

        // Use 40km/h default if avgSpeed is missing
        double speed = (request.getAvgSpeedKmh() > 0) ? request.getAvgSpeedKmh() : 40.0;
        int time = (int) ((request.getDistanceKm() / speed) * 60);
        response.setEstimatedTotalTimeMinutes(time);

        return response;
    }
}