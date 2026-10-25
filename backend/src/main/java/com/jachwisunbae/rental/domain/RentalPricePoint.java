package com.jachwisunbae.rental.domain;

// 시세 계산에 쓰는 거래 한 건의 법정동 코드와 금액(원)이다.
public record RentalPricePoint(String legalDongCode, long monthlyRentKrw, long depositKrw) {
}
