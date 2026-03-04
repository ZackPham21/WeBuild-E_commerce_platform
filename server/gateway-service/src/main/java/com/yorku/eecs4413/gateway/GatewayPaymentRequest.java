package com.yorku.eecs4413.gateway;


import java.math.BigDecimal;

public class GatewayPaymentRequest {
    private Long itemId;
    private boolean expedited;
    private String cardNumber;
    private String cardHolderName;
    private String expirationDate;
    private String securityCode;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public boolean isExpedited() { return expedited; }
    public void setExpedited(boolean expedited) { this.expedited = expedited; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getCardHolderName() { return cardHolderName; }
    public void setCardHolderName(String cardHolderName) { this.cardHolderName = cardHolderName; }

    public String getExpirationDate() { return expirationDate; }
    public void setExpirationDate(String expirationDate) { this.expirationDate = expirationDate; }

    public String getSecurityCode() { return securityCode; }
    public void setSecurityCode(String securityCode) { this.securityCode = securityCode; }
}
