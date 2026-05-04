package com.artistbooth.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.artistbooth.backend.dto.EventExpenseRequest;
import com.artistbooth.backend.entity.Event;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.service.EventService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/events/{eventId}/expenses")
@RequiredArgsConstructor
public class EventExpenseController {

    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Event addExpense(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId,
            @Valid @RequestBody EventExpenseRequest req) {
        return eventService.addExpense(user.getId(), eventId, req);
    }

    @DeleteMapping("/{expenseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId,
            @PathVariable Long expenseId) {
        eventService.deleteExpense(user.getId(), eventId, expenseId);
    }
}
