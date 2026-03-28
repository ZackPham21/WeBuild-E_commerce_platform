package com.yorku.eecs4413.auction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class AuctionService {

    @Autowired
    private AuctionRepository auctionRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private BidRepository bidRepository;

    public Auction createAuction(CreateAuctionRequest req) {
        Auction auction = new Auction();
        auction.setItemId(req.getItemId());
        auction.setCurrentHighestBid(req.getStartingPrice());
        auction.setEndTime(req.getEndTime());
        auction.setStatus(Auction.AuctionStatus.OPEN);
        return auctionRepository.save(auction);
    }

    public Map<String, Object> placeBid(PlaceBidRequest req) {
        Optional<Auction> optAuction = auctionRepository.findByItemId(req.getItemId());

        if (optAuction.isEmpty()) {
            return Map.of("success", false, "reason", "AUCTION_NOT_FOUND",
                    "message", "Auction not found for this item.");
        }

        Auction auction = optAuction.get();

        // Check auction is still open
        if (auction.getStatus() == Auction.AuctionStatus.CLOSED ||
                LocalDateTime.now().isAfter(auction.getEndTime())) {
            auction.setStatus(Auction.AuctionStatus.CLOSED);
            auctionRepository.save(auction);
            return Map.of("success", false, "reason", "FAIL_AUCTION_ENDED",
                    "message", "This auction has ended.");
        }

        // Validate bid is strictly greater (integer)
        BigDecimal newBid = req.getAmount();
        if (newBid.stripTrailingZeros().scale() > 0) {
            return Map.of("success", false, "reason", "FAIL_NOT_INTEGER",
                    "message", "Bid amount must be a whole integer.");
        }
        if (newBid.compareTo(auction.getCurrentHighestBid()) <= 0) {
            return Map.of("success", false, "reason", "FAIL_BID_TOO_LOW",
                    "currentHighestBid", auction.getCurrentHighestBid(),
                    "highestBidderId", auction.getHighestBidderId(),
                    "message", "Your bid must be greater than the current highest bid of $"
                            + auction.getCurrentHighestBid() + ".");
        }

        // Record bid
        Bid bid = new Bid();
        bid.setAuctionId(auction.getId());
        bid.setUserId(req.getUserId());
        bid.setUsername(req.getUsername());
        bid.setAmount(newBid);
        bid.setTimestamp(LocalDateTime.now());
        bidRepository.save(bid);

        // Update auction
        auction.setCurrentHighestBid(newBid);
        auction.setHighestBidderId(req.getUserId());
        auction.setHighestBidderUsername(req.getUsername());
        auctionRepository.save(auction);

        long secondsRemaining = java.time.Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds();

        // Broadcast bid update to all browsers watching this auction
        messagingTemplate.convertAndSend(
                "/topic/auction/" + req.getItemId(),
                Map.of(
                        "itemId", req.getItemId(),
                        "newHighestBid", newBid,
                        "newHighestBidderUsername", req.getUsername(),
                        "secondsRemaining", secondsRemaining
                )
        );

        return Map.of(
                "success", true,
                "reason", "SUCCESS",
                "newHighestBid", newBid,
                "newHighestBidderId", req.getUserId(),
                "newHighestBidderUsername", req.getUsername(),
                "timeRemaining", secondsRemaining
        );
    }

    public Map<String, Object> getAuctionState(Long itemId) {
        return auctionRepository.findByItemId(itemId).map(auction -> {
            long secondsRemaining = Math.max(0,
                    java.time.Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds());
            return Map.<String, Object>of(
                    "itemId", itemId,
                    "auctionId", auction.getId(),
                    "currentHighestBid", auction.getCurrentHighestBid(),
                    "highestBidderId", auction.getHighestBidderId() != null ? auction.getHighestBidderId() : "none",
                    "highestBidderUsername", auction.getHighestBidderUsername() != null ? auction.getHighestBidderUsername() : "none",
                    "endTime", auction.getEndTime(),
                    "status", auction.getStatus(),
                    "secondsRemaining", secondsRemaining
            );
        }).orElse(Map.of("error", "Auction not found for item " + itemId));
    }

    public Map<String, Object> getWinner(Long itemId) {
        return auctionRepository.findByItemId(itemId).map(auction -> {
            if (auction.getStatus() != Auction.AuctionStatus.CLOSED &&
                    LocalDateTime.now().isBefore(auction.getEndTime())) {
                return Map.<String, Object>of("error", "Auction is still ongoing.");
            }
            return Map.<String, Object>of(
                    "itemId", itemId,
                    "winnerUserId", auction.getHighestBidderId() != null ? auction.getHighestBidderId() : "NO_WINNER",
                    "winnerUsername", auction.getHighestBidderUsername() != null ? auction.getHighestBidderUsername() : "NO_WINNER",
                    "winningBid", auction.getCurrentHighestBid(),
                    "status", "CLOSED"
            );
        }).orElse(Map.of("error", "Auction not found"));
    }

    public List<Bid> getBidHistory(Long itemId) {
        return auctionRepository.findByItemId(itemId)
                .map(auction -> bidRepository.findByAuctionIdOrderByAmountDesc(auction.getId()))
                .orElse(List.of());
    }

    // Scheduled task: automatically close auctions when timer expires
    @Scheduled(fixedDelay = 10000) // runs every 10 seconds
    public void closeExpiredAuctions() {
        List<Auction> openAuctions = auctionRepository.findAll().stream()
                .filter(a -> a.getStatus() == Auction.AuctionStatus.OPEN)
                .filter(a -> LocalDateTime.now().isAfter(a.getEndTime()))
                .toList();

        for (Auction auction : openAuctions) {
            auction.setStatus(Auction.AuctionStatus.CLOSED);
            auctionRepository.save(auction);
            System.out.println("Auction closed for itemId=" + auction.getItemId()
                    + ", winner=" + auction.getHighestBidderUsername());
        }
    }

    public Map<String, Object> closeAuction(Long itemId) {
        return auctionRepository.findByItemId(itemId).map(auction -> {
            auction.setStatus(Auction.AuctionStatus.CLOSED);
            auctionRepository.save(auction);
            return Map.<String, Object>of("success", true, "message", "Auction closed.");
        }).orElse(Map.of("success", false, "message", "Auction not found."));
    }
}