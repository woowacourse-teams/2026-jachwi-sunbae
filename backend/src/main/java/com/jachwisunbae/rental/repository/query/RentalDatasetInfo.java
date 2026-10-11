package com.jachwisunbae.rental.repository.query;

import java.time.Instant;
import java.time.LocalDate;

public record RentalDatasetInfo(LocalDate coverageFrom, LocalDate coverageTo, Instant collectedAt) {
}
