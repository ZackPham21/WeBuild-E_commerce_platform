package com.yorku.eecs4413.auction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuctionService {

    @Autowired
    private AuctionRepository auctionRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private BidRepository bidRepository;

    @Value("${iam.session.expiry.hours:24}")
    private int sessionExpiryHours;

    public Auction createAuction(CreateAuctionRequest req) {
        Auction auction = new Auction();
        auction.setItemId(req.getItemId());
        auction.setSellerId(req.getSellerId());
        auction.setCurrentHighestBid(req.getStartingPrice());
        auction.setEndTime(req.getParsedEndTime());
        auction.setStatus(Auction.AuctionStatus.OPEN);
        return auctionRepository.save(auction);
    }

    @Transactional
    public Map<String, Object> placeBid(PlaceBidRequest req) {
        // Pessimistic write lock prevents two concurrent bids from both passing
        Optional<Auction> optAuction = auctionRepository.findByItemIdForUpdate(req.getItemId());

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

        // Prevent the seller from bidding on their own auction
        if (auction.getSellerId() != null && req.getUserId() != null &&
                auction.getSellerId().toString().equals(req.getUserId().toString())) {
            return Map.of("success", false, "reason", "FAIL_SELLER_BID",
                    "message", "You cannot bid on your own auction.");
        }

        // Prevent the current highest bidder from raising their own bid
        // Use toString comparison to avoid Long vs Integer type mismatch
        if (auction.getHighestBidderId() != null && req.getUserId() != null &&
                auction.getHighestBidderId().toString().equals(req.getUserId().toString())) {
            return Map.of("success", false, "reason", "FAIL_ALREADY_WINNING",
                    "currentHighestBid", auction.getCurrentHighestBid(),
                    "message", "You are already the highest bidder. Wait for someone else to outbid you.");
        }

        // Validate bid amount
        BigDecimal newBid = req.getAmount();
        if (newBid == null) {
            return Map.of("success", false, "reason", "FAIL_INVALID_BID",
                    "message", "Bid amount is required.");
        }
        if (newBid.stripTrailingZeros().scale() > 0) {
            return Map.of("success", false, "reason", "FAIL_NOT_INTEGER",
                    "message", "Bid amount must be a whole integer.");
        }
        boolean hasBids = auction.getHighestBidderId() != null;
        boolean tooLow = hasBids
                ? newBid.compareTo(auction.getCurrentHighestBid()) <= 0   // must beat existing bid
                : newBid.compareTo(auction.getCurrentHighestBid()) < 0;   // must meet starting price

        if (tooLow) {
            return Map.of("success", false, "reason", "FAIL_BID_TOO_LOW",
                    "currentHighestBid", auction.getCurrentHighestBid(),
                    "highestBidderId", auction.getHighestBidderId() != null ? auction.getHighestBidderId() : "none",
                    "message", hasBids
                            ? "Your bid must be greater than the current highest bid of $" + auction.getCurrentHighestBid() + "."
                            : "Your bid must be at least the starting price of $" + auction.getCurrentHighestBid() + ".");
        }

        // Record bid and update auction atomically (same transaction)
        Bid bid = new Bid();
        bid.setAuctionId(auction.getId());
        bid.setUserId(req.getUserId());
        bid.setUsername(req.getUsername());
        bid.setAmount(newBid);
        bid.setTimestamp(LocalDateTime.now());
        bidRepository.save(bid);

        auction.setCurrentHighestBid(newBid);
        auction.setHighestBidderId(req.getUserId());
        auction.setHighestBidderUsername(req.getUsername());
        auctionRepository.save(auction);

        long secsLeft = java.time.Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds();
        if (secsLeft < 60) {
            auction.setEndTime(auction.getEndTime().plusSeconds(60 - secsLeft));
            auctionRepository.save(auction);
        }

        long secondsRemaining = java.time.Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds();

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

    @Scheduled(fixedDelayString = "${auction.close.interval.ms:10000}")
    @Transactional
    public void closeExpiredAuctions() {
        List<Auction> expired = auctionRepository.findExpiredOpenAuctions(LocalDateTime.now());
        for (Auction auction : expired) {
            auction.setStatus(Auction.AuctionStatus.CLOSED);
            auctionRepository.save(auction);
            System.out.println("[Scheduler] Closed auction for itemId=" + auction.getItemId()
                    + ", winner=" + auction.getHighestBidderUsername());
        }
    }

    public List<Map<String, Object>> getEndedAuctions() {
        return auctionRepository.findByStatusOrderByEndTimeDesc(Auction.AuctionStatus.CLOSED)
                .stream()
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("itemId", a.getItemId());
                    m.put("auctionId", a.getId());
                    m.put("finalBid", a.getCurrentHighestBid());
                    m.put("winnerId", a.getHighestBidderId() != null ? a.getHighestBidderId() : "none");
                    m.put("winnerUsername", a.getHighestBidderUsername() != null ? a.getHighestBidderUsername() : "none");
                    m.put("endTime", a.getEndTime());
                    return m;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getUserBidHistory(Long userId) {
        return bidRepository.findByUserIdOrderByTimestampDesc(userId)
                .stream()
                .map(bid -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("bidId", bid.getId());
                    m.put("amount", bid.getAmount());
                    m.put("timestamp", bid.getTimestamp());
                    auctionRepository.findById(bid.getAuctionId()).ifPresent(auction -> {
                        m.put("itemId", auction.getItemId());
                        m.put("auctionStatus", auction.getStatus());
                        m.put("finalBid", auction.getCurrentHighestBid());
                        boolean isWinner = auction.getHighestBidderId() != null
                                && auction.getHighestBidderId().toString().equals(userId.toString())
                                && auction.getStatus() == Auction.AuctionStatus.CLOSED;
                        m.put("won", isWinner);
                    });
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> relistAuction(Long itemId, String newEndTime, BigDecimal startingPrice) {
        Optional<Auction> optAuction = auctionRepository.findByItemId(itemId);
        Auction auction = optAuction.orElse(new Auction());
        auction.setItemId(itemId);
        auction.setEndTime(LocalDateTime.parse(newEndTime));
        auction.setCurrentHighestBid(startingPrice);
        auction.setHighestBidderId(null);
        auction.setHighestBidderUsername(null);
        auction.setStatus(Auction.AuctionStatus.OPEN);
        auctionRepository.save(auction);
        return Map.of("success", true, "message", "Auction relisted.");
    }

    @Transactional
    public Map<String, Object> closeAuction(Long itemId) {
        return auctionRepository.findByItemId(itemId).map(auction -> {
            auction.setStatus(Auction.AuctionStatus.CLOSED);
            auctionRepository.save(auction);
            return Map.<String, Object>of("success", true, "message", "Auction closed.");
        }).orElse(Map.of("success", false, "message", "Auction not found."));
    }
}
