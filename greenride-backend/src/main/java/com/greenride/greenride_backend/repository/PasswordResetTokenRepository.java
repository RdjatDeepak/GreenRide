package com.greenride.greenride_backend.repository;

import com.greenride.greenride_backend.model.PasswordResetToken;
import com.greenride.greenride_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // Custom method to find a token by its string value
    Optional<PasswordResetToken> findByToken(String token);

    // Custom method to find a token associated with a specific user
    PasswordResetToken findByUser(User user);
}