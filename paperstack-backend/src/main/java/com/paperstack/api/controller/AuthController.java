package com.paperstack.api.controller;

import com.paperstack.api.dto.auth.JwtResponse;
import com.paperstack.api.dto.auth.LoginRequest;
import com.paperstack.api.dto.auth.SignupRequest;
import com.paperstack.api.dto.auth.VerifyOtpRequest;
import com.paperstack.api.model.User;
import com.paperstack.api.repository.UserRepository;
import com.paperstack.api.security.JwtTokenProvider;
import com.paperstack.api.service.EmailService;
import com.paperstack.api.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final OtpService otpService;

    public AuthController(AuthenticationManager authenticationManager,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder,
                         JwtTokenProvider tokenProvider,
                         EmailService emailService,
                         OtpService otpService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.emailService = emailService;
        this.otpService = otpService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already taken!");
        }

        // Generate and send OTP
        String otp = otpService.generateAndSaveOtp(signupRequest.getEmail());
        emailService.sendVerificationEmail(signupRequest.getEmail(), otp);

        return ResponseEntity.ok("Verification code sent to your email");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyOtpRequest) {
        if (!otpService.verifyOtp(verifyOtpRequest.getEmail(), verifyOtpRequest.getOtp())) {
            return ResponseEntity.badRequest().body("Invalid or expired verification code");
        }

        // Create user after successful verification
        User user = new User();
        user.setEmail(verifyOtpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(verifyOtpRequest.getPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Check if user exists first
            if (!userRepository.existsByEmail(loginRequest.getEmail())) {
                return ResponseEntity.status(404).body("Email not found");
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            return ResponseEntity.ok(new JwtResponse(jwt, loginRequest.getEmail()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Incorrect password");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("An error occurred during login");
        }
    }
} 