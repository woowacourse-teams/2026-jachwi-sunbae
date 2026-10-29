package com.jachwisunbae.rental.domain;

import com.jachwisunbae.rental.domain.vo.AdminDongDeal;
import com.jachwisunbae.rental.domain.vo.AdminDongRent;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

// 기간 안의 행정동별 월세 시세다. 행정동마다 관할 법정동 거래를 모두 합쳐 월세·보증금 중앙값을 내고,
// 합친 거래가 MIN_TRANSACTIONS건보다 적은 행정동은 시세를 내지 않는다.
public record AdminDongRents(LocalDate startDate, LocalDate endDate, Map<String, AdminDongRent> byAdminDong) {

    public static final int MIN_TRANSACTIONS = 5;
    public static final int MONTHS = 6;

    public AdminDongRents {
        byAdminDong = Map.copyOf(byAdminDong);
    }

    public static AdminDongRents empty() {
        return new AdminDongRents(null, null, Map.of());
    }

    public static LocalDate startDateOf(final LocalDate endDate) {
        return endDate.minusMonths(MONTHS);
    }

    public static List<AdminDongRent> calculate(final List<AdminDongDeal> deals) {
        Map<String, List<AdminDongDeal>> dealsByAdminDong = deals.stream()
            .collect(Collectors.groupingBy(AdminDongDeal::adminDongCode, LinkedHashMap::new, Collectors.toList()));
        return dealsByAdminDong.entrySet().stream()
            .filter(entry -> entry.getValue().size() >= MIN_TRANSACTIONS)
            .map(entry -> toRent(entry.getKey(), entry.getValue()))
            .toList();
    }

    public Optional<AdminDongRent> find(final String adminDongCode) {
        return Optional.ofNullable(byAdminDong.get(adminDongCode));
    }

    private static AdminDongRent toRent(final String adminDongCode, final List<AdminDongDeal> deals) {
        Map<String, Long> countsByLegalDong = deals.stream()
            .collect(Collectors.groupingBy(AdminDongDeal::legalDongName, Collectors.counting()));
        List<String> legalDongNames = countsByLegalDong.keySet().stream()
            .sorted(Comparator.comparing((String name) -> -countsByLegalDong.get(name))
                .thenComparing(Function.identity()))
            .toList();
        return new AdminDongRent(adminDongCode, legalDongNames,
            median(deals.stream().mapToLong(AdminDongDeal::monthlyRentKrw).toArray()),
            median(deals.stream().mapToLong(AdminDongDeal::depositKrw).toArray()), deals.size());
    }

    // 짝수 개면 가운데 두 값의 평균을 반올림한다.
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
