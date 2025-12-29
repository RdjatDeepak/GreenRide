package com.greenride.greenride_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.greenride.greenride_backend.dto.RangePredictionDTO;
import com.greenride.greenride_backend.dto.RouteRequestDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

@Service
public class MLService {
    private static final Logger logger = LoggerFactory.getLogger(MLService.class);
    private final RestTemplate restTemplate;;
    // Check if this matches your working Postman URL exactly https://unbreachably-unbeguiling-raegan.ngrok-free.dev/predict/range
    private final String ML_API_URL = "https://unbreachably-unbeguiling-raegan.ngrok-free.dev/predict/range";
    //private final String ML_API_URL = "https://unbreachably-unbeguiling-raegan.ngrok-free.dev/predict/range"; //Python Server Address
    public MLService(){
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000); //3 sec to connet
        factory.setReadTimeout(3000); // 3 seconds to get data
        this.restTemplate= new RestTemplate(factory);
    }
    public RangePredictionDTO getOptimizedRange(RouteRequestDto routeData) {
        logger.info("Attempting to fetch range prediction for distance: {} km", routeData.calculateTotalDistance());

        try {
            // 1. Setup Headers correctly
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
//            headers.set("ngrok-skip-browser-warning", "true"); // The bypass key
//            headers.set("User-Agent", "GreenRide-Backend"); // Some proxies require this
            headers.set("ngrok-skip-browser-warning", "any-value");
             // Add a real browser User-Agent so Ngrok doesn't think you are a bot
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
            // 2. Wrap request in HttpEntity
            HttpEntity<RouteRequestDto> entity = new HttpEntity<>(routeData, headers);

            // 3. Use exchange instead of postForEntity for better header control
            ResponseEntity<RangePredictionDTO> response = restTemplate.exchange(
                    ML_API_URL,
                    HttpMethod.POST,
                    entity,
                    RangePredictionDTO.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                RangePredictionDTO body = response.getBody();
                // Check if mapping actually worked
                if (body.getFinalSOC() == null) {
                    logger.error("ML Response received but mapping failed! Raw body check needed.");
                    return createFallbackResponse();
                }
                logger.info("ML Prediction received successfully. SOC: {}", body.getFinalSOC());
                return body;
            }
        } catch (Exception e) {
            logger.error("CRITICAL ML ERROR: {}", e.getMessage());
        }
        return createFallbackResponse();
    }
    private RangePredictionDTO createFallbackResponse() {
        RangePredictionDTO fallback = new RangePredictionDTO();
        fallback.setStatus("service_unavailable");
        fallback.setUnit("kWh");
        // You could set a default energy calculation here as a backup
        return fallback;
    }
}