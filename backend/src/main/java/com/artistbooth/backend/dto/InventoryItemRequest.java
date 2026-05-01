package com.artistbooth.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InventoryItemRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String category;

    @NotNull
    private BigDecimal productionCost;

    @NotNull
    private BigDecimal sellingPrice;

    @NotNull
    @Min(0)
    private Integer stock;
}
