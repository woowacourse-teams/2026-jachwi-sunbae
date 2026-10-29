package com.jachwisunbae.rental.importer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.jachwisunbae.rental.domain.vo.AdminLegalDong;
import com.jachwisunbae.transit.domain.AdminDong;
import com.jachwisunbae.transit.domain.vo.AdminDongBoundary;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class KikMixMatcherTest {

    private static final Charset MS949 = Charset.forName("MS949");
    private static final int[] WIDTHS = {10, 30, 30, 30, 10, 30, 8, 8};
    private static final LocalDate BASE_DATE = LocalDate.of(2025, 6, 30);

    @TempDir
    private Path work;

    @Test
    @DisplayName("[POL-COMMUTE-030] MS949 고정 폭 연계표 파일을 읽어 이름으로 행정동에 관할 법정동을 잇고, 가운뎃점과 '제1동' 표기 차이는 무시한다")
    void matchesByName() throws Exception {
        Path file = work.resolve("KIKmix.20260701");
        Files.write(file, lines(row("서울특별시", "종로구", "", "1111000000", "종로구", ""),
            row("서울특별시", "종로구", "종로1.2.3.4가동", "1111013800", "관철동", ""),
            row("서울특별시", "종로구", "종로1.2.3.4가동", "1111013900", "관수동", ""),
            row("서울특별시", "서대문구", "홍제제1동", "1141011100", "홍제동", "")), MS949);
        List<AdminDong> adminDongs = List.of(adminDong("11010615", "종로구", "종로1·2·3·4가동"),
            adminDong("11130650", "서대문구", "홍제1동"), adminDong("11999999", "서대문구", "없는동"));

        assertThat(KikMixMatcher.match(adminDongs, file, BASE_DATE)).containsExactly(
            new AdminLegalDong("11010615", "1111013800", "관철동"),
            new AdminLegalDong("11010615", "1111013900", "관수동"),
            new AdminLegalDong("11130650", "1141011100", "홍제동"));
    }

    @Test
    @DisplayName("[POL-COMMUTE-030] 행정동 이름에서 번호를 뺀 이름과 같은 관할 법정동이 있으면 그 법정동만 잇고, 없거나 읍·면이면 모두 잇는다")
    void prefersSameNamedLegalDong() {
        List<AdminDong> adminDongs = List.of(adminDong("31023610", "성남시분당구", "이매1동"),
            adminDong("11230511", "강남구", "일원본동"), adminDong("31240310", "화성시", "봉담읍"));
        List<String> lines = lines(row("경기도", "성남시분당구", "이매1동", "4113510600", "이매동", ""),
            row("경기도", "성남시분당구", "이매1동", "4113510700", "야탑동", ""),
            row("서울특별시", "강남구", "일원본동", "1168010600", "대치동", ""),
            row("서울특별시", "강남구", "일원본동", "1168011400", "일원동", ""),
            row("경기도", "화성시", "봉담읍", "4159025300", "봉담읍", ""),
            row("경기도", "화성시", "봉담읍", "4159025321", "와우리", ""));

        assertThat(KikMixMatcher.match(adminDongs, lines, BASE_DATE))
            .extracting(AdminLegalDong::adminDongCode, AdminLegalDong::legalDongName)
            .containsExactly(tuple("31023610", "이매동"), tuple("11230511", "일원동"),
                tuple("31240310", "봉담읍"), tuple("31240310", "와우리"));
    }

    @Test
    @DisplayName("[POL-COMMUTE-030] 행정동 경계 기준일에 유효했던 연계표 행만 쓴다")
    void usesRowsValidOnBaseDate() {
        List<AdminDong> adminDongs = List.of(adminDong("31240310", "화성시", "봉담읍"));
        List<String> lines = lines(row("경기도", "화성시", "봉담읍", "4159025321", "와우리", "20260201"),
            line("4159125300", "경기도", "화성시", "봉담읍", "4159125321", "와우리", "20260201", ""));

        assertThat(KikMixMatcher.match(adminDongs, lines, BASE_DATE)).extracting(AdminLegalDong::legalDongCode)
            .containsExactly("4159025321");
    }

    @Test
    @DisplayName("연계표 헤더가 아니면 읽지 않는다")
    void rejectsOtherFile() {
        assertThatThrownBy(() -> KikMixMatcher.match(List.of(), List.of("법정동코드\t법정동명"), BASE_DATE))
            .hasMessageContaining("헤더");
    }

    private static List<String> lines(final String... rows) {
        List<String> lines = new ArrayList<>();
        lines.add(line("행정동코드", "시도명", "시군구명", "읍면동명", "법정동코드", "동리명", "생성일자", "말소일자"));
        lines.addAll(List.of(rows));
        return lines;
    }

    private static String row(final String sidoName, final String sigunguName, final String eupMyeonDongName,
                              final String legalDongCode, final String legalDongName, final String deletedDate) {
        return line("1111000000", sidoName, sigunguName, eupMyeonDongName, legalDongCode, legalDongName, "19880423",
            deletedDate);
    }

    // 원본처럼 열마다 MS949 바이트 길이로 공백을 채우고 열 사이에 공백 하나를 둔다.
    private static String line(final String... values) {
        StringBuilder line = new StringBuilder();
        for (int index = 0; index < values.length; index++) {
            line.append(values[index]).append(" ".repeat(WIDTHS[index] - values[index].getBytes(MS949).length + 1));
        }
        return line.toString();
    }

    private static AdminDong adminDong(final String code, final String sigunguName, final String name) {
        String sidoName = code.startsWith("31") ? "경기도" : "서울특별시";
        return new AdminDong(code, name, sidoName, sigunguName, sidoName + " " + sigunguName + " " + name, BASE_DATE,
            new AdminDongBoundary("{}", List.of(List.of(new double[] {127.0, 37.5, 127.1, 37.5, 127.1, 37.6}))));
    }
}
