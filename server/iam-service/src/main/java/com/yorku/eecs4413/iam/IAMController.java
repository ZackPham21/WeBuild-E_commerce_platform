package com.yorku.eecs4413.iam;



import com.yorku.eecs4413.iam.*;
import com.yorku.eecs4413.iam.IAMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/iam")
public class IAMController {

    @Autowired
    private IAMService iamService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody SignUpRequest req) {
        // Validate required fields
        if (req.getUsername() == null || req.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username is required."));
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password is required."));
        }
        Map<String, Object> result = iamService.signUp(req);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/signin")
    public ResponseEntity<Map<String, Object>> signIn(@RequestBody SignInRequest req) {
        if (req.getUsername() == null || req.getUsername().isBlank()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Username is required."));
        }
        Map<String, Object> result = iamService.signIn(req);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.status(401).body(result);
    }

    @GetMapping("/validate")
    public ResponseEntity<SessionValidationResponse> validateSession(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        SessionValidationResponse resp = iamService.validateSession(token);
        return resp.isValid() ? ResponseEntity.ok(resp) : ResponseEntity.status(401).body(resp);
    }

    @PostMapping("/signout")
    public ResponseEntity<Map<String, Object>> signOut(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        iamService.signOut(token);
        return ResponseEntity.ok(Map.of("success", true, "message", "Signed out successfully."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(iamService.resetPassword(body.get("username")));
    }

    @GetMapping("/user/{userId}/address")
    public ResponseEntity<Map<String, Object>> getUserAddress(@PathVariable Long userId) {
        return ResponseEntity.ok(iamService.getUserAddress(userId));
    }
}