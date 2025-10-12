package com.greenride.greenride_backend.repository;
import  com.greenride.greenride_backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle , Long>{
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    List<Vehicle> findByIsAvailable(boolean isAvailable);
}
