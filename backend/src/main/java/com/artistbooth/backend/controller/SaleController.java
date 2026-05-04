package com.artistbooth.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.artistbooth.backend.dto.SaleRequest;
import com.artistbooth.backend.entity.Sale;
import com.artistbooth.backend.entity.User;
import com.artistbooth.backend.service.SaleService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    public List<Sale> getAll(@AuthenticationPrincipal User user) {
        return saleService.getAll(user.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Sale create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody SaleRequest req) {
        return saleService.create(user.getId(), req);
    }
}
