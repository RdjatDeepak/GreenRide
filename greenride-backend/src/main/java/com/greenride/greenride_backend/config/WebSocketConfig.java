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
//                .setAllowedOriginPatterns("http://localhost:5173") // Allow your React frontend
                .setAllowedOriginPatterns("*") // allow connection from any origin
                .withSockJS(); // Use SockJS for fallback support
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages from the server to the client (broadcast) will use this prefix
        // 2. /queue: Typically used for one-to-one private messages
        registry.enableSimpleBroker("/topic" , "/queue");

        // Messages from the client to the server will use this prefix for routing
        // Example: client sends to /app/update-location
        registry.setApplicationDestinationPrefixes("/app");

        //This prefix is used for sending messages to specific users
        registry.setUserDestinationPrefix("/user");
    }
}