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
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    @Autowired private SimpMessagingTemplate messagingTemplate;

    public TripAssignmentResponse processTripRequest(TripRequestDTO request) {
        // 1. Fetch Vehicle
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with ID: " + request.getVehicleId()));

        // 2. Prepare ML Request
        RouteRequestDto mlRequest = new RouteRequestDto();
        mlRequest.setVehicleId(request.getVehicleId());
        mlRequest.setStartLat(request.getPickupLat());
        mlRequest.setStartLng(request.getPickupLng());
        mlRequest.setEndLat(request.getDropoffLat());
        mlRequest.setEndLng(request.getDropoffLng());
        mlRequest.setCurrentBatterySOC(vehicle.getCurrentBatteryLevel());
        mlRequest.setBatteryCapacity(vehicle.getBatteryCapacity());

        // 3. Call Python ML Service
        RangePredictionDTO prediction = mlService.getOptimizedRange(mlRequest);
        RouteResponseDTO optimizedRoute = routeService.calculateOptimizedRoute(mlRequest, prediction);

        // 4. Distance and Polyline Logic
        double finalDistance = (prediction != null && prediction.getDistanceKm() != null)
                ? prediction.getDistanceKm()
                : mlRequest.calculateTotalDistance();

        // 5. Create Trip Entity
        Trip trip = new Trip();
        trip.setVehicleId(vehicle.getId());
        trip.setPassengerId(request.getPassengerId());
        trip.setStartLat(request.getPickupLat());
        trip.setStartLng(request.getPickupLng());
        trip.setEndLat(request.getDropoffLat());
        trip.setEndLng(request.getDropoffLng());
        trip.setPolyline(prediction != null ? prediction.getPolyline() : optimizedRoute.getOptimizedRoutePolyline());
        trip.setPredictedEndSOC(prediction != null ? prediction.getFinalSOC() : 0.0);
        trip.setChargingStopRequired(prediction != null && prediction.isRequiresChargingStop());
        trip.setStatus("PENDING");
        trip.setStartTime(LocalDateTime.now());
        trip.setFare(calculateFareByDistance(finalDistance));

        tripRepository.save(trip);

        // 6. Map to Response DTO
        TripAssignmentResponse response = new TripAssignmentResponse();
        response.setTripId(trip.getId());
        response.setAssignedVehicleId(vehicle.getId());
        response.setVehicleModel(vehicle.getMake() + " " + vehicle.getModel());
        response.setDriverName(vehicle.getDriver() != null ? vehicle.getDriver().getName() : "Eco-Driver Assigned");
        response.setPolyline(trip.getPolyline());
        response.setPredictedEndSoc(trip.getPredictedEndSOC());
        response.setChargingStopRequired(trip.isChargingStopRequired());
        response.setDropoffLat(trip.getEndLat());
        response.setDropoffLng(trip.getEndLng());
        response.setEstimatedFare((int) trip.getFare());

        // FIX: Ensure Arrival Time is extracted correctly from Python/OSRM data
        Integer arrivalMins = (prediction != null && prediction.getEstimatedTotalTimeMinutes() != null)
                ? prediction.getEstimatedTotalTimeMinutes()
                : optimizedRoute.getEstimatedTotalTimeMinutes();

        response.setEstimatedArrivalTime((arrivalMins != null ? arrivalMins : 30) + " mins");

        // 7. Push to Driver WebSocket
        if (vehicle.getDriver() != null) {
            String driverEmail = vehicle.getDriver().getEmail();
            logger.info("📡 Pushing Trip #{} to Driver: {}", trip.getId(), driverEmail);
            messagingTemplate.convertAndSendToUser(driverEmail, "/queue/new-trip", response);
        }

        return response;
    }

    private double calculateFareByDistance(double distanceKm) {
        double baseFare = 50.0;
        double ratePerKm = checkIfPeakRequest() ? 15.0 : 12.0;
        return baseFare + (distanceKm * ratePerKm);
    }

    @Transactional
    public void updateTripStatus(Long tripId, String status) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        trip.setStatus(status);
        tripRepository.save(trip);
    }

    @Transactional
    public void completeTrip(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found"));

        if ("COMPLETED".equals(trip.getStatus())) return;

        trip.setStatus("COMPLETED");
        trip.setEndTime(LocalDateTime.now());
        tripRepository.save(trip);

        Vehicle vehicle = vehicleRepository.findById(trip.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));

        if (trip.getPredictedEndSOC() > 0) {
            vehicle.setCurrentBatteryLevel(trip.getPredictedEndSOC());
        }

        vehicle.setAvailable(true);
        vehicleRepository.save(vehicle);

        if (vehicle.getDriver() != null) {
            DriverProfile driverProfile = driverProfileRepository.findByUserId(vehicle.getDriver().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Driver profile not found"));

            double fare = trip.getFare();
            driverProfile.setDailyEarnings(driverProfile.getDailyEarnings() + fare);
            driverProfile.setTotalEarnings(driverProfile.getTotalEarnings() + fare);
            driverProfileRepository.save(driverProfile);
        }
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

    public List<Trip> getTripsByUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return tripRepository.findByPassengerIdOrderByStartTimeDesc(user.getId());
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