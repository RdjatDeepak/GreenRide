package com.greenride.greenride_backend.repository;
import java.util.Optional;
import com.greenride.greenride_backend.model.DriverProfile;
import com.greenride.greenride_backend.model.DriverVerificationStatus;
import com.greenride.greenride_backend.model.DriverVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import  org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile , Long>{
    Optional<DriverProfile>findByUserId(Long userId);
    List<DriverProfile> findByVerificationStatus(DriverVerificationStatus status);
}
