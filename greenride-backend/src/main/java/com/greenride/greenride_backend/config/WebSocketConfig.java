package com.greenride.greenride_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Enables WebSocket message handling, backed by a broker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the HTTP endpoint the client connects to for the handshake
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173") // Allow your React frontend
                .withSockJS(); // Use SockJS for fallback support
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages from the server to the client (broadcast) will use this prefix
        registry.enableSimpleBroker("/topic");

        // Messages from the client to the server will use this prefix for routing
        registry.setApplicationDestinationPrefixes("/app");
    }
}