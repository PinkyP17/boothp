package com.artistbooth.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.artistbooth.backend.entity.Sale;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByUserIdOrderByTimestampDesc(Long userId);
}
