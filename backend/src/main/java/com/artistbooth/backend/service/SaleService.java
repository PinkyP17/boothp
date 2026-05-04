package com.artistbooth.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.artistbooth.backend.dto.SaleItemRequest;
import com.artistbooth.backend.dto.SaleRequest;
import com.artistbooth.backend.entity.InventoryItem;
import com.artistbooth.backend.entity.Sale;
import com.artistbooth.backend.entity.SaleItem;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.repository.InventoryItemRepository;
import com.artistbooth.backend.repository.SaleRepository;
import com.artistbooth.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final UserRepository userRepository;

    public List<Sale> getAll(Long userId) {
        return saleRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    @Transactional
    public Sale create(Long userId, SaleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Sale sale = new Sale();
        sale.setUser(user);
        sale.setSubtotal(req.getTotal()); // will be overwritten below
        sale.setTotal(req.getTotal());
        sale.setPaymentMethod(req.getPaymentMethod());

        if (req.getDiscount() != null) {
            sale.setDiscountType(req.getDiscount().getType());
            sale.setDiscountValue(req.getDiscount().getValue());
            sale.setDiscountAmount(req.getDiscount().getAmount());
            // Recalculate subtotal from items
        }

        // Calculate subtotal from items
        java.math.BigDecimal subtotal = java.math.BigDecimal.ZERO;
        for (SaleItemRequest itemReq : req.getItems()) {
            subtotal = subtotal.add(itemReq.getUnitPrice().multiply(
                    java.math.BigDecimal.valueOf(itemReq.getQuantity())));
        }
        sale.setSubtotal(subtotal);

        for (SaleItemRequest itemReq : req.getItems()) {
            // Validate item exists and belongs to user
            InventoryItem inventoryItem = inventoryItemRepository
                    .findByIdAndUserId(itemReq.getItemId(), userId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Inventory item not found: " + itemReq.getItemId()));

            // Create sale item
            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setItemId(inventoryItem.getId());
            saleItem.setName(itemReq.getName());
            saleItem.setQuantity(itemReq.getQuantity());
            saleItem.setUnitPrice(itemReq.getUnitPrice());
            saleItem.setOriginalPrice(itemReq.getOriginalPrice());
            sale.getItems().add(saleItem);

            // Decrement stock
            inventoryItem.setStock(Math.max(0, inventoryItem.getStock() - itemReq.getQuantity()));
            inventoryItemRepository.save(inventoryItem);
        }

        return saleRepository.save(sale);
    }
}
