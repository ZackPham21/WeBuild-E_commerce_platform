package com.yorku.eecs4413.auction;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auction")
public class AuctionController {

    @Autowired
    private AuctionService auctionService;

    @PostMapping("/create")
    public ResponseEntity<?> createAuction(@RequestBody CreateAuctionRequest req) {
        return ResponseEntity.ok(auctionService.createAuction(req));
    }

    @PostMapping("/bid")
    public ResponseEntity<Map<String, Object>> placeBid(@RequestBody PlaceBidRequest req) {
        Map<String, Object> result = auctionService.placeBid(req);
        boolean success = (boolean) result.get("success");
        return success ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/state/{itemId}")
    public ResponseEntity<Map<String, Object>> getAuctionState(@PathVariable Long itemId) {
        return ResponseEntity.ok(auctionService.getAuctionState(itemId));
    }

    @GetMapping("/winner/{itemId}")
    public ResponseEntity<Map<String, Object>> getWinner(@PathVariable Long itemId) {
        return ResponseEntity.ok(auctionService.getWinner(itemId));
    }

    @GetMapping("/bids/{itemId}")
    public ResponseEntity<List<Bid>> getBidHistory(@PathVariable Long itemId) {
        return ResponseEntity.ok(auctionService.getBidHistory(itemId));
    }

    @GetMapping("/ended")
    public ResponseEntity<?> getEndedAuctions() {
        return ResponseEntity.ok(auctionService.getEndedAuctions());
    }

    @GetMapping("/my-bids/{userId}")
    public ResponseEntity<?> getUserBidHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(auctionService.getUserBidHistory(userId));
    }

    @PostMapping("/close/{itemId}")
    public ResponseEntity<?> closeAuction(@PathVariable Long itemId) {
        return ResponseEntity.ok(auctionService.closeAuction(itemId));
    }
}