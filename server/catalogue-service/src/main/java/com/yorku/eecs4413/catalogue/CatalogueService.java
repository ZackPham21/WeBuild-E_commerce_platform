package com.yorku.eecs4413.catalogue;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogueService {

    @Autowired
    private ItemRepository itemRepository;

    @Transactional
    public Item addItem(AddItemRequest req) {
        Item item = new Item();
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setCategory(req.getCategory());
        item.setStartingPrice(req.getStartingPrice());
        item.setSellerId(req.getSellerId());
        item.setAuctionStartTime(req.getAuctionStartTime());
        item.setAuctionEndTime(req.getAuctionEndTime());
        item.setShippingDays(req.getShippingDays());
        item.setShippingCost(req.getShippingCost());
        item.setExpeditedShippingCost(req.getExpeditedShippingCost());
        item.setStatus(Item.ItemStatus.ACTIVE); // ← this line is critical
        return itemRepository.save(item);
    }

    @Transactional
    public List<Item> getAllActiveItems() {
        // Auto-expire any ACTIVE items whose auction end time has passed
        List<Item> expired = itemRepository.findByStatusAndAuctionEndTimeBefore(
                Item.ItemStatus.ACTIVE, LocalDateTime.now());
        if (!expired.isEmpty()) {
            expired.forEach(item -> item.setStatus(Item.ItemStatus.ENDED));
            itemRepository.saveAll(expired);
        }
        return itemRepository.findByStatus(Item.ItemStatus.ACTIVE);
    }

    public List<Item> searchByKeyword(String keyword) {
        return itemRepository.searchByKeyword(keyword);
    }

    public List<Item> filterByCategory(String category) {
        return itemRepository.findByCategoryAndStatus(category, Item.ItemStatus.ACTIVE);
    }

    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    public Map<String, Object> getShippingDetails(Long itemId) {
        return itemRepository.findById(itemId).map(item -> Map.<String, Object>of(
                "itemId", item.getId(),
                "shippingDays", item.getShippingDays(),
                "shippingCost", item.getShippingCost(),
                "expeditedShippingCost", item.getExpeditedShippingCost()
        )).orElse(Map.of("error", "Item not found"));
    }

    @Transactional
    public boolean removeItem(Long itemId) {
        if (itemRepository.existsById(itemId)) {
            itemRepository.deleteById(itemId);
            return true;
        }
        return false;
    }

    @Transactional
    public Item markItemEnded(Long itemId) {
        return itemRepository.findById(itemId).map(item -> {
            item.setStatus(Item.ItemStatus.ENDED);
            return itemRepository.save(item);
        }).orElse(null);
    }

    @Transactional
    public Map<String, Object> markAsSold(Long itemId) {
        return itemRepository.findById(itemId).map(item -> {
            item.setStatus(Item.ItemStatus.SOLD);
            itemRepository.save(item);
            return Map.<String, Object>of("success", true, "message", "Item marked as SOLD.");
        }).orElse(Map.of("success", false, "message", "Item not found."));
    }
}
