package com.yorku.eecs4413.catalogue.item;

import com.yorku.eecs4413.catalogue.item.dto.CreateItemRequest;
import com.yorku.eecs4413.catalogue.item.dto.UpdateItemRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ItemService {

    private final ItemRepository repo;

    public ItemService(ItemRepository repo) {
        this.repo = repo;
    }

    public Item create(CreateItemRequest req) {
        if (!req.endTime().isAfter(req.startTime())) {
            throw new IllegalArgumentException("endTime must be after startTime");
        }
        if (req.startTime().isBefore(Instant.now().minusSeconds(60))) {
            // keep simple; you can relax this rule
            throw new IllegalArgumentException("startTime cannot be in the past");
        }

        Item item = new Item();
        item.setTitle(req.title());
        item.setDescription(req.description());
        item.setCategory(req.category());
        item.setStartPrice(req.startPrice());
        item.setCurrentPrice(req.startPrice());
        item.setStartTime(req.startTime());
        item.setEndTime(req.endTime());
        item.setSellerId(req.sellerId());
        item.setStatus(ItemStatus.ACTIVE);

        return repo.save(item);
    }

    public Item get(UUID id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Item not found"));
    }

    public Page<Item> listActive(Pageable pageable) {
        return repo.findByStatus(ItemStatus.ACTIVE, pageable);
    }

    public Page<Item> searchActive(String keyword, Pageable pageable) {
        return repo.findByStatusAndTitleContainingIgnoreCase(ItemStatus.ACTIVE, keyword, pageable);
    }

    public Page<Item> listActiveByCategory(String category, Pageable pageable) {
        return repo.findByStatusAndCategoryIgnoreCase(ItemStatus.ACTIVE, category, pageable);
    }

    public Item update(UUID id, UpdateItemRequest req) {
        Item item = get(id);
        if (item.getStatus() != ItemStatus.ACTIVE) {
            throw new IllegalStateException("Cannot update an ended item");
        }
        item.setTitle(req.title());
        item.setDescription(req.description());
        item.setCategory(req.category());
        item.setEndTime(req.endTime());
        return repo.save(item);
    }

    public void end(UUID id) {
        Item item = get(id);
        item.setStatus(ItemStatus.ENDED);
        repo.save(item);
    }
}