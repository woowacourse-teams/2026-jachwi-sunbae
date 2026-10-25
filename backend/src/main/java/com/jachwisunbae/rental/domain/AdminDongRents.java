package com.jachwisunbae.rental.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

// 조회 기간의 행정동별 월세 시세다. 행정동마다 관할 법정동 거래를 모두 합쳐 월세·보증금 중앙값을 낸다.
// 합친 거래가 MIN_TRANSACTIONS건보다 적은 행정동은 시세를 내지 않는다.
public record AdminDongRents(LocalDate queryStartDate, LocalDate queryEndDate,
                             Map<String, AdminDongRent> byAdminDong) {

    public static final int MIN_TRANSACTIONS = 5;

    public AdminDongRents {
        byAdminDong = Map.copyOf(byAdminDong);
    }

    public static AdminDongRents empty() {
        return new AdminDongRents(null, null, Map.of());
    }

    public static AdminDongRents of(final List<AdminLegalDong> links, final List<RentalPricePoint> prices,
                                    final LocalDate queryStartDate, final LocalDate queryEndDate) {
        Map<String, List<RentalPricePoint>> pricesByLegalDong = prices.stream()
            .collect(Collectors.groupingBy(RentalPricePoint::legalDongCode));
        Map<String, List<AdminLegalDong>> linksByAdminDong = links.stream()
            .collect(Collectors.groupingBy(AdminLegalDong::adminDongCode, LinkedHashMap::new, Collectors.toList()));
        Map<String, AdminDongRent> byAdminDong = new HashMap<>();
        linksByAdminDong.forEach((adminDongCode, adminLinks) -> {
            List<RentalPricePoint> adminPrices = new ArrayList<>();
            List<AdminLegalDong> traded = new ArrayList<>();
            for (AdminLegalDong link : adminLinks) {
                List<RentalPricePoint> legalPrices = pricesByLegalDong.getOrDefault(link.legalDongCode(), List.of());
                if (!legalPrices.isEmpty()) {
                    adminPrices.addAll(legalPrices);
                    traded.add(link);
                }
            }
            if (adminPrices.size() >= MIN_TRANSACTIONS) {
                traded.sort(Comparator.comparingInt((AdminLegalDong link) ->
                    -pricesByLegalDong.get(link.legalDongCode()).size()).thenComparing(AdminLegalDong::legalDongCode));
                byAdminDong.put(adminDongCode, new AdminDongRent(
                    traded.stream().map(link -> new AdminDongRent.LegalDong(link.legalDongCode(), link.legalDongName()))
                        .toList(),
                    median(adminPrices.stream().mapToLong(RentalPricePoint::monthlyRentKrw).toArray()),
                    median(adminPrices.stream().mapToLong(RentalPricePoint::depositKrw).toArray()),
                    adminPrices.size()));
            }
        });
        return new AdminDongRents(queryStartDate, queryEndDate, byAdminDong);
    }

    public Optional<AdminDongRent> find(final String adminDongCode) {
        return Optional.ofNullable(byAdminDong.get(adminDongCode));
    }

    public boolean isEmpty() {
        return byAdminDong.isEmpty();
    }

    // 짝수 개면 가운데 두 값의 평균을 반올림한다. 노선망의 중앙값(Median)과 같은 정의다.
    static long median(final long[] values) {
        long[] sorted = values.clone();
        Arrays.sort(sorted);
        int middle = sorted.length / 2;
        if (sorted.length % 2 == 1) {
            return sorted[middle];
        }
        return Math.round((sorted[middle - 1] + sorted[middle]) / 2.0);
    }
}
