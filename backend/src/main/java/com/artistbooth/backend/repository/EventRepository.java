package com.artistbooth.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.artistbooth.backend.entity.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByUserIdOrderByDateDesc(Long userId);
    Optional<Event> findByIdAndUserId(Long id, Long userId);
}
