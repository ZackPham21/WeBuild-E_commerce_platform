package com.yorku.eecs4413.catalogue.item;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, UUID> {

    Page<Item> findByStatus(ItemStatus status, Pageable pageable);

    Page<Item> findByStatusAndTitleContainingIgnoreCase(
            ItemStatus status, String keyword, Pageable pageable);

    Page<Item> findByStatusAndCategoryIgnoreCase(
            ItemStatus status, String category, Pageable pageable);
}