package com.paperstack.api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    public void sendVerificationEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("PaperStack <noreply@paperstack.com>");
        message.setTo(to);
        message.setSubject("Verify your PaperStack account");
        message.setText("Your verification code is: " + otp + "\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this code, please ignore this email.");
        
        emailSender.send(message);
    }
} 