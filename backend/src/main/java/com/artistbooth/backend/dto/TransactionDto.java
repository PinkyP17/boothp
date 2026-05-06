package com.artistbooth.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TransactionDto {
    private Long id;
    private String type;
    private String description;
    private BigDecimal amount;
    private LocalDateTime date;
    private String eventName;
}
