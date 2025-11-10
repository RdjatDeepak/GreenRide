package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.model.ERole;
import com.greenride.greenride_backend.model.Role;
import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.repository.RoleRepository;
import com.greenride.greenride_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner; // <-- REQUIRED IMPORT
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
// ERROR FIX 1: MUST implement CommandLineRunner
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) throws Exception {

        // Ensure consistent casing for the lookup email
        String adminEmail = "admin@greenride.com";

        // Ensure all Roles exist
        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_ADMIN)));

        roleRepository.findByName(ERole.ROLE_DRIVER)
                .orElseGet(() ->roleRepository.save(new Role(ERole.ROLE_DRIVER)));

        roleRepository.findByName(ERole.ROLE_USER)
                .orElseGet(()-> roleRepository.save(new Role(ERole.ROLE_USER)));

        // Creating a default admin user if one doesn't exist
        Optional<User> adminUser = userRepository.findByEmail(adminEmail);
        if(adminUser.isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail(adminEmail); // Use the lowercase email for consistency
            // Secure PassWord Hashing
            admin.setPassword(passwordEncoder.encode("admin@123"));

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);

            userRepository.save(admin);
            System.out.println("Default admin user created: " + adminEmail + " / admin@123");
        }
    }
}