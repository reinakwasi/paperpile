package com.paperstack.api.service;

import com.paperstack.api.model.Otp;
import com.paperstack.api.repository.OtpRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRATION_MINUTES = 5;

    public OtpService(OtpRepository otpRepository) {
        this.otpRepository = otpRepository;
    }

    public String generateAndSaveOtp(String email) {
        String otp = generateOtp();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
        
        Otp otpEntity = new Otp(email, otp, expiryTime);
        otpRepository.save(otpEntity);
        
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        Optional<Otp> validOtp = otpRepository.findValidOtp(email, otp, LocalDateTime.now());
        
        if (validOtp.isPresent()) {
            Otp otpEntity = validOtp.get();
            otpEntity.setUsed(true);
            otpRepository.save(otpEntity);
            return true;
        }
        return false;
    }

    private String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
} 