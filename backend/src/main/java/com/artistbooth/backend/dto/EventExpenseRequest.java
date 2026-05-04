package com.artistbooth.backend.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EventExpenseRequest {
    @NotBlank
    private String category;

    @NotNull
    @Min(0)
    private BigDecimal amount;
}
