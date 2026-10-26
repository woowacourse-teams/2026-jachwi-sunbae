package com.jachwisunbae.rental.domain;

// 행정동(통계청 행정동 코드 8자리)이 관할하는 법정동 하나다. 법정동 이름은 연계표의 동리명이다.
public record AdminLegalDong(String adminDongCode, String legalDongCode, String legalDongName) {
}
