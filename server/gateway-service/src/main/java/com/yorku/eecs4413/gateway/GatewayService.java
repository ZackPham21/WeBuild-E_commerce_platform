package com.yorku.eecs4413.gateway;


import com.yorku.eecs4413.gateway.GatewayBidRequest;
import com.yorku.eecs4413.gateway.GatewayPaymentRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class GatewayService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${service.iam.url}")
    private String iamUrl;

    @Value("${service.catalogue.url}")
    private String catalogueUrl;

    @Value("${service.auction.url}")
    private String auctionUrl;

    @Value("${service.payment.url}")
    private String paymentUrl;

    // ─── IAM Facade ───────────────────────────────────────────────

    public ResponseEntity<?> signUp(Map<String, Object> body) {
        return restTemplate.postForEntity(iamUrl + "/api/iam/signup", body, Map.class);
    }

    public ResponseEntity<?> signIn(Map<String, Object> body) {
        return restTemplate.postForEntity(iamUrl + "/api/iam/signin", body, Map.class);
    }

    public ResponseEntity<?> signOut(String token) {
        HttpHeaders headers = bearerHeaders(token);
        return restTemplate.exchange(iamUrl + "/api/iam/signout", HttpMethod.POST,
                new HttpEntity<>(headers), Map.class);
    }

    public ResponseEntity<?> resetPassword(Map<String, Object> body) {
        return restTemplate.postForEntity(iamUrl + "/api/iam/reset-password", body, Map.class);
    }

    // ─── Session Validation (internal) ────────────────────────────

    public Map<String, Object> validateSession(String token) {
        try {
            HttpHeaders headers = bearerHeaders(token);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    iamUrl + "/api/iam/validate", HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);
            return resp.getBody();
        } catch (HttpClientErrorException e) {
            return Map.of("valid", false);
        }
    }

    // ─── Catalogue Facade ─────────────────────────────────────────

    public ResponseEntity<?> getActiveItems(String token) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(catalogueUrl + "/api/catalogue/items", Object.class);
    }

    public ResponseEntity<?> searchItems(String token, String keyword) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(catalogueUrl + "/api/catalogue/items/search?keyword=" + keyword, Object.class);
    }

    public ResponseEntity<?> getItemsByCategory(String token, String category) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(catalogueUrl + "/api/catalogue/items/category/" + category, Object.class);
    }

    public ResponseEntity<?> getItem(String token, Long itemId) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(catalogueUrl + "/api/catalogue/items/" + itemId, Object.class);
    }

    public ResponseEntity<?> addItem(String token, Map<String, Object> body) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.postForEntity(catalogueUrl + "/api/catalogue/items", body, Map.class);
    }

    // ─── Auction Facade ───────────────────────────────────────────

    public ResponseEntity<?> getAuctionState(String token, Long itemId) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(auctionUrl + "/api/auction/state/" + itemId, Object.class);
    }

    public ResponseEntity<?> placeBid(String token, GatewayBidRequest req) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();

        Map<String, Object> bidBody = new HashMap<>();
        bidBody.put("itemId", req.getItemId());
        bidBody.put("userId", session.get("userId"));
        bidBody.put("username", session.get("username"));
        bidBody.put("amount", req.getAmount());

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(auctionUrl + "/api/auction/bid", bidBody, Map.class);
            return ResponseEntity.status(resp.getStatusCode()).body(resp.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }
    }

    public ResponseEntity<?> getWinner(String token, Long itemId) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(auctionUrl + "/api/auction/winner/" + itemId, Object.class);
    }

    public ResponseEntity<?> getBidHistory(String token, Long itemId) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(auctionUrl + "/api/auction/bids/" + itemId, Object.class);
    }

    // ─── Payment Facade ───────────────────────────────────────────

    public ResponseEntity<?> processPayment(String token, GatewayPaymentRequest req) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();

        Long userId = Long.valueOf(session.get("userId").toString());
        String username = session.get("username").toString();

        // Get auction state (works for both OPEN and CLOSED)
        ResponseEntity<Map> auctionStateResp;
        try {
            auctionStateResp = (ResponseEntity<Map>) getAuctionState(token, req.getItemId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not fetch auction state."));
        }

        Map<String, Object> auctionData = auctionStateResp.getBody();
        if (auctionData == null || auctionData.containsKey("error")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Auction not found."));
        }

        // Get winner - highest bidder regardless of auction status
        Object highestBidderIdObj = auctionData.get("highestBidderId");
        if (highestBidderIdObj == null || highestBidderIdObj.toString().equals("none")) {
            return ResponseEntity.badRequest().body(Map.of("error", "No bids placed on this auction."));
        }

        Long winnerId = Long.valueOf(highestBidderIdObj.toString());
        BigDecimal winningBid = new BigDecimal(auctionData.get("currentHighestBid").toString());

        // Get shipping details
        ResponseEntity<Map> shippingResp;
        try {
            shippingResp = restTemplate.getForEntity(
                    catalogueUrl + "/api/catalogue/items/" + req.getItemId() + "/shipping", Map.class);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not fetch shipping details."));
        }

        Map<String, Object> shippingData = shippingResp.getBody();
        BigDecimal shippingCost = new BigDecimal(shippingData.get("shippingCost").toString());
        BigDecimal expeditedCost = req.isExpedited()
                ? new BigDecimal(shippingData.get("expeditedShippingCost").toString())
                : BigDecimal.ZERO;

        Map<String, Object> payBody = new HashMap<>();
        payBody.put("itemId", req.getItemId());
        payBody.put("userId", userId);
        payBody.put("username", username);
        payBody.put("winnerId", winnerId);
        payBody.put("winningBid", winningBid);
        payBody.put("shippingCost", shippingCost);
        payBody.put("expedited", req.isExpedited());
        payBody.put("expeditedCost", expeditedCost);
        payBody.put("cardNumber", req.getCardNumber());
        payBody.put("cardHolderName", req.getCardHolderName());
        payBody.put("expirationDate", req.getExpirationDate());
        payBody.put("securityCode", req.getSecurityCode());

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(
                    paymentUrl + "/api/payment/process", payBody, Map.class);
            return ResponseEntity.status(resp.getStatusCode()).body(resp.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }
    }
    public ResponseEntity<?> getReceipt(String token, Long itemId) {
        if (!isSessionValid(token)) return unauthorized();
        return restTemplate.getForEntity(paymentUrl + "/api/payment/receipt/" + itemId, Object.class);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private boolean isSessionValid(String token) {
        Map<String, Object> session = validateSession(token);
        return (boolean) session.getOrDefault("valid", false);
    }

    private HttpHeaders bearerHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized. Please sign in."));
    }
}
