package com.artistbooth.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.artistbooth.backend.dto.DashboardResponse;
import com.artistbooth.backend.dto.EventSummaryDto;
import com.artistbooth.backend.dto.TransactionDto;
import com.artistbooth.backend.entity.Event;
import com.artistbooth.backend.entity.EventExpense;
import com.artistbooth.backend.entity.RestockRecord;
import com.artistbooth.backend.entity.Sale;
import com.artistbooth.backend.entity.SaleItem;
import com.artistbooth.backend.repository.EventRepository;
import com.artistbooth.backend.repository.RestockRecordRepository;
import com.artistbooth.backend.repository.SaleRepository;

import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SaleRepository saleRepository;
    private final EventRepository eventRepository;
    private final RestockRecordRepository restockRecordRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        // 1. Sales → income
        List<Sale> sales = saleRepository.findByUserIdOrderByTimestampDesc(userId);
        BigDecimal income = sales.stream()
                .map(Sale::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TransactionDto> transactions = new ArrayList<>();

        for (Sale sale : sales) {
            String description = sale.getItems().stream()
                    .map(si -> si.getQuantity() + "x " + si.getName())
                    .collect(Collectors.joining(", "));
            transactions.add(TransactionDto.builder()
                    .id(sale.getId())
                    .type("income")
                    .description(description)
                    .amount(sale.getTotal())
                    .date(sale.getTimestamp())
                    .eventName(null)
                    .build());
        }

        // 2. Events → event expenses
        List<Event> events = eventRepository.findByUserIdOrderByDateDesc(userId);
        BigDecimal eventExpensesTotal = BigDecimal.ZERO;

        for (Event event : events) {
            for (EventExpense expense : event.getExpenses()) {
                eventExpensesTotal = eventExpensesTotal.add(expense.getAmount());
                transactions.add(TransactionDto.builder()
                        .id(expense.getId())
                        .type("event_expense")
                        .description(expense.getCategory() + " - " + event.getName())
                        .amount(expense.getAmount())
                        .date(expense.getCreatedAt())
                        .eventName(event.getName())
                        .build());
            }
        }

        // 3. Restock records → restock expenses
        List<RestockRecord> restocks = restockRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        BigDecimal restockExpensesTotal = BigDecimal.ZERO;

        for (RestockRecord restock : restocks) {
            restockExpensesTotal = restockExpensesTotal.add(restock.getCost());
            // Need item name — fetch via the relationship
            String itemName = restock.getInventoryItem() != null
                    ? restock.getInventoryItem().getName()
                    : "Unknown Item";
            transactions.add(TransactionDto.builder()
                    .id(restock.getId())
                    .type("restock")
                    .description("Restock " + itemName + " (x" + restock.getQuantity() + ")")
                    .amount(restock.getCost())
                    .date(restock.getCreatedAt())
                    .eventName(null)
                    .build());
        }

        // 4. Sort transactions by date descending
        transactions.sort(Comparator.comparing(TransactionDto::getDate).reversed());

        // 5. Upcoming events
        BigDecimal totalExpenses = eventExpensesTotal.add(restockExpensesTotal);

        List<EventSummaryDto> upcomingEvents = events.stream()
                .filter(e -> !"past".equals(e.getStatus()))
                .map(e -> {
                    BigDecimal evtExpenses = e.getExpenses().stream()
                            .map(EventExpense::getAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return EventSummaryDto.builder()
                            .id(e.getId())
                            .name(e.getName())
                            .date(e.getDate())
                            .endDate(e.getEndDate())
                            .location(e.getLocation())
                            .status(e.getStatus())
                            .totalExpenses(evtExpenses)
                            .build();
                })
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .income(income)
                .eventExpenses(eventExpensesTotal)
                .restockExpenses(restockExpensesTotal)
                .totalExpenses(totalExpenses)
                .netProfit(income.subtract(totalExpenses))
                .transactions(transactions)
                .upcomingEvents(upcomingEvents)
                .build();
    }
}
