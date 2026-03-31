package com.yorku.eecs4413.catalogue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalogue")
public class CatalogueController {

    @Autowired
    private CatalogueService catalogueService;

    @PostMapping("/items")
    public ResponseEntity<Item> addItem(@RequestBody AddItemRequest req) {
        return ResponseEntity.ok(catalogueService.addItem(req));
    }

    @GetMapping("/items")
    public ResponseEntity<List<Item>> getActiveItems() {
        return ResponseEntity.ok(catalogueService.getAllActiveItems());
    }

    @GetMapping("/items/search")
    public ResponseEntity<List<Item>> searchItems(@RequestParam String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(catalogueService.searchByKeyword(keyword));
    }
    @GetMapping("/items/seller/{sellerId}")
    public ResponseEntity<List<Item>> getItemsBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(catalogueService.getItemsBySeller(sellerId));
    }
    @GetMapping("/items/category/{category}")
    public ResponseEntity<List<Item>> filterByCategory(@PathVariable String category) {
        return ResponseEntity.ok(catalogueService.filterByCategory(category));
    }

    @GetMapping("/items/{itemId}")
    public ResponseEntity<?> getItem(@PathVariable Long itemId) {
        return catalogueService.getItemById(itemId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("error", "Item not found")));
    }

    @GetMapping("/items/{itemId}/shipping")
    public ResponseEntity<Map<String, Object>> getShipping(@PathVariable Long itemId) {
        return ResponseEntity.ok(catalogueService.getShippingDetails(itemId));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Map<String, Object>> removeItem(@PathVariable Long itemId) {
        boolean removed = catalogueService.removeItem(itemId);
        return removed
                ? ResponseEntity.ok(Map.of("success", true))
                : ResponseEntity.status(404).body(Map.of("error", "Item not found"));
    }

    @PutMapping("/items/{itemId}/end")
    public ResponseEntity<?> markEnded(@PathVariable Long itemId) {
        Item item = catalogueService.markItemEnded(itemId);
        return item != null ? ResponseEntity.ok(item) : ResponseEntity.status(404).body(Map.of("error", "Item not found"));
    }

    @PostMapping("/items/{itemId}/relist")
    public ResponseEntity<?> relistItem(@PathVariable Long itemId, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(catalogueService.relistItem(itemId, body.get("newEndTime")));
    }

    @PostMapping("/items/{itemId}/sold")
    public ResponseEntity<?> markAsSold(@PathVariable Long itemId) {
        return ResponseEntity.ok(catalogueService.markAsSold(itemId));
    }
}