package com.artistbooth.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.artistbooth.backend.dto.EventRequest;
import com.artistbooth.backend.entity.Event;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.service.EventService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public List<Event> getAll(@AuthenticationPrincipal User user) {
        return eventService.getAll(user.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Event create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody EventRequest req) {
        return eventService.create(user.getId(), req);
    }

    @PutMapping("/{id}")
    public Event update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody EventRequest req) {
        return eventService.update(user.getId(), id, req);
    }
}
