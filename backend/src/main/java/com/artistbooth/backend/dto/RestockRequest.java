package com.artistbooth.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RestockRequest {
    @NotNull
    @Min(1)
    private Integer quantity;

    @NotNull
    @Min(0)
    private BigDecimal cost;
}
