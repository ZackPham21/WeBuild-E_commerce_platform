package com.yorku.eecs4413.gateway;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class GatewayController {

    @Autowired
    private GatewayService gatewayService;

    // ─── IAM ─────────────────────────────────────────────────────
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@RequestBody Map<String, Object> body) {
        try {
            return gatewayService.signUp(body);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signIn(@RequestBody Map<String, Object> body) {
        try {
            return gatewayService.signIn(body);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid credentials."));
        }
    }

    @PostMapping("/signout")
    public ResponseEntity<?> signOut(@RequestHeader(value = "Authorization", required = false) String auth) {
        try {
            if (auth == null || auth.isBlank()) {
                return ResponseEntity.status(401).body(Map.of("error", "No token provided."));
            }
            return gatewayService.signOut(auth.replace("Bearer ", ""));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Sign out failed."));
        }
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, Object> body) {
        return gatewayService.resetPassword(body);
    }

    // ─── Catalogue ────────────────────────────────────────────────
    @GetMapping("/items")
    public ResponseEntity<?> getItems(@RequestHeader("Authorization") String auth) {
        return gatewayService.getActiveItems(auth.replace("Bearer ", ""));
    }

    @GetMapping("/items/search")
    public ResponseEntity<?> searchItems(@RequestHeader("Authorization") String auth,
                                         @RequestParam String keyword) {
        return gatewayService.searchItems(auth.replace("Bearer ", ""), keyword);
    }

    @GetMapping("/items/category/{category}")
    public ResponseEntity<?> getItemsByCategory(@RequestHeader("Authorization") String auth,
                                                @PathVariable String category) {
        return gatewayService.getItemsByCategory(auth.replace("Bearer ", ""), category);
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<?> getItem(@RequestHeader("Authorization") String auth,
                                     @PathVariable Long itemId) {
        return gatewayService.getItem(auth.replace("Bearer ", ""), itemId);
    }

    @PostMapping("/items")
    public ResponseEntity<?> addItem(@RequestHeader("Authorization") String auth,
                                     @RequestBody Map<String, Object> body) {
        return gatewayService.addItem(auth.replace("Bearer ", ""), body);
    }

    // ─── Auction ──────────────────────────────────────────────────
    @GetMapping("/auction/state/{itemId}")
    public ResponseEntity<?> getAuctionState(@RequestHeader("Authorization") String auth,
                                             @PathVariable Long itemId) {
        return gatewayService.getAuctionState(auth.replace("Bearer ", ""), itemId);
    }

    @PostMapping("/auction/bid")
    public ResponseEntity<?> placeBid(@RequestHeader("Authorization") String auth,
                                      @RequestBody GatewayBidRequest req) {
        return gatewayService.placeBid(auth.replace("Bearer ", ""), req);
    }

    @GetMapping("/auction/winner/{itemId}")
    public ResponseEntity<?> getWinner(@RequestHeader("Authorization") String auth,
                                       @PathVariable Long itemId) {
        return gatewayService.getWinner(auth.replace("Bearer ", ""), itemId);
    }

    @GetMapping("/auction/bids/{itemId}")
    public ResponseEntity<?> getBidHistory(@RequestHeader("Authorization") String auth,
                                           @PathVariable Long itemId) {
        return gatewayService.getBidHistory(auth.replace("Bearer ", ""), itemId);
    }

    // ─── Payment ──────────────────────────────────────────────────
    @PostMapping("/payment")
    public ResponseEntity<?> processPayment(@RequestHeader("Authorization") String auth,
                                            @RequestBody GatewayPaymentRequest req) {
        return gatewayService.processPayment(auth.replace("Bearer ", ""), req);
    }

    @GetMapping("/payment/receipt/{itemId}")
    public ResponseEntity<?> getReceipt(@RequestHeader("Authorization") String auth,
                                        @PathVariable Long itemId) {
        return gatewayService.getReceipt(auth.replace("Bearer ", ""), itemId);
    }
}
