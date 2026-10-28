package com.jachwisunbae.rental.importer;

import com.jachwisunbae.rental.domain.vo.AdminLegalDong;
import com.jachwisunbae.transit.domain.AdminDong;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 행정안전부 행정기관·관할구역 연계표(KIKmix.연월일)를 읽어 통계청 행정동에 관할 법정동을 잇는다.
// 연계표는 MS949 고정 폭 파일이라 열을 바이트 위치로 자르고, 읍면동이 없는 시도·시군구 행은 건너뛴다.
// 두 코드 체계를 잇는 표가 없어 시도·시군구·읍면동 이름으로 맞춘다. 공백과 가운뎃점은 무시하고,
// 행정안전부의 "○○제1동"은 통계청 이름처럼 "○○1동"으로 읽는다.
// 행정동 경계의 기준일에 유효했던 행만 써서, 그 뒤에 바뀐 행정동 이름과 어긋나지 않게 한다.
// 연계표에는 면적 비율이 없어 행정동에 조금만 걸친 법정동도 관할로 나온다. 그런 법정동의 거래가 시세를 끌지 않도록,
// 행정동 이름에서 번호를 뺀 이름(이매1동 → 이매동, 상계3·4동 → 상계동, 일원본동 → 일원동)과 같은 관할 법정동이 있으면
// 그 법정동만 잇는다. 읍·면은 거래가 법정리로 잡히므로 이 규칙을 쓰지 않는다.
public final class KikMixMatcher {

    private static final Charset MS949 = Charset.forName("MS949");
    // 행정동코드, 시도명, 시군구명, 읍면동명, 법정동코드, 동리명, 생성일자, 말소일자의 [시작, 끝) 바이트 위치
    private static final int[][] COLUMNS = {{0, 10}, {11, 41}, {42, 72}, {73, 103}, {104, 114}, {115, 145},
        {146, 154}, {155, 163}};

    private KikMixMatcher() {
    }

    public static List<AdminLegalDong> match(final List<AdminDong> adminDongs, final Path file,
                                             final LocalDate baseDate) throws IOException {
        return match(adminDongs, Files.readAllLines(file, MS949), baseDate);
    }

    public static List<AdminLegalDong> match(final List<AdminDong> adminDongs, final List<String> lines,
                                             final LocalDate baseDate) {
        if (lines.isEmpty() || !lines.getFirst().startsWith("행정동코드")) {
            throw new IllegalArgumentException("KIKmix 연계표의 헤더가 아닙니다.");
        }
        Map<String, Map<String, String>> legalDongsByName = new HashMap<>();
        for (String text : lines.subList(1, lines.size())) {
            byte[] line = text.getBytes(MS949);
            String eupMyeonDongName = column(line, 3);
            if (!eupMyeonDongName.isEmpty() && isValidOn(column(line, 6), column(line, 7), baseDate)) {
                legalDongsByName.computeIfAbsent(key(column(line, 1), column(line, 2), kikMixName(eupMyeonDongName)),
                    ignored -> new LinkedHashMap<>()).putIfAbsent(column(line, 4), column(line, 5));
            }
        }
        List<AdminLegalDong> links = new ArrayList<>();
        for (AdminDong adminDong : adminDongs) {
            Map<String, String> legalDongs = legalDongsByName.getOrDefault(
                key(adminDong.sidoName(), adminDong.sigunguName(), plain(adminDong.name())), Map.of());
            sameNamed(adminDong.name(), legalDongs)
                .forEach((code, name) -> links.add(new AdminLegalDong(adminDong.code(), code, name)));
        }
        return links;
    }

    // 생성일에 생기고 말소일에 사라진다. 말소되지 않은 행은 말소일자가 비어 있다.
    private static boolean isValidOn(final String createdDate, final String deletedDate, final LocalDate date) {
        return !date(createdDate).isAfter(date) && (deletedDate.isEmpty() || date(deletedDate).isAfter(date));
    }

    private static Map<String, String> sameNamed(final String adminDongName, final Map<String, String> legalDongs) {
        if (!adminDongName.endsWith("동")) {
            return legalDongs;
        }
        String baseName = plain(adminDongName).replaceAll("[0-9]+가?동$", "동").replaceAll("(.+)본동$", "$1동");
        Map<String, String> sameNamed = new LinkedHashMap<>();
        legalDongs.forEach((code, name) -> {
            if (plain(name).equals(baseName)) {
                sameNamed.put(code, name);
            }
        });
        return sameNamed.isEmpty() ? legalDongs : sameNamed;
    }

    private static String column(final byte[] line, final int index) {
        int start = Math.min(COLUMNS[index][0], line.length);
        int end = Math.min(COLUMNS[index][1], line.length);
        return new String(Arrays.copyOfRange(line, start, end), MS949).strip();
    }

    private static LocalDate date(final String value) {
        return LocalDate.parse(value, DateTimeFormatter.BASIC_ISO_DATE);
    }

    private static String key(final String sidoName, final String sigunguName, final String eupMyeonDongName) {
        return plain(sidoName) + "|" + plain(sigunguName) + "|" + eupMyeonDongName;
    }

    private static String kikMixName(final String name) {
        return plain(name).replaceAll("제(\\d+가?동)$", "$1");
    }

    private static String plain(final String name) {
        return name.replaceAll("[\\s·.ㆍ]", "");
    }
}
