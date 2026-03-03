package com.greenride.greenride_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class RangePredictionDTO {

    // Python returns "finalSOC", not "final_soc"
    @JsonProperty("finalSOC")
    private Double finalSOC;

    // Python returns "requiresChargingStop"
    @JsonProperty("requiresChargingStop")
    private boolean requiresChargingStop;

    @JsonProperty("predictedEnergyConsumptionKwh")
    private Double predictedEnergyConsumptionKwh;

    @JsonProperty("predictionConfidence")
    private double predictionConfidence;

    private String recommendation;
    private String unit;
    private String status;
    private String polyline;
    private Double distanceKm; // To hold the real road distance
    private Integer estimatedTotalTimeMinutes;
}