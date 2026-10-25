package com.jachwisunbae.rental.domain;

// 행정동(통계청 행정동 코드 8자리)이 관할하는 법정동 하나다. 법정동 이름은 연계표의 동리명이다.
public record AdminLegalDong(String adminDongCode, String legalDongCode, String legalDongName) {

    public AdminLegalDong {
        if (adminDongCode == null || !adminDongCode.matches("[0-9]{8}")) {
            throw new IllegalArgumentException("행정동 코드는 숫자 8자리여야 합니다. code=" + adminDongCode);
        }
        if (legalDongCode == null || !legalDongCode.matches("[0-9]{10}")) {
            throw new IllegalArgumentException("법정동 코드는 숫자 10자리여야 합니다. code=" + legalDongCode);
        }
        if (legalDongName == null || legalDongName.isBlank()) {
            throw new IllegalArgumentException("법정동 이름이 필요합니다. code=" + legalDongCode);
        }
    }
}
