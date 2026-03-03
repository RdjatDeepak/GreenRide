package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.dto.RangePredictionDTO;
import com.greenride.greenride_backend.dto.RouteRequestDto;
import com.greenride.greenride_backend.dto.RouteResponseDTO;
import org.springframework.stereotype.Service;

@Service
public class RouteCalculationService {

    public RouteResponseDTO calculateOptimizedRoute(RouteRequestDto request, RangePredictionDTO prediction) {
        RouteResponseDTO response = new RouteResponseDTO();
        // if prediction is null then
        if (prediction == null || prediction.getFinalSOC() == null) {
            // Fallback values so the app doesn't crash
            response.setPredictedFinalSOC(request.getCurrentBatterySOC());
            response.setOptimizedRoutePolyline("ORIGINAL_DIRECT_POLYLINE");
            response.setRecommendedChargingStopLocation("ML Service Timeout - No Recommendation");
            response.setEstimatedTotalTimeMinutes(30);
            return response;
        }
        // Map the critical ML data to the Response DTO
        response.setPredictedFinalSOC(prediction.getFinalSOC());
        response.setChargingStopInserted(prediction.isRequiresChargingStop());

        // Business logic for routing
        if (prediction.isRequiresChargingStop()) {
            response.setOptimizedRoutePolyline(prediction.getPolyline() != null ? prediction.getPolyline() : "CHARGING_PATH");
            response.setRecommendedChargingStopLocation("28.6139, 77.2090"); // Fixed fallback
            response.setEstimatedChargingTimeMinutes(45);
            response.setEstimatedTotalTimeMinutes(75);
        } else {
            String poly = (prediction.getPolyline() != null) ? prediction.getPolyline() : "ORIGINAL_DIRECT_POLYLINE";
            response.setOptimizedRoutePolyline(poly);
            response.setRecommendedChargingStopLocation(prediction.getRecommendation());

            // Map time safely from prediction
            int mins = (prediction.getEstimatedTotalTimeMinutes() != null) ? prediction.getEstimatedTotalTimeMinutes() : 30;
            response.setEstimatedTotalTimeMinutes(mins);

            response.setEstimatedChargingTimeMinutes(0);
        }
        return response;
    }

    public double calculateManualDistance(RouteRequestDto req) {
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