package com.giasu.service;

import com.giasu.dto.AuthRequest;
import com.giasu.dto.AuthResponse;
import com.giasu.dto.RegisterRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public AuthService(PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    public AuthResponse login(AuthRequest request) {
        try {
            UserRow user = jdbcTemplate.queryForObject(
                """
                select "id", "email", "passwordHash", "fullName", "role"::text as "role"
                from "User"
                where "email" = ? and "deletedAt" is null
                """,
                (rs, rowNum) -> new UserRow(
                    rs.getString("id"),
                    rs.getString("email"),
                    rs.getString("passwordHash"),
                    rs.getString("fullName"),
                    rs.getString("role")
                ),
                request.email()
            );

            if (user == null || !passwordEncoder.matches(request.password(), user.passwordHash())) {
                return new AuthResponse(false, null, new AuthResponse.ErrorDto("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng"));
            }

            return new AuthResponse(true, new AuthResponse.UserDto(user.id(), user.email(), user.fullName(), user.role()), null);
        } catch (EmptyResultDataAccessException ex) {
            return new AuthResponse(false, null, new AuthResponse.ErrorDto("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng"));
        }
    }

    public AuthResponse register(RegisterRequest request) {
        Integer existing = jdbcTemplate.queryForObject(
            "select count(*) from \"User\" where \"email\" = ?",
            Integer.class,
            request.email()
        );
        if (existing != null && existing > 0) {
            return new AuthResponse(false, null, new AuthResponse.ErrorDto("EMAIL_EXISTS", "Email đã tồn tại"));
        }

        String id = UUID.randomUUID().toString();
        String encodedPassword = passwordEncoder.encode(request.password());
        String role = request.role() == null || request.role().isBlank() ? "STUDENT" : request.role();

        jdbcTemplate.update(
            """
            insert into "User" ("id", "email", "passwordHash", "fullName", "role", "createdAt", "updatedAt")
            values (?, ?, ?, ?, ?::"Role", current_timestamp, current_timestamp)
            """,
            id,
            request.email(),
            encodedPassword,
            request.fullName(),
            role
        );

        return new AuthResponse(true, new AuthResponse.UserDto(id, request.email(), request.fullName(), role), null);
    }

    public AuthResponse refresh(String authorization) {
        return new AuthResponse(false, null, new AuthResponse.ErrorDto("NOT_IMPLEMENTED", "Refresh token chưa được bật ở Spring backend"));
    }

    private record UserRow(String id, String email, String passwordHash, String fullName, String role) {}
}
