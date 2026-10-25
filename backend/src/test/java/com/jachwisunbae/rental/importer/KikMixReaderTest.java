package com.jachwisunbae.rental.importer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.rental.domain.KikMixRow;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class KikMixReaderTest {

    private static final Charset MS949 = Charset.forName("MS949");
    private static final int[] WIDTHS = {10, 30, 30, 30, 10, 30, 8, 8};

    @Test
    @DisplayName("MS949 고정 폭 연계표를 바이트 위치로 읽고, 읍면동이 없는 시도·시군구 행은 건너뛴다")
    void reads() throws Exception {
        byte[] file = file(
            line("행정동코드", "시도명", "시군구명", "읍면동명", "법정동코드", "동리명", "생성일자", "말소일자"),
            line("1111000000", "서울특별시", "종로구", "", "1111000000", "종로구", "19880423", ""),
            line("1141062000", "서울특별시", "서대문구", "홍제제1동", "1141011100", "홍제동", "19880423", ""),
            line("1141063000", "서울특별시", "서대문구", "홍제제2동", "1141011100", "홍제동", "19880423", "20080506"));

        List<KikMixRow> rows = KikMixReader.read(new ByteArrayInputStream(file));

        assertThat(rows).containsExactly(
            new KikMixRow("1141062000", "서울특별시", "서대문구", "홍제제1동", "1141011100", "홍제동",
                LocalDate.of(1988, 4, 23), null),
            new KikMixRow("1141063000", "서울특별시", "서대문구", "홍제제2동", "1141011100", "홍제동",
                LocalDate.of(1988, 4, 23), LocalDate.of(2008, 5, 6)));
    }

    @Test
    @DisplayName("연계표 헤더가 아니면 읽지 않는다")
    void rejectsOtherFile() {
        assertThatThrownBy(() -> KikMixReader.read(new ByteArrayInputStream("법정동코드\t법정동명\n".getBytes(MS949))))
            .hasMessageContaining("헤더");
    }

    // 원본처럼 열마다 MS949 바이트 길이로 공백을 채우고 열 사이에 공백 하나를 둔다.
    private static byte[] line(final String... values) {
        ByteArrayOutputStream line = new ByteArrayOutputStream();
        for (int index = 0; index < values.length; index++) {
            byte[] value = values[index].getBytes(MS949);
            line.writeBytes(value);
            line.writeBytes(" ".repeat(WIDTHS[index] - value.length + 1).getBytes(MS949));
        }
        return line.toByteArray();
    }

    private static byte[] file(final byte[]... lines) {
        ByteArrayOutputStream file = new ByteArrayOutputStream();
        for (byte[] line : lines) {
            file.writeBytes(line);
            file.write('\r');
            file.write('\n');
        }
        return file.toByteArray();
    }
}
