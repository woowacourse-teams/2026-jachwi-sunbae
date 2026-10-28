package com.jachwisunbae.rental.domain.vo;

// 관할 법정동에서 맺어진 월세 거래 한 건을 행정동 기준으로 본 것이다. 시세 계산에만 쓴다.
public record AdminDongDeal(String adminDongCode, String legalDongName, long monthlyRentKrw, long depositKrw) {
}
