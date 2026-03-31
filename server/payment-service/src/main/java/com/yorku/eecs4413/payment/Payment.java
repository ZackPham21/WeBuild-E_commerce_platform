package com.yorku.eecs4413.payment;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long itemId;

    @Column(nullable = false)
    private Long winnerId;

    private String winnerUsername;

    @Column(nullable = false)
    private BigDecimal winningBid;

    @Column(nullable = false)
    private BigDecimal shippingCost;

    private boolean expedited;
    private BigDecimal expeditedCost;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    // Masked card info only - never store full card number
    private String maskedCardNumber;
    private String cardHolderName;
    private String expirationDate;

    @Column(length = 1000)
    private String shippingAddress;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private LocalDateTime processedAt;

    public enum PaymentStatus {
        SUCCESS, FAILED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public Long getWinnerId() { return winnerId; }
    public void setWinnerId(Long winnerId) { this.winnerId = winnerId; }

    public String getWinnerUsername() { return winnerUsername; }
    public void setWinnerUsername(String winnerUsername) { this.winnerUsername = winnerUsername; }

    public BigDecimal getWinningBid() { return winningBid; }
    public void setWinningBid(BigDecimal winningBid) { this.winningBid = winningBid; }

    public BigDecimal getShippingCost() { return shippingCost; }
    public void setShippingCost(BigDecimal shippingCost) { this.shippingCost = shippingCost; }

    public boolean isExpedited() { return expedited; }
    public void setExpedited(boolean expedited) { this.expedited = expedited; }

    public BigDecimal getExpeditedCost() { return expeditedCost; }
    public void setExpeditedCost(BigDecimal expeditedCost) { this.expeditedCost = expeditedCost; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getMaskedCardNumber() { return maskedCardNumber; }
    public void setMaskedCardNumber(String maskedCardNumber) { this.maskedCardNumber = maskedCardNumber; }

    public String getCardHolderName() { return cardHolderName; }
    public void setCardHolderName(String cardHolderName) { this.cardHolderName = cardHolderName; }

    public String getExpirationDate() { return expirationDate; }
    public void setExpirationDate(String expirationDate) { this.expirationDate = expirationDate; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}
