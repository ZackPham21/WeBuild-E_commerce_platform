package com.yorku.eecs4413.auction;


public class BidUpdateMessage {
    private Long itemId;
    private double newHighestBid;
    private String newHighestBidderUsername;
    private long secondsRemaining;

    public BidUpdateMessage(Long itemId, double newHighestBid,
                            String newHighestBidderUsername, long secondsRemaining) {
        this.itemId = itemId;
        this.newHighestBid = newHighestBid;
        this.newHighestBidderUsername = newHighestBidderUsername;
        this.secondsRemaining = secondsRemaining;
    }

    // Getters
    public Long getItemId() { return itemId; }
    public double getNewHighestBid() { return newHighestBid; }
    public String getNewHighestBidderUsername() { return newHighestBidderUsername; }
    public long getSecondsRemaining() { return secondsRemaining; }
}
