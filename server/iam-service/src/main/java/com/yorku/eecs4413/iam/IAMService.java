package com.yorku.eecs4413.iam;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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

    public Map<String, Object> getUserAddress(Long userId) {
        return userRepository.findById(userId).map(u -> Map.<String, Object>of(
                "streetNumber", u.getStreetNumber(),
                "streetName", u.getStreetName(),
                "city", u.getCity(),
                "country", u.getCountry(),
                "postalCode", u.getPostalCode()
        )).orElse(Map.of("error", "User not found"));
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
