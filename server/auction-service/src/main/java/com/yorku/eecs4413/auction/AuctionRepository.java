package com.yorku.eecs4413.auction;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuctionRepository extends JpaRepository<Auction, Long> {

    Optional<Auction> findByItemId(Long itemId);

    // Pessimistic write lock — prevents concurrent bids from racing
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Auction a WHERE a.itemId = :itemId")
    Optional<Auction> findByItemIdForUpdate(@Param("itemId") Long itemId);

    // Efficient query — avoids loading all auctions into memory
    @Query("SELECT a FROM Auction a WHERE a.status = 'OPEN' AND a.endTime < :now")
    List<Auction> findExpiredOpenAuctions(@Param("now") LocalDateTime now);

    List<Auction> findByStatusOrderByEndTimeDesc(Auction.AuctionStatus status);
}
