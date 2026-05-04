package com.artistbooth.backend.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DiscountDto {
    private String type;
    private BigDecimal value;
    private BigDecimal amount;
}
