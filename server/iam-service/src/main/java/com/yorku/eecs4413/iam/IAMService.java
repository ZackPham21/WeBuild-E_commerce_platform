package com.yorku.eecs4413.iam;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class IAMService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Value("${iam.session.expiry.hours:24}")
    private int sessionExpiryHours;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Map<String, Object> signUp(SignUpRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            return Map.of("success", false, "message", "Username already exists.");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setStreetNumber(req.getStreetNumber());
        user.setStreetName(req.getStreetName());
        user.setCity(req.getCity());
        user.setCountry(req.getCountry());
        user.setPostalCode(req.getPostalCode());

        userRepository.save(user);
        return Map.of("success", true, "message", "Account created successfully.");
    }

    public Map<String, Object> signIn(SignInRequest req) {
        Optional<User> optUser = userRepository.findByUsername(req.getUsername());
        if (optUser.isEmpty()) {
            return Map.of("success", false, "message", "Invalid credentials.");
        }

        User user = optUser.get();
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return Map.of("success", false, "message", "Invalid credentials.");
        }

        String token = UUID.randomUUID().toString();
        Session session = new Session(token, user.getId(), LocalDateTime.now().plusHours(sessionExpiryHours));
        sessionRepository.save(session);

        return Map.of("success", true, "token", token, "userId", user.getId(), "username", user.getUsername());
    }

    public SessionValidationResponse validateSession(String token) {
        Optional<Session> optSession = sessionRepository.findByToken(token);
        if (optSession.isEmpty()) {
            return new SessionValidationResponse(false, null, null);
        }

        Session session = optSession.get();
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessionRepository.delete(session);
            return new SessionValidationResponse(false, null, null);
        }

        Optional<User> user = userRepository.findById(session.getUserId());
        return user.map(u -> new SessionValidationResponse(true, u.getId(), u.getUsername()))
                .orElse(new SessionValidationResponse(false, null, null));
    }

    public Map<String, Object> updateUserAddress(Long userId, Map<String, String> body) {
        return userRepository.findById(userId).map(u -> {
            if (body.containsKey("streetNumber")) u.setStreetNumber(body.get("streetNumber"));
            if (body.containsKey("streetName"))   u.setStreetName(body.get("streetName"));
            if (body.containsKey("city"))         u.setCity(body.get("city"));
            if (body.containsKey("country"))      u.setCountry(body.get("country"));
            if (body.containsKey("postalCode"))   u.setPostalCode(body.get("postalCode"));
            userRepository.save(u);
            return Map.<String, Object>of("success", true, "message", "Address updated.");
        }).orElse(Map.of("success", false, "message", "User not found."));
    }

    public Map<String, Object> getUserProfile(Long userId) {
        return userRepository.findById(userId).map(u -> {
            Map<String, Object> profile = new HashMap<>();
            profile.put("userId", u.getId());
            profile.put("username", u.getUsername());
            profile.put("firstName", u.getFirstName() != null ? u.getFirstName() : "");
            profile.put("lastName", u.getLastName() != null ? u.getLastName() : "");
            profile.put("streetNumber", u.getStreetNumber() != null ? u.getStreetNumber() : "");
            profile.put("streetName", u.getStreetName() != null ? u.getStreetName() : "");
            profile.put("city", u.getCity() != null ? u.getCity() : "");
            profile.put("country", u.getCountry() != null ? u.getCountry() : "");
            profile.put("postalCode", u.getPostalCode() != null ? u.getPostalCode() : "");
            return profile;
        }).orElse(Map.of("error", "User not found"));
    }

    public Map<String, Object> updateProfile(Long userId, Map<String, String> body) {
        return userRepository.findById(userId).map(u -> {
            if (body.containsKey("firstName")) u.setFirstName(body.get("firstName"));
            if (body.containsKey("lastName"))  u.setLastName(body.get("lastName"));
            userRepository.save(u);
            return Map.<String, Object>of("success", true, "message", "Profile updated.");
        }).orElse(Map.of("success", false, "message", "User not found."));
    }

    public Map<String, Object> getUserAddress(Long userId) {
        return userRepository.findById(userId).map(u -> Map.<String, Object>of(
                "streetNumber", u.getStreetNumber(),
                "streetName", u.getStreetName(),
                "city", u.getCity(),
                "country", u.getCountry(),
                "postalCode", u.getPostalCode()
        )).orElse(Map.of("error", "User not found"));
    }

    public Map<String, Object> changePassword(Long userId, Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");
        if (currentPassword == null || newPassword == null) {
            return Map.of("success", false, "message", "Current and new password are required.");
        }
        return userRepository.findById(userId).map(u -> {
            if (!passwordEncoder.matches(currentPassword, u.getPasswordHash())) {
                return Map.<String, Object>of("success", false, "message", "Current password is incorrect.");
            }
            if (newPassword.length() < 8) {
                return Map.<String, Object>of("success", false, "message", "New password must be at least 8 characters.");
            }
            u.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(u);
            return Map.<String, Object>of("success", true, "message", "Password changed successfully.");
        }).orElse(Map.of("success", false, "message", "User not found."));
    }

    public Map<String, Object> resetPassword(String username) {
        Optional<User> optUser = userRepository.findByUsername(username);
        if (optUser.isEmpty()) {
            return Map.of("success", false, "message", "User not found.");
        }
        // In a real system, send reset email. Here we return a reset token.
        String resetToken = UUID.randomUUID().toString();
        return Map.of("success", true, "resetToken", resetToken, "message", "Password reset token generated.");
    }

    public void signOut(String token) {
        sessionRepository.findByToken(token).ifPresent(sessionRepository::delete);
    }
}
