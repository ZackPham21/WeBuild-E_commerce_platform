package com.yorku.eecs4413.auction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateAuctionRequest {
    private Long itemId;
    private BigDecimal startingPrice;
    private LocalDateTime endTime;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public BigDecimal getStartingPrice() { return startingPrice; }
    public void setStartingPrice(BigDecimal startingPrice) { this.startingPrice = startingPrice; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
}