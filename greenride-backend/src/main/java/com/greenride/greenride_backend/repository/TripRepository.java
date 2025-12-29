package com.greenride.greenride_backend.repository;

import com.greenride.greenride_backend.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip , Long> {
    List<Trip> findByPassengerId(Long passengerId);
    Optional<Trip> findByVehicleIdAndStatus(Long vehicleId , String status);
      //For History and Stats (Finds all matching trips)
    List<Trip> findAllByVehicleIdAndStatus(Long vehicleId, String status);

    long countByStatus(String status);

    @Query("SELECT SUM(t.fare) FROM Trip t WHERE t.status = 'COMPLETED'")
    Double sumTotalEarnings();
    //We search by the ID stored in the Trip table
    List<Trip> findByPassengerIdOrderByStartTimeDesc(Long passengerId);
}
