package com.greenride.greenride_backend.repository;
import  com.greenride.greenride_backend.model.ERole;
import  com.greenride.greenride_backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface RoleRepository extends JpaRepository<Role , Long>{
    Optional<Role> findByName(ERole name);
}
