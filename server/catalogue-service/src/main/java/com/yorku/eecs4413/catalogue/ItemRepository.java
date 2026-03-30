package com.yorku.eecs4413.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByStatus(Item.ItemStatus status);

    List<Item> findByCategoryAndStatus(String category, Item.ItemStatus status);
    List<Item> findBySellerId(Long sellerId);
    @Query("SELECT i FROM Item i WHERE " +
            "(LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND i.status = 'ACTIVE'")
    List<Item> searchByKeyword(@Param("keyword") String keyword);

    // For auto-expiring items whose auction time has passed
    List<Item> findByStatusAndAuctionEndTimeBefore(Item.ItemStatus status, LocalDateTime time);
}
