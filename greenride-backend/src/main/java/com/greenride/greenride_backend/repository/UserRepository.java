package com.greenride.greenride_backend.repository;
import  com.greenride.greenride_backend.model.User;
import  org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User , Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
}
