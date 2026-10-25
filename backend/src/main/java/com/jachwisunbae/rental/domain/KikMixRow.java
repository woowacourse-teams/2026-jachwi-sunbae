package com.jachwisunbae.rental.domain;

import java.time.LocalDate;

// 행정안전부 행정기관·관할구역 연계표(KIKmix)의 한 행이다. 행정동 하나와 그 관할 법정동 하나를 잇는다.
// 말소되지 않은 행은 deletedDate가 null이다.
public record KikMixRow(String adminDongCode, String sidoName, String sigunguName, String eupMyeonDongName,
                        String legalDongCode, String legalDongName, LocalDate createdDate, LocalDate deletedDate) {

    // date에 유효했던 행인지 본다. 생성일에 생기고 말소일에 사라진다.
    public boolean isValidOn(final LocalDate date) {
        return !createdDate.isAfter(date) && (deletedDate == null || deletedDate.isAfter(date));
    }
}
