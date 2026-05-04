package com.artistbooth.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.artistbooth.backend.entity.RestockRecord;

public interface RestockRecordRepository extends JpaRepository<RestockRecord, Long> {
    List<RestockRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
}
