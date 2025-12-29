package com.greenride.greenride_backend.repository;
import  com.greenride.greenride_backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle , Long>{
    Optional<Vehicle> findByLicensePlate(String licensePlate);
    List<Vehicle> findByIsAvailable(boolean isAvailable);
    Optional<Vehicle> findByDriverId(Long driverId);

    // Finds vehicles within 'distance' km of the user

    @Query(value = "SELECT * FROM vehicles v WHERE " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(v.lat)) * " +
            "cos(radians(v.lng) - radians(:lng)) + sin(radians(:lat)) * " +
            "sin(radians(v.lat)))) < :distance", nativeQuery = true)
    List<Vehicle> findNearbyVehicles(@Param("lat") double lat,
                                     @Param("lng") double lng,
                                     @Param("distance") double distance);
    long countByIsCharging(boolean isCharging);
    long countByIsOnlineAndStatus(boolean isOnline, String status);
    List<Vehicle> findByIsOnlineTrueAndIsAvailableTrue();
}