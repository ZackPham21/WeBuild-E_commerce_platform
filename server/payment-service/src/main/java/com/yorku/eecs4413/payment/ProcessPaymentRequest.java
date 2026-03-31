package com.yorku.eecs4413.payment;

import java.math.BigDecimal;

public class ProcessPaymentRequest {
    private Long itemId;
    private Long userId;
    private String username;
    private Long winnerId;
    private BigDecimal winningBid;
    private BigDecimal shippingCost;
    private boolean expedited;
    private BigDecimal expeditedCost;

    private String cardNumber;
    private String cardHolderName;
    private String expirationDate;
    private String securityCode;

    private java.util.Map<String, Object> shippingAddress;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Long getWinnerId() { return winnerId; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }

    public BigDecimal getWinningBid() { return winningBid; }
    public void setWinningBid(BigDecimal winningBid) { this.winningBid = winningBid; }

    public BigDecimal getShippingCost() { return shippingCost; }
    public void setShippingCost(BigDecimal shippingCost) { this.shippingCost = shippingCost; }

    public boolean isExpedited() { return expedited; }
    public void setExpedited(boolean expedited) { this.expedited = expedited; }

    public BigDecimal getExpeditedCost() { return expeditedCost; }
    public void setExpeditedCost(BigDecimal expeditedCost) { this.expeditedCost = expeditedCost; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getCardHolderName() { return cardHolderName; }
    public void setCardHolderName(String cardHolderName) { this.cardHolderName = cardHolderName; }

    public String getExpirationDate() { return expirationDate; }
    public void setExpirationDate(String expirationDate) { this.expirationDate = expirationDate; }

    public String getSecurityCode() { return securityCode; }
    public void setSecurityCode(String securityCode) { this.securityCode = securityCode; }

    public java.util.Map<String, Object> getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(java.util.Map<String, Object> shippingAddress) { this.shippingAddress = shippingAddress; }
}
