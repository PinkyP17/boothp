package com.artistbooth.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.artistbooth.backend.dto.InventoryItemRequest;
import com.artistbooth.backend.entity.InventoryItem;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.service.InventoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public List<InventoryItem> getAll(@AuthenticationPrincipal User user) {
        return inventoryService.getAll(user.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItem create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody InventoryItemRequest req) {
        return inventoryService.create(user.getId(), req);
    }

    @PutMapping("/{id}")
    public InventoryItem update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody InventoryItemRequest req) {
        return inventoryService.update(user.getId(), id, req);
    }
}
