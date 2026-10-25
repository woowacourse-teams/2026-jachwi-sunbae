package com.jachwisunbae.rental.domain;

import com.jachwisunbae.transit.domain.AdminDong;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 연계표의 행정동(행정안전부 코드)을 통계청 행정동 코드로 바꿔 관할 법정동을 잇는다.
// 두 코드 체계를 잇는 표가 없어 시도·시군구·읍면동 이름으로 맞춘다. 공백과 가운뎃점은 무시하고,
// 행정안전부의 "○○제1동"은 통계청 이름처럼 "○○1동"으로 읽는다.
// 행정동 경계의 기준일에 유효했던 연계표 행만 써서, 그 뒤에 바뀐 행정동 이름과 어긋나지 않게 한다.
// 연계표에는 면적 비율이 없어 행정동에 조금만 걸친 법정동도 관할로 나온다. 그런 법정동의 거래가 시세를 끌지 않도록,
// 행정동 이름에서 번호를 뺀 이름(이매1동 → 이매동, 상계3·4동 → 상계동, 일원본동 → 일원동)과 같은 관할 법정동이 있으면
// 그 법정동만 잇는다. 읍·면은 거래가 법정리로 잡히므로 이 규칙을 쓰지 않는다.
public final class AdminLegalDongMatcher {

    private AdminLegalDongMatcher() {
    }

    public static Result match(final List<AdminDong> adminDongs, final List<KikMixRow> rows, final LocalDate baseDate) {
        Map<String, Map<String, String>> legalDongsByName = new HashMap<>();
        for (KikMixRow row : rows) {
            if (row.isValidOn(baseDate)) {
                legalDongsByName.computeIfAbsent(key(row.sidoName(), row.sigunguName(), kikMixName(row.eupMyeonDongName())),
                    ignored -> new LinkedHashMap<>()).putIfAbsent(row.legalDongCode(), row.legalDongName());
            }
        }
        List<AdminLegalDong> links = new ArrayList<>();
        List<AdminDong> unmatched = new ArrayList<>();
        for (AdminDong adminDong : adminDongs) {
            Map<String, String> legalDongs = legalDongsByName.get(
                key(adminDong.sidoName(), adminDong.sigunguName(), plain(adminDong.name())));
            if (legalDongs == null) {
                unmatched.add(adminDong);
                continue;
            }
            sameNamed(adminDong.name(), legalDongs)
                .forEach((code, name) -> links.add(new AdminLegalDong(adminDong.code(), code, name)));
        }
        return new Result(links, unmatched);
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

    private static String key(final String sidoName, final String sigunguName, final String eupMyeonDongName) {
        return plain(sidoName) + "|" + plain(sigunguName) + "|" + eupMyeonDongName;
    }

    private static String kikMixName(final String name) {
        return plain(name).replaceAll("제(\\d+가?동)$", "$1");
    }

    private static String plain(final String name) {
        return name.replaceAll("[\\s·.ㆍ]", "");
    }

    public record Result(List<AdminLegalDong> links, List<AdminDong> unmatched) {
    }
}
