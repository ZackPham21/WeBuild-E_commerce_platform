package com.yorku.eecs4413.catalogue.item.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateItemRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 2000) String description,
        @NotBlank @Size(max = 80) String category,
        @NotNull @Min(1) Integer startPrice,
        @NotNull Instant startTime,
        @NotNull Instant endTime,
        @NotNull UUID sellerId
) {}