package com.yorku.eecs4413.gateway;



import java.math.BigDecimal;

public class GatewayBidRequest {
    private Long itemId;
    private BigDecimal amount;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
