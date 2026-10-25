package com.jachwisunbae.rental.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.jachwisunbae.transit.domain.AdminDong;
import com.jachwisunbae.transit.domain.vo.AdminDongBoundary;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminLegalDongMatcherTest {

    private static final LocalDate BASE_DATE = LocalDate.of(2025, 6, 30);

    @Test
    @DisplayName("시도·시군구·읍면동 이름으로 통계청 행정동에 관할 법정동을 잇고, 가운뎃점과 '제1동' 표기 차이는 무시한다")
    void matchesByName() {
        List<AdminDong> adminDongs = List.of(adminDong("11010615", "종로구", "종로1·2·3·4가동"),
            adminDong("11130650", "서대문구", "홍제1동"), adminDong("11999999", "서대문구", "없는동"));
        List<KikMixRow> rows = List.of(row("종로구", "종로1.2.3.4가동", "1111013800", "관철동", null),
            row("종로구", "종로1.2.3.4가동", "1111013900", "관수동", null),
            row("서대문구", "홍제제1동", "1141011100", "홍제동", null));

        AdminLegalDongMatcher.Result result = AdminLegalDongMatcher.match(adminDongs, rows, BASE_DATE);

        assertThat(result.links()).containsExactly(new AdminLegalDong("11010615", "1111013800", "관철동"),
            new AdminLegalDong("11010615", "1111013900", "관수동"),
            new AdminLegalDong("11130650", "1141011100", "홍제동"));
        assertThat(result.unmatched()).extracting(AdminDong::code).containsExactly("11999999");
    }

    @Test
    @DisplayName("행정동 이름에서 번호를 뺀 이름과 같은 관할 법정동이 있으면 그 법정동만 잇고, 없거나 읍·면이면 모두 잇는다")
    void prefersSameNamedLegalDong() {
        List<AdminDong> adminDongs = List.of(adminDong("31023610", "성남시분당구", "이매1동"),
            adminDong("11230511", "강남구", "일원본동"), adminDong("31240310", "화성시", "봉담읍"));
        List<KikMixRow> rows = List.of(row("성남시분당구", "이매1동", "4113510600", "이매동", null),
            row("성남시분당구", "이매1동", "4113510700", "야탑동", null),
            row("강남구", "일원본동", "1168010600", "대치동", null),
            row("강남구", "일원본동", "1168011400", "일원동", null),
            row("화성시", "봉담읍", "4159025300", "봉담읍", null),
            row("화성시", "봉담읍", "4159025321", "와우리", null));

        AdminLegalDongMatcher.Result result = AdminLegalDongMatcher.match(adminDongs, rows, BASE_DATE);

        assertThat(result.links()).extracting(AdminLegalDong::adminDongCode, AdminLegalDong::legalDongName)
            .containsExactly(tuple("31023610", "이매동"),
                tuple("11230511", "일원동"),
                tuple("31240310", "봉담읍"),
                tuple("31240310", "와우리"));
    }

    @Test
    @DisplayName("행정동 경계 기준일에 유효했던 연계표 행만 쓴다")
    void usesRowsValidOnBaseDate() {
        List<AdminDong> adminDongs = List.of(adminDong("31240310", "화성시", "봉담읍"));
        List<KikMixRow> rows = List.of(row("화성시", "봉담읍", "4159025321", "와우리", LocalDate.of(2026, 2, 1)),
            new KikMixRow("4159125300", "경기도", "화성시", "봉담읍", "4159125321", "와우리",
                LocalDate.of(2026, 2, 1), null));

        AdminLegalDongMatcher.Result result = AdminLegalDongMatcher.match(adminDongs, rows, BASE_DATE);

        assertThat(result.links()).extracting(AdminLegalDong::legalDongCode).containsExactly("4159025321");
    }

    private static AdminDong adminDong(final String code, final String sigunguName, final String name) {
        String sidoName = code.startsWith("31") ? "경기도" : "서울특별시";
        return new AdminDong(code, name, sidoName, sigunguName, sidoName + " " + sigunguName + " " + name, BASE_DATE,
            new AdminDongBoundary("{}", List.of(List.of(new double[] {127.0, 37.5, 127.1, 37.5, 127.1, 37.6}))));
    }

    private static KikMixRow row(final String sigunguName, final String eupMyeonDongName, final String legalDongCode,
                                 final String legalDongName, final LocalDate deletedDate) {
        String sidoName = legalDongCode.startsWith("41") ? "경기도" : "서울특별시";
        return new KikMixRow("1111000000", sidoName, sigunguName, eupMyeonDongName, legalDongCode, legalDongName,
            LocalDate.of(1988, 4, 23), deletedDate);
    }
}
