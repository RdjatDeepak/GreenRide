package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.RangePredictionDTO;
import com.greenride.greenride_backend.dto.RouteRequestDto;
import com.greenride.greenride_backend.dto.RouteResponseDTO;
import org.springframework.stereotype.Service;

@Service
public class RouteCalculationService {

    public RouteResponseDTO calculateOptimizedRoute(RouteRequestDto request, RangePredictionDTO prediction) {
        RouteResponseDTO response = new RouteResponseDTO();

        // Map the critical ML data to the Response DTO
        response.setPredictedFinalSOC(prediction.getFinalSOC());
        response.setChargingStopInserted(prediction.isRequiresChargingStop());

        // Business logic for routing
        if (prediction.isRequiresChargingStop()) {
            // In a real scenario, you'd fetch the closest charging station based on coordinates
            response.setOptimizedRoutePolyline("ENCODED_POLYLINE_VIA_CHARGING_STATION");
            response.setRecommendedChargingStopLocation("28.6139, 77.2090");
            response.setEstimatedChargingTimeMinutes(45);
            response.setEstimatedTotalTimeMinutes(75); // Example travel time + charge
        } else {
            // Use polyline from ML if provided, otherwise default to direct
            String poly = (prediction.getPolyline() != null) ? prediction.getPolyline() : "ORIGINAL_DIRECT_POLYLINE";
            response.setOptimizedRoutePolyline(poly);
            response.setRecommendedChargingStopLocation("NONE");
            response.setEstimatedChargingTimeMinutes(0);

            // Assume 1.5 mins per KM for total time calculation if not provided by ML
            int calculatedTime = (int) (calculateManualDistance(request) * 1.5);
            response.setEstimatedTotalTimeMinutes(calculatedTime > 0 ? calculatedTime : 30);
        }
        return response;
    }

    private double calculateManualDistance(RouteRequestDto req) {
        double lat1 = req.getStartLat();
        double lon1 = req.getStartLng();
        double lat2 = req.getEndLat();
        double lon2 = req.getEndLng();

        if (lat1 == 0 || lat2 == 0) return 0;

        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}