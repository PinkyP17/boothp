package com.artistbooth.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventSummaryDto {
    private Long id;
    private String name;
    private LocalDate date;
    private LocalDate endDate;
    private String location;
    private String status;
    private BigDecimal totalExpenses;
}
