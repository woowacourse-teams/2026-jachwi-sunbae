package com.jachwisunbae.map.provider.publicdata.juso;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

// 행정안전부 도로명주소 검색 API의 응답 코드
//행안부 API는 오류도 HTTP 200으로 응답하므로 이 코드로 결과를 판단한다.
public enum JusoErrorCode {

    // 정상 처리되었다.
    SUCCESS("0", Type.SUCCESS),

    // 행안부 시스템 내부 오류다.
    SYSTEM_ERROR("-999", Type.PROVIDER_ERROR),
    // 승인되지 않은 승인키다. 키가 잘못되었거나 검색 API가 아닌 다른 API의 키를 사용했다.
    UNAUTHORIZED_KEY("E0001", Type.PROVIDER_ERROR),
    // 승인되지 않은 사이트에서 요청했다.
    UNAUTHORIZED_SITE("E0002", Type.PROVIDER_ERROR),
    // 정상적인 경로가 아닌 곳에서 요청했다.
    INVALID_ACCESS_PATH("E0003", Type.PROVIDER_ERROR),
    // 개발용 승인키의 사용 기간(90일)이 끝났다.
    EXPIRED_DEVELOPMENT_KEY("E0014", Type.PROVIDER_ERROR),
    // 조회 범위(9,000건)를 넘었다. 항상 1페이지만 요청하므로 이 코드가 오면 요청 조건이 잘못된 것이다.
    SEARCH_RANGE_EXCEEDED("E0015", Type.PROVIDER_ERROR),

    // 검색어가 없다.
    EMPTY_KEYWORD("E0005", Type.INVALID_KEYWORD),
    // "서울", "경기도"처럼 범위가 너무 넓어 주소를 더 상세히 입력해야 한다.
    KEYWORD_TOO_BROAD("E0006", Type.INVALID_KEYWORD),
    // 검색어가 두 글자보다 짧다.
    KEYWORD_TOO_SHORT("E0008", Type.INVALID_KEYWORD),
    // 검색어가 숫자로만 되어 있다.
    NUMBER_ONLY_KEYWORD("E0009", Type.INVALID_KEYWORD),
    // 검색어가 너무 길다. (한글 40자, 영문·숫자 80자 초과)
    KEYWORD_TOO_LONG("E0010", Type.INVALID_KEYWORD),
    // 검색어에 10자리를 넘는 숫자가 들어 있다.
    NUMBER_TOO_LONG("E0011", Type.INVALID_KEYWORD),
    // 검색어가 특수문자와 숫자로만 되어 있다.
    SPECIAL_CHARACTER_AND_NUMBER_ONLY("E0012", Type.INVALID_KEYWORD),
    // 검색어에 SQL 예약어나 금지된 특수문자(%, =, >, <, [, ])가 들어 있다.
    FORBIDDEN_KEYWORD("E0013", Type.INVALID_KEYWORD),

    // 목록에 없는 코드다.
    UNKNOWN(null, Type.PROVIDER_ERROR);

    private static final Map<String, JusoErrorCode> BY_CODE = Arrays.stream(values())
        .filter(errorCode -> errorCode.code != null)
        .collect(Collectors.toUnmodifiableMap(errorCode -> errorCode.code, Function.identity()));

    private final String code;
    private final Type type;

    JusoErrorCode(String code, Type type) {
        this.code = code;
        this.type = type;
    }

    public static JusoErrorCode from(String code) {
        return BY_CODE.getOrDefault(code, UNKNOWN);
    }

    public boolean isSuccess() {
        return type == Type.SUCCESS;
    }

    public boolean isInvalidKeyword() {
        return type == Type.INVALID_KEYWORD;
    }

    private enum Type {
        SUCCESS,//정상 처리
        INVALID_KEYWORD, //사용자가 입력한 검색어로는 검색 수행 불가. 검색어를 바꾸면 해결되므로 장애가 아니라 검색 결과 없음으로 처리
        PROVIDER_ERROR//승인키, 외부 시스템, 요청 조건 문제로 주소 검색 결과를 얻을 수 없다.사용자 입력과 무관. 외부 공급자 오류로 처리.
    }
}
