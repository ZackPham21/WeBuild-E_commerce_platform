package com.yorku.eecs4413.auction;


import java.math.BigDecimal;

public class PlaceBidRequest {
    private Long itemId;
    private Long userId;
    private String username;
    private BigDecimal amount;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
