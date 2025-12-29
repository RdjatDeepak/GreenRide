package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.*;
import com.greenride.greenride_backend.model.Trip;
import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.Vehicle;
import com.greenride.greenride_backend.repository.TripRepository;
import com.greenride.greenride_backend.repository.DriverProfileRepository;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TripService {
    private static final Logger logger = LoggerFactory.getLogger(TripService.class);
    @Autowired private MLService mlService;
    @Autowired private RouteCalculationService routeService;
    @Autowired private TripRepository tripRepository;
    @Autowired private DriverProfileRepository driverProfileRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private UserRepository userRepository;

    public TripAssignmentResponse processTripRequest(TripRequestDTO request) {
        // 1. Fetch the actual vehicle details
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with ID: " + request.getVehicleId()));

        // 2. Prepare data for ML Prediction
        RouteRequestDto mlRequest = new RouteRequestDto();
        mlRequest.setVehicleId(request.getVehicleId());
        mlRequest.setStartLat(request.getPickupLat());
        mlRequest.setStartLng(request.getPickupLng());
        mlRequest.setEndLat(request.getDropoffLat());
        mlRequest.setEndLng(request.getDropoffLng());

        double actualDistance = mlRequest.calculateTotalDistance();
        logger.info("TRIP DISTANCE CALC: {} km", actualDistance);
        // Add additional params for ML accuracy
        mlRequest.setCurrentBatterySOC(vehicle.getCurrentBatteryLevel());
        mlRequest.setBatteryCapacity(vehicle.getBatteryCapacity());

        // Get actual ML data
        RangePredictionDTO prediction = mlService.getOptimizedRange(mlRequest);
        // Pass prediction to route service to sync data
        RouteResponseDTO optimizedRoute = routeService.calculateOptimizedRoute(mlRequest, prediction);

        // 3. Create and Save the Trip Record
        Trip trip = new Trip();
        trip.setVehicleId(vehicle.getId());
        trip.setPassengerId(request.getPassengerId());
        trip.setStartLat(request.getPickupLat());
        trip.setStartLng(request.getPickupLng());
        trip.setEndLat(request.getDropoffLat());
        trip.setEndLng(request.getDropoffLng());

        // Use polyline from ML if present, otherwise from RouteService
        String finalPolyline = (prediction.getPolyline() != null && !prediction.getPolyline().isEmpty())
                ? prediction.getPolyline() : optimizedRoute.getOptimizedRoutePolyline();
        trip.setPolyline(finalPolyline);

        trip.setPredictedEndSOC(prediction.getFinalSOC());
        trip.setChargingStopRequired(prediction.isRequiresChargingStop());
        trip.setChargingStationLocation(optimizedRoute.getRecommendedChargingStopLocation());
        trip.setStatus("IN_PROGRESS");
        trip.setStartTime(LocalDateTime.now());

        tripRepository.save(trip);

        // 4. Prepare the Dynamic Response for Frontend
        TripAssignmentResponse response = new TripAssignmentResponse();
        response.setTripId(trip.getId());
        response.setAssignedVehicleId(vehicle.getId());
        response.setVehicleModel(vehicle.getMake() + " " + vehicle.getModel());

        if (vehicle.getDriver() != null) {
            response.setDriverName(vehicle.getDriver().getName());
        } else {
            response.setDriverName("Eco-Driver Assigned");
        }

        // SYNC DATA TO RESPONSE
        response.setPolyline(trip.getPolyline());
        response.setPredictedEndSoc(prediction.getFinalSOC()); // Direct from ML Prediction
        response.setChargingStopRequired(trip.isChargingStopRequired());

        // Fix 0.0 coordinates in response
        response.setDropoffLat(trip.getEndLat());
        response.setDropoffLng(trip.getEndLng());

        response.setEstimatedFare((int) calculateFare(trip));
        response.setEstimatedArrivalTime(optimizedRoute.getEstimatedTotalTimeMinutes() + " mins");

        return response;
    }

    @Transactional
    public void completeTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));

        if ("COMPLETED".equals(trip.getStatus())) return;

        trip.setStatus("COMPLETED");
        trip.setEndTime(LocalDateTime.now());

        double fare = calculateFare(trip);
        trip.setFare(fare);
        tripRepository.save(trip);

        Vehicle vehicle = vehicleRepository.findById(trip.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));

        if (vehicle.getDriver() != null) {
            DriverProfile driverProfile = driverProfileRepository.findByUserId(vehicle.getDriver().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Driver profile not found"));

            driverProfile.setDailyEarnings(driverProfile.getDailyEarnings() + fare);
            driverProfile.setMonthlyEarnings(driverProfile.getMonthlyEarnings() + fare);
            driverProfile.setTotalEarnings(driverProfile.getTotalEarnings() + fare);
            driverProfileRepository.save(driverProfile);
        }

        vehicle.setAvailable(true);
        vehicleRepository.save(vehicle);
    }

    public List<Trip> getTripsByUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return tripRepository.findByPassengerIdOrderByStartTimeDesc(user.getId());
    }

    private double calculateFare(Trip trip) {
        double baseFare = 50.0;
        double distanceKm = calculateDistance(trip.getStartLat(), trip.getStartLng(), trip.getEndLat(), trip.getEndLng());
        boolean isPeakRequest = checkIfPeakRequest();
        double ratePerKm = isPeakRequest ? 15.0 : 12.0; // Updated rates for EV premium
        return baseFare + (distanceKm * ratePerKm);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private boolean checkIfPeakRequest() {
        int currentHour = java.time.LocalTime.now().getHour();
        return (currentHour >= 18 && currentHour <= 22);
    }

    public Trip getActiveTripForDriver(String email) {
        User driver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        Vehicle vehicle = vehicleRepository.findByDriverId(driver.getId())
                .orElseThrow(() -> new RuntimeException("No vehicle assigned"));
        return tripRepository.findByVehicleIdAndStatus(vehicle.getId(), "IN_PROGRESS")
                .orElseThrow(() -> new RuntimeException("No active trip found"));
    }
}