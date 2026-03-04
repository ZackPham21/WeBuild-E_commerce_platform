package com.yorku.eecs4413.catalogue.item.dto;

import java.time.Instant;
import java.util.UUID;

import com.yorku.eecs4413.catalogue.item.Item;
import com.yorku.eecs4413.catalogue.item.ItemStatus;

public record ItemResponse(
        UUID id,
        String title,
        String description,
        String category,
        Integer startPrice,
        Integer currentPrice,
        Instant startTime,
        Instant endTime,
        ItemStatus status,
        UUID sellerId
) {
    public static ItemResponse from(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getCategory(),
                item.getStartPrice(),
                item.getCurrentPrice(),
                item.getStartTime(),
                item.getEndTime(),
                item.getStatus(),
                item.getSellerId()
        );
    }
}