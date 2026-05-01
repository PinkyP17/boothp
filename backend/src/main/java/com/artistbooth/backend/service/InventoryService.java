package com.artistbooth.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.artistbooth.backend.dto.InventoryItemRequest;
import com.artistbooth.backend.entity.InventoryItem;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.repository.InventoryItemRepository;
import com.artistbooth.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final UserRepository userRepository;

    public List<InventoryItem> getAll(Long userId) {
        return inventoryItemRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public InventoryItem create(Long userId, InventoryItemRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        InventoryItem item = new InventoryItem();
        item.setUser(user);
        item.setName(req.getName());
        item.setCategory(req.getCategory());
        item.setProductionCost(req.getProductionCost());
        item.setSellingPrice(req.getSellingPrice());
        item.setStock(req.getStock());

        return inventoryItemRepository.save(item);
    }

    public InventoryItem update(Long userId, Long itemId, InventoryItemRequest req) {
        InventoryItem item = inventoryItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        item.setName(req.getName());
        item.setCategory(req.getCategory());
        item.setProductionCost(req.getProductionCost());
        item.setSellingPrice(req.getSellingPrice());
        item.setStock(req.getStock());

        return inventoryItemRepository.save(item);
    }
}
