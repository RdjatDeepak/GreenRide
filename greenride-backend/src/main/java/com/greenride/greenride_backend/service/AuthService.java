package com.greenride.greenride_backend.service;

import com.greenride.greenride_backend.model.User;
import com.greenride.greenride_backend.model.PasswordResetToken;
import com.greenride.greenride_backend.repository.UserRepository;
import com.greenride.greenride_backend.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

// NOTE: You will need to implement a separate EmailService and configure PasswordEncoder later.

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    // IMPORTANT: This bean must be configured in your main SecurityConfig class
    @Autowired
    private PasswordEncoder passwordEncoder;

     @Autowired
     private EmailService emailService; // Requires implementation later

    /**
     * Placeholder for user registration logic.
     * Encodes the password before saving the new user.
     */
    public User registerUser(User newUser) {
        if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use.");
        }

        // 1. Encode the raw password
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        // 2. Set default role (ROLE_USER)
        // newUser.setRole(roleRepository.findByName("ROLE_USER")); // Requires Role logic

        return userRepository.save(newUser);
    }

    /**
     * Placeholder for the JWT login logic (requires Spring Security integration).
     */
    public Optional<User> authenticate(String email, String rawPassword) {
        Optional<User> user = userRepository.findByEmail(email);

        if (user.isPresent() && passwordEncoder.matches(rawPassword, user.get().getPassword())) {
            // Success: Here, you would typically generate and return a JWT token
            return user;
        }
        return Optional.empty();
    }

    // ------------------------------------------------------------------------
    // PASSWORD RESET LOGIC (For /api/auth/forgot-password)
    // ------------------------------------------------------------------------

    /**
     * Handles the password reset request: finds user, generates token, and attempts to send email.
     * @param email The user's email address.
     */
    public void requestPasswordReset(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // Clear any existing token for this user
            PasswordResetToken existingToken = tokenRepository.findByUser(user);
            if (existingToken != null) {
                tokenRepository.delete(existingToken);
            }

            // Generate a new token and save it
            String tokenValue = UUID.randomUUID().toString();
            PasswordResetToken newToken = new PasswordResetToken(tokenValue, user);
            tokenRepository.save(newToken);

            // Placeholder for email sending
            System.out.println("--- Password Reset Token Generated ---");
            System.out.println("User: " + user.getEmail());
            System.out.println("Token: " + tokenValue);
            System.out.println("Expiry: " + newToken.getExpiryDate());
            System.out.println("------------------------------------");

             emailService.sendPasswordResetEmail(user.getEmail(), tokenValue);
        }

        // Security Note: We return success/finish without error
        // to prevent email enumeration attacks, even if the user isn't found.
    }

    /**
     * Validates the token and resets the user's password.
     * @param token The token received from the email link.
     * @param newPassword The new password provided by the user.
     * @return True if successful, False otherwise.
     */
    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> tokenOptional = tokenRepository.findByToken(token);

        if (tokenOptional.isPresent()) {
            PasswordResetToken resetToken = tokenOptional.get();

            // 1. Check if the token has expired
            if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
                tokenRepository.delete(resetToken);
                return false; // Token expired
            }

            // 2. Update the user's password
            User user = resetToken.getUser();
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // 3. Delete the token so it cannot be reused
            tokenRepository.delete(resetToken);
            return true;
        }

        return false; // Token not found or invalid
    }
}