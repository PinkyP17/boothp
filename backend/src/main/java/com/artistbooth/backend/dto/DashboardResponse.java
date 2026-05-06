package com.artistbooth.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {
    private BigDecimal income;
    private BigDecimal eventExpenses;
    private BigDecimal restockExpenses;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private List<TransactionDto> transactions;
    private List<EventSummaryDto> upcomingEvents;
}
