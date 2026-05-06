package com.artistbooth.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.artistbooth.backend.dto.EventExpenseRequest;
import com.artistbooth.backend.exception.ResourceNotFoundException;
import com.artistbooth.backend.dto.EventRequest;
import com.artistbooth.backend.entity.Event;
import com.artistbooth.backend.entity.EventExpense;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.repository.EventExpenseRepository;
import com.artistbooth.backend.repository.EventRepository;
import com.artistbooth.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventExpenseRepository eventExpenseRepository;
    private final UserRepository userRepository;

    public List<Event> getAll(Long userId) {
        return eventRepository.findByUserIdOrderByDateDesc(userId);
    }

    public Event create(Long userId, EventRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Event event = new Event();
        event.setUser(user);
        event.setName(req.getName());
        event.setDate(req.getDate());
        event.setEndDate(req.getEndDate());
        event.setLocation(req.getLocation());
        event.setStatus(req.getStatus());

        if (req.getBoothFee() != null && req.getBoothFee().compareTo(BigDecimal.ZERO) > 0) {
            EventExpense boothExpense = new EventExpense();
            boothExpense.setEvent(event);
            boothExpense.setCategory("Booth Fee");
            boothExpense.setAmount(req.getBoothFee());
            event.getExpenses().add(boothExpense);
        }

        return eventRepository.save(event);
    }

    public Event update(Long userId, Long eventId, EventRequest req) {
        Event event = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        event.setName(req.getName());
        event.setDate(req.getDate());
        event.setEndDate(req.getEndDate());
        event.setLocation(req.getLocation());
        event.setStatus(req.getStatus());

        // Update booth fee expense
        EventExpense existingBoothFee = event.getExpenses().stream()
                .filter(e -> "Booth Fee".equals(e.getCategory()))
                .findFirst()
                .orElse(null);

        if (req.getBoothFee() != null && req.getBoothFee().compareTo(BigDecimal.ZERO) > 0) {
            if (existingBoothFee != null) {
                existingBoothFee.setAmount(req.getBoothFee());
            } else {
                EventExpense boothExpense = new EventExpense();
                boothExpense.setEvent(event);
                boothExpense.setCategory("Booth Fee");
                boothExpense.setAmount(req.getBoothFee());
                event.getExpenses().add(boothExpense);
            }
        } else if (existingBoothFee != null) {
            event.getExpenses().remove(existingBoothFee);
        }

        return eventRepository.save(event);
    }

    public Event addExpense(Long userId, Long eventId, EventExpenseRequest req) {
        Event event = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        EventExpense expense = new EventExpense();
        expense.setEvent(event);
        expense.setCategory(req.getCategory());
        expense.setAmount(req.getAmount());

        event.getExpenses().add(expense);

        return eventRepository.save(event);
    }

    public void deleteExpense(Long userId, Long eventId, Long expenseId) {
        Event event = eventRepository.findByIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        EventExpense expense = eventExpenseRepository.findByIdAndEventId(expenseId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        event.getExpenses().remove(expense);
        eventRepository.save(event);
    }
}
