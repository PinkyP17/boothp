package com.artistbooth.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.artistbooth.backend.entity.InventoryItem;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<InventoryItem> findByIdAndUserId(Long id, Long userId);
}
