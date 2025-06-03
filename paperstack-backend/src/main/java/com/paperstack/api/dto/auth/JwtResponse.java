package com.paperstack.api.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String email;

    public JwtResponse(String token, String email) {
        this.token = token;
        this.email = email;
    }
} 