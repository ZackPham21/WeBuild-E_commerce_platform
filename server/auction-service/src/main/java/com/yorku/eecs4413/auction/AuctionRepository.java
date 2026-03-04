package com.yorku.eecs4413.auction;



import com.yorku.eecs4413.auction.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    Optional<Auction> findByItemId(Long itemId);
}