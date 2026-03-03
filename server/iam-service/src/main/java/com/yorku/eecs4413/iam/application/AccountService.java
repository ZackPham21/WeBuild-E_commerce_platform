package com.yorku.eecs4413.iam.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yorku.eecs4413.iam.api.AccountResponse;
import com.yorku.eecs4413.iam.api.SigninRequest;
import com.yorku.eecs4413.iam.api.SignupRequest;
import com.yorku.eecs4413.iam.infrastructure.AccountEntity;
import com.yorku.eecs4413.iam.infrastructure.AccountJpaRepository;

@Service
public class AccountService {

    private final AccountJpaRepository repo;

    public AccountService(AccountJpaRepository repo) {
        this.repo = repo;
    }

    public AccountResponse signup(SignupRequest req) {
        String email = req.email().toLowerCase();

        if (repo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String id = UUID.randomUUID().toString();
        String hash = sha256(req.password());

        AccountEntity entity = new AccountEntity(id, email, hash);
        repo.save(entity);

        return new AccountResponse(entity.getId(), entity.getEmail());
    }

    public AccountResponse signin(SigninRequest req) {
        String email = req.email().toLowerCase();

        AccountEntity entity = repo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!entity.getPasswordHash().equals(sha256(req.password()))) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        return new AccountResponse(entity.getId(), entity.getEmail());
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}