package com.greenride.greenride_backend.config;

import com.greenride.greenride_backend.security.AuthTokenFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.core.authority.mapping.SimpleAuthorityMapper;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter(){
        return new AuthTokenFilter();
    }
    // Inside your SecurityConfig class
    @Bean
    public GrantedAuthoritiesMapper grantedAuthoritiesMapper() {
        SimpleAuthorityMapper authorityMapper = new SimpleAuthorityMapper();
        // This setting ensures that authorities read from the token
        // are used directly without adding the "ROLE_" prefix.
        authorityMapper.setConvertToUpperCase(true); // Ensures consistency if roles are lowercased
        authorityMapper.setDefaultAuthority("USER"); // Default for unmapped users
        return authorityMapper;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(){
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setAuthoritiesMapper(grantedAuthoritiesMapper()); //explicitly grant authority
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception{
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Set allowed origins for your React app
//        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        // Set allowed origins for Vite app and vite port is 5173
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        // Allow all necessary headers and methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply to all endpoints
        return source;
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 1. Disable these to stop the "Pre-authenticated" entry point error
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        // 2. Permit all essential and public endpoints first
                        .requestMatchers("/api/auth/**", "/api/route/**", "/ws/**", "/error", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
//                        .requestMatchers("/api/route/calculate-optimize").permitAll() // Force open for testing
                                // (Specific rule for applying) and status
                                .requestMatchers("/api/drivers/apply/**").hasAnyRole("USER", "DRIVER" ,"ADMIN")
                                .requestMatchers("/api/drivers/**").hasAnyRole("DRIVER", "ADMIN")
                                .requestMatchers("/api/vehicles/nearby").hasAnyRole("USER")
                                // Inside your filterChain method
                                .requestMatchers("/api/vehicles/**").hasAnyRole("USER", "ADMIN")
                                .requestMatchers("/api/trips/request").hasAnyRole("USER")
                                .requestMatchers("/api/trips/history").hasAnyRole("USER")
                                .requestMatchers("/api/user/**").hasRole("USER")

                                // 3. Driver/Admin specific rules

                        .requestMatchers("/api/admin/**").hasRole("ADMIN")


                        // 4. Require authentication for everything else
                        .anyRequest().authenticated()
                );

        // 5. Add your JWT filter
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}