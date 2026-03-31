package com.yorku.eecs4413.gateway;


import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

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

    public ResponseEntity<?> getAddress(String token) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long userId = Long.valueOf(session.get("userId").toString());
        HttpHeaders headers = bearerHeaders(token);
        return restTemplate.exchange(iamUrl + "/api/iam/user/" + userId + "/address",
                HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    public ResponseEntity<?> updateAddress(String token, Map<String, Object> body) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long userId = Long.valueOf(session.get("userId").toString());
        try {
            return restTemplate.exchange(iamUrl + "/api/iam/user/" + userId + "/address",
                    HttpMethod.PUT, new HttpEntity<>(body), Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }
    }

    public ResponseEntity<?> getProfile(String token) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long userId = Long.valueOf(session.get("userId").toString());
        HttpHeaders headers = bearerHeaders(token);
        return restTemplate.exchange(iamUrl + "/api/iam/user/" + userId + "/profile",
                HttpMethod.GET, new HttpEntity<>(headers), Object.class);
    }

    public ResponseEntity<?> updateProfile(String token, Map<String, Object> body) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long userId = Long.valueOf(session.get("userId").toString());
        try {
            return restTemplate.exchange(iamUrl + "/api/iam/user/" + userId + "/profile",
                    HttpMethod.PUT, new HttpEntity<>(body), Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }
    }

    public ResponseEntity<?> changePassword(String token, Map<String, Object> body) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long userId = Long.valueOf(session.get("userId").toString());
        try {
            return restTemplate.exchange(iamUrl + "/api/iam/user/" + userId + "/password",
                    HttpMethod.PUT, new HttpEntity<>(body), Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<?> relistItem(String token, Long itemId, Map<String, Object> body) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();

        try {
            ResponseEntity<Map> itemResp = restTemplate.getForEntity(
                    catalogueUrl + "/api/catalogue/items/" + itemId, Map.class);
            Map<String, Object> item = itemResp.getBody();
            if (item == null) return ResponseEntity.status(404).body(Map.of("error", "Item not found."));
            Long sellerId = Long.valueOf(item.get("sellerId").toString());
            Long userId   = Long.valueOf(session.get("userId").toString());
            if (!sellerId.equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "You can only relist your own items."));
            }
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }

        String newEndTime    = body.get("newEndTime").toString();
        String startingPrice = body.get("startingPrice").toString();

        try {
            Map<String, String> catalogueBody = new HashMap<>();
            catalogueBody.put("newEndTime", newEndTime);
            restTemplate.postForEntity(catalogueUrl + "/api/catalogue/items/" + itemId + "/relist",
                    catalogueBody, Map.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to relist item: " + e.getMessage()));
        }

        try {
            Map<String, Object> auctionBody = new HashMap<>();
            auctionBody.put("newEndTime", newEndTime);
            auctionBody.put("startingPrice", new java.math.BigDecimal(startingPrice));
            restTemplate.postForEntity(auctionUrl + "/api/auction/relist/" + itemId, auctionBody, Map.class);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to reset auction: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Item relisted successfully."));
    }

    // ─── Session Validation (internal) ────────────────────────────

    public Map<String, Object> validateSession(String token) {
        try {
            HttpHeaders headers = bearerHeaders(token);
            ResponseEntity<Map> resp = restTemplate.exchange(
                    iamUrl + "/api/iam/validate", HttpMethod.GET,
                    new HttpEntity<>(headers), Map.class);
            return resp.getBody() != null ? resp.getBody() : Map.of("valid", false);
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

    @SuppressWarnings("unchecked")
    public ResponseEntity<?> addItem(String token, Map<String, Object> body) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long sellerId = session.get("userId") != null ? Long.valueOf(session.get("userId").toString()) : null;

        // Create item in catalogue
        ResponseEntity<Map> itemResp;
        try {
            itemResp = restTemplate.postForEntity(
                    catalogueUrl + "/api/catalogue/items", body, Map.class);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create item: " + e.getMessage()));
        }

        Map<String, Object> item = (Map<String, Object>) itemResp.getBody();
        if (item == null) {
            return ResponseEntity.status(500).body(Map.of("error", "Empty response from catalogue service."));
        }

        Object itemIdObj = item.get("id");
        Object startingPriceObj = body.get("startingPrice");
        Object auctionEndTimeObj = body.get("auctionEndTime");

        // Create matching auction in auction service
        if (itemIdObj != null && startingPriceObj != null && auctionEndTimeObj != null) {
            try {
                Map<String, Object> auctionBody = new HashMap<>();
                auctionBody.put("itemId", Long.valueOf(itemIdObj.toString()));
                auctionBody.put("sellerId", sellerId);
                auctionBody.put("startingPrice", new java.math.BigDecimal(startingPriceObj.toString()));
                auctionBody.put("endTime", auctionEndTimeObj.toString());
                restTemplate.postForEntity(auctionUrl + "/api/auction/create", auctionBody, Map.class);
            } catch (Exception e) {
                System.out.println("Warning: Could not create auction for itemId=" + itemIdObj + ": " + e.getMessage());
            }
        }

        return itemResp;
    }

    @SuppressWarnings("unchecked")
    public ResponseEntity<?> deleteItem(String token, Long itemId) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        try {
            ResponseEntity<Map> itemResp = restTemplate.getForEntity(
                    catalogueUrl + "/api/catalogue/items/" + itemId, Map.class);
            Map<String, Object> item = (Map<String, Object>) itemResp.getBody();
            if (item == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Item not found."));
            }
            Object sellerIdObj = item.get("sellerId");
            Object userIdObj = session.get("userId");
            if (sellerIdObj == null || userIdObj == null) {
                return ResponseEntity.status(500).body(Map.of("error", "Could not verify item ownership."));
            }
            Long sellerId = Long.valueOf(sellerIdObj.toString());
            Long userId = Long.valueOf(userIdObj.toString());
            if (!sellerId.equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "You can only delete your own items."));
            }
            restTemplate.exchange(catalogueUrl + "/api/catalogue/items/" + itemId,
                    HttpMethod.DELETE, new HttpEntity<>(new HttpHeaders()), Map.class);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAs(Map.class));
        }
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
        bidBody.put("userId", Long.valueOf(session.get("userId").toString()));
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

    @SuppressWarnings("unchecked")
    public ResponseEntity<?> getEndedAuctions(String token) {
        if (!isSessionValid(token)) return unauthorized();
        ResponseEntity<List> auctionResp = restTemplate.getForEntity(
                auctionUrl + "/api/auction/ended", List.class);
        List<Map<String, Object>> auctions = auctionResp.getBody();
        if (auctions == null) return ResponseEntity.ok(List.of());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> auction : auctions) {
            Map<String, Object> combined = new HashMap<>(auction);
            Object itemIdObj = auction.get("itemId");
            if (itemIdObj != null) {
                try {
                    ResponseEntity<Map> itemResp = restTemplate.getForEntity(
                            catalogueUrl + "/api/catalogue/items/" + itemIdObj, Map.class);
                    if (itemResp.getBody() != null) combined.put("item", itemResp.getBody());
                } catch (Exception ignored) {}
            }
            result.add(combined);
        }
        return ResponseEntity.ok(result);
    }

    public ResponseEntity<?> getUserBidHistory(String token) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();
        Long userId = Long.valueOf(session.get("userId").toString());
        return restTemplate.getForEntity(auctionUrl + "/api/auction/my-bids/" + userId, Object.class);
    }

    // ─── Payment Facade ───────────────────────────────────────────

    public ResponseEntity<?> processPayment(String token, GatewayPaymentRequest req) {
        Map<String, Object> session = validateSession(token);
        if (!(boolean) session.getOrDefault("valid", false)) return unauthorized();

        Object userIdObj = session.get("userId");
        Object usernameObj = session.get("username");
        if (userIdObj == null || usernameObj == null) {
            return ResponseEntity.status(500).body(Map.of("error", "Session data incomplete."));
        }
        Long userId = Long.valueOf(userIdObj.toString());
        String username = usernameObj.toString();

        // Fetch buyer address from IAM
        Map<String, Object> addressData = new HashMap<>();
        try {
            ResponseEntity<Map> addressResp = restTemplate.exchange(
                    iamUrl + "/api/iam/user/" + userId + "/address", HttpMethod.GET,
                    new HttpEntity<>(bearerHeaders(token)), Map.class);
            if (addressResp.getBody() != null) {
                addressData = addressResp.getBody();
            }
        } catch (Exception e) {
            System.out.println("Warning: Could not fetch address for userId=" + userId);
        }

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
        Map<String, Object> shippingData;
        try {
            ResponseEntity<Map> shippingResp = restTemplate.getForEntity(
                    catalogueUrl + "/api/catalogue/items/" + req.getItemId() + "/shipping", Map.class);
            shippingData = shippingResp.getBody();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not fetch shipping details."));
        }
        if (shippingData == null || shippingData.get("shippingCost") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Shipping cost unavailable."));
        }
        BigDecimal shippingCost = new BigDecimal(shippingData.get("shippingCost").toString());
        BigDecimal expeditedCost = req.isExpedited() && shippingData.get("expeditedShippingCost") != null
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
        payBody.put("shippingAddress", addressData);

        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(
                    paymentUrl + "/api/payment/process", payBody, Map.class);

            // If payment was successful, close the auction and mark item as SOLD
            if (resp.getStatusCode().is2xxSuccessful()) {
                // Close the auction
                try {
                    restTemplate.postForEntity(
                        auctionUrl + "/api/auction/close/" + req.getItemId(),
                        null, Map.class);
                } catch (Exception e) {
                    System.out.println("Warning: Could not close auction for itemId=" + req.getItemId());
                }

                // Mark item as SOLD in catalogue
                try {
                    restTemplate.postForEntity(
                        catalogueUrl + "/api/catalogue/items/" + req.getItemId() + "/sold",
                        null, Map.class);
                } catch (Exception e) {
                    System.out.println("Warning: Could not mark item as SOLD for itemId=" + req.getItemId());
                }
            }

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
