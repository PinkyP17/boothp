package com.artistbooth.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.artistbooth.backend.dto.InventoryItemRequest;
import com.artistbooth.backend.dto.RestockRequest;
import com.artistbooth.backend.entity.InventoryItem;
import com.artistbooth.backend.entity.RestockRecord;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.repository.InventoryItemRepository;
import com.artistbooth.backend.repository.RestockRecordRepository;
import com.artistbooth.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final RestockRecordRepository restockRecordRepository;
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

    @Transactional
    public InventoryItem restock(Long userId, Long itemId, RestockRequest req) {
        InventoryItem item = inventoryItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Increment stock
        item.setStock(item.getStock() + req.getQuantity());
        inventoryItemRepository.save(item);

        // 2. Create expense record
        RestockRecord record = new RestockRecord();
        record.setUser(user);
        record.setInventoryItem(item);
        record.setQuantity(req.getQuantity());
        record.setCost(req.getCost());
        restockRecordRepository.save(record);

        return item;
    }
}
