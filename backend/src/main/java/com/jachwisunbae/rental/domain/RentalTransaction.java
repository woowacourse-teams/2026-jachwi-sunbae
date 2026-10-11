package com.jachwisunbae.rental.domain;

import java.time.LocalDate;
import java.util.Objects;
import java.util.Set;

public record RentalTransaction(
    LegalDong legalDong,
    HousingType housingType,
    RentalPrice price,
    RentalArea area,
    LocalDate contractDate,
    String contractType,
    String buildingName,
    String floor,
    String contractPeriod,
    RentalSource source
) {
    public RentalTransaction {
        Objects.requireNonNull(legalDong);
        Objects.requireNonNull(price);
        Objects.requireNonNull(area);
        Objects.requireNonNull(source);
        if ((housingType == HousingType.DETACHED) != (area.areaBasis() == AreaBasis.CONTRACT)) {
            throw new IllegalArgumentException("주택 유형과 면적 기준이 일치하지 않습니다.");
        }
        if (!Set.of("NEW", "RENEWAL", "UNKNOWN").contains(contractType)) {
            throw new IllegalArgumentException("계약 구분이 올바르지 않습니다.");
        }
        if (buildingName.length() > 255
            || floor.length() > 20 || contractPeriod.length() > 40) {
            throw new IllegalArgumentException("거래 문자열의 길이가 저장 범위를 초과했습니다.");
        }
    }

    public enum HousingType {
        ROWHOUSE, DETACHED, OFFICETEL
    }

    public enum AreaBasis {
        EXCLUSIVE, CONTRACT
    }
}
