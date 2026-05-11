package com.artistbooth.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EventRequest {
    @NotBlank
    private String name;

    @NotNull
    private LocalDate date;

    @NotNull
    private LocalDate endDate;

    private String location;

    @NotBlank
    private String status;

    private BigDecimal boothFee;

    private String notes;

    private String currency;
}
