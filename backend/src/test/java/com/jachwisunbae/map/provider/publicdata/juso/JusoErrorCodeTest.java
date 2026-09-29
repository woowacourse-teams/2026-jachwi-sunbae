package com.jachwisunbae.map.provider.publicdata.juso;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class JusoErrorCodeTest {

    @Test
    @DisplayName("0은 정상 처리다")
    void successCode() {
        JusoErrorCode errorCode = JusoErrorCode.from("0");

        assertThat(errorCode.isSuccess()).isTrue();
        assertThat(errorCode.isInvalidKeyword()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"E0005", "E0006", "E0008", "E0009", "E0010", "E0011", "E0012", "E0013"})
    @DisplayName("검색어 형식 오류 코드는 사용자 입력 문제로 분류한다")
    void invalidKeywordCodes(String code) {
        JusoErrorCode errorCode = JusoErrorCode.from(code);

        assertThat(errorCode.isInvalidKeyword()).isTrue();
        assertThat(errorCode.isSuccess()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"-999", "E0001", "E0002", "E0003", "E0014", "E0015"})
    @DisplayName("승인키, 외부 시스템, 요청 조건 오류 코드는 외부 공급자 오류로 분류한다")
    void providerErrorCodes(String code) {
        JusoErrorCode errorCode = JusoErrorCode.from(code);

        assertThat(errorCode.isSuccess()).isFalse();
        assertThat(errorCode.isInvalidKeyword()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"E9999", ""})
    @DisplayName("목록에 없는 코드는 UNKNOWN으로 보고 외부 공급자 오류로 분류한다")
    void unknownCodes(String code) {
        JusoErrorCode errorCode = JusoErrorCode.from(code);

        assertThat(errorCode).isEqualTo(JusoErrorCode.UNKNOWN);
        assertThat(errorCode.isSuccess()).isFalse();
        assertThat(errorCode.isInvalidKeyword()).isFalse();
    }
}
