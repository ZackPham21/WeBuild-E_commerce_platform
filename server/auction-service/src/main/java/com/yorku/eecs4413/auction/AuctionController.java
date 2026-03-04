package com.yorku.eecs4413.auction;



import com.yorku.eecs4413.auction.CreateAuctionRequest;
import com.yorku.eecs4413.auction.PlaceBidRequest;
import com.yorku.eecs4413.auction.Bid;
import com.yorku.eecs4413.auction.AuctionService;
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
}
