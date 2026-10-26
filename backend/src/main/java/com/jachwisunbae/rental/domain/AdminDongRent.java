package com.jachwisunbae.rental.domain;

import java.util.List;

// 동네(행정동)의 월세 시세다. 관할 법정동 거래를 합친 월세·보증금 중앙값(원)과 거래 수이며,
// legalDongNames는 거래가 있었던 관할 법정동을 거래가 많은 순서로 담는다.
public record AdminDongRent(String adminDongCode, List<String> legalDongNames, long monthlyRentKrw,
                            long depositKrw, int transactionCount) {

    public AdminDongRent {
        legalDongNames = List.copyOf(legalDongNames);
    }
}
