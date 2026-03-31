package com.yorku.eecs4413.catalogue;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AddItemRequest {
    private String name;
    private String description;
    private String category;
    private BigDecimal startingPrice;
    private Long sellerId;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime auctionStartTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime auctionEndTime;

    private Integer shippingDays;
    private BigDecimal shippingCost;
    private BigDecimal expeditedShippingCost;
    private String imageUrl;
    private String condition;

    // all getters and setters unchanged
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getStartingPrice() { return startingPrice; }
    public void setStartingPrice(BigDecimal startingPrice) { this.startingPrice = startingPrice; }

    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }

    public LocalDateTime getAuctionStartTime() { return auctionStartTime; }
    public void setAuctionStartTime(LocalDateTime auctionStartTime) { this.auctionStartTime = auctionStartTime; }

    public LocalDateTime getAuctionEndTime() { return auctionEndTime; }
    public void setAuctionEndTime(LocalDateTime auctionEndTime) { this.auctionEndTime = auctionEndTime; }

    public Integer getShippingDays() { return shippingDays; }
    public void setShippingDays(Integer shippingDays) { this.shippingDays = shippingDays; }

    public BigDecimal getShippingCost() { return shippingCost; }
    public void setShippingCost(BigDecimal shippingCost) { this.shippingCost = shippingCost; }

    public BigDecimal getExpeditedShippingCost() { return expeditedShippingCost; }
    public void setExpeditedShippingCost(BigDecimal expeditedShippingCost) { this.expeditedShippingCost = expeditedShippingCost; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
}