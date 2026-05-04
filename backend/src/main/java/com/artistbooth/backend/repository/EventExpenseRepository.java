package com.artistbooth.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.artistbooth.backend.entity.EventExpense;

public interface EventExpenseRepository extends JpaRepository<EventExpense, Long> {
    Optional<EventExpense> findByIdAndEventId(Long id, Long eventId);
}
