package com.jachwisunbae.rental.importer;

import com.jachwisunbae.rental.domain.KikMixRow;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

// 행정표준코드관리시스템(code.go.kr)의 행정기관·관할구역 연계표(KIKmix.연월일) 텍스트 파일을 읽는다.
// MS949 고정 폭 파일이라 열을 바이트 위치로 자른다. 읍면동이 없는 시도·시군구 행은 건너뛴다.
public final class KikMixReader {

    private static final Charset MS949 = Charset.forName("MS949");
    private static final DateTimeFormatter DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String HEADER_PREFIX = "행정동코드";
    // 행정동코드, 시도명, 시군구명, 읍면동명, 법정동코드, 동리명, 생성일자, 말소일자의 [시작, 끝) 바이트 위치
    private static final int[][] COLUMNS = {{0, 10}, {11, 41}, {42, 72}, {73, 103}, {104, 114}, {115, 145},
        {146, 154}, {155, 163}};

    private KikMixReader() {
    }

    public static List<KikMixRow> read(final Path file) throws IOException {
        try (InputStream input = Files.newInputStream(file)) {
            return read(input);
        }
    }

    public static List<KikMixRow> read(final InputStream input) throws IOException {
        List<byte[]> lines = lines(input.readAllBytes());
        if (lines.isEmpty() || !new String(lines.getFirst(), MS949).startsWith(HEADER_PREFIX)) {
            throw new IllegalArgumentException("KIKmix 연계표의 헤더가 아닙니다.");
        }
        List<KikMixRow> rows = new ArrayList<>();
        for (int index = 1; index < lines.size(); index++) {
            byte[] line = lines.get(index);
            if (line.length == 0) {
                continue;
            }
            if (line.length < COLUMNS[4][1]) {
                throw new IllegalArgumentException("KIKmix 연계표의 행이 짧습니다. line=" + (index + 1));
            }
            String eupMyeonDongName = column(line, 3);
            if (!eupMyeonDongName.isEmpty()) {
                rows.add(new KikMixRow(column(line, 0), column(line, 1), column(line, 2), eupMyeonDongName,
                    column(line, 4), column(line, 5), date(column(line, 6)), date(column(line, 7))));
            }
        }
        return rows;
    }

    private static String column(final byte[] line, final int index) {
        int start = Math.min(COLUMNS[index][0], line.length);
        int end = Math.min(COLUMNS[index][1], line.length);
        return new String(Arrays.copyOfRange(line, start, end), MS949).strip();
    }

    private static LocalDate date(final String value) {
        return value.isEmpty() ? null : LocalDate.parse(value, DATE);
    }

    private static List<byte[]> lines(final byte[] bytes) {
        List<byte[]> lines = new ArrayList<>();
        ByteArrayOutputStream line = new ByteArrayOutputStream();
        for (byte value : bytes) {
            if (value == '\n') {
                lines.add(line.toByteArray());
                line.reset();
            } else if (value != '\r') {
                line.write(value);
            }
        }
        if (line.size() > 0) {
            lines.add(line.toByteArray());
        }
        return lines;
    }
}
