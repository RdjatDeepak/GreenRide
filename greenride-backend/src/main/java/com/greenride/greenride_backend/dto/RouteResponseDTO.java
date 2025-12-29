package com.greenride.greenride_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponseDTO {
    //The optimized route path encoded in plolyLine
    private String optimizedRoutePolyline;

    //estimated total travel time  included charging
    private int estimatedTotalTimeMinutes;

//  The predicted State of Charge (SOC) upon arrival at the final destination (from RangePredictionDTO). */
    @JsonProperty("finalSOC")
    private double predictedFinalSOC;
    //Flag indicating if a stop was inserted by the system
    private boolean chargingStopInserted;
    //Coordinates of the recommended charging station
    private String recommendedChargingStopLocation;

    //Estimated Time required at the Charging
    private int estimatedChargingTimeMinutes;

}
