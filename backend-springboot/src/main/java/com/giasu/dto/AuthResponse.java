package com.giasu.dto;

public record AuthResponse(
    boolean success,
    UserDto data,
    ErrorDto error
) {
    public record UserDto(String id, String email, String fullName, String role) {}
    public record ErrorDto(String code, String message) {}
}
