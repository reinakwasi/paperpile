package com.paperstack.api.repository;

import com.paperstack.api.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<Otp, Long> {
    @Query("SELECT o FROM Otp o WHERE o.email = :email AND o.code = :code AND o.expiryTime > :now AND o.used = false")
    Optional<Otp> findValidOtp(@Param("email") String email, @Param("code") String code, @Param("now") LocalDateTime now);
} 