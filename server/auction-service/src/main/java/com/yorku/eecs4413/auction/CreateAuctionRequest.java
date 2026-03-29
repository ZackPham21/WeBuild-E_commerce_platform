package com.yorku.eecs4413.auction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateAuctionRequest {
    private Long itemId;
    private BigDecimal startingPrice;
    private String endTime;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public BigDecimal getStartingPrice() { return startingPrice; }
    public void setStartingPrice(BigDecimal startingPrice) { this.startingPrice = startingPrice; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public LocalDateTime getParsedEndTime() {
        if (endTime == null) return null;
        // Strip trailing Z if present, then parse as LocalDateTime
        return LocalDateTime.parse(endTime.replace("Z", ""));
    }
}