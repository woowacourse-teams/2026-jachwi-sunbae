package com.jachwisunbae.common.exception.errorcode;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.DisplayName;

class ErrorCodeTest {

    @ParameterizedTest
    @EnumSource(ErrorCode.class)
    @DisplayName("모든 오류 코드는 응답에 쓸 공개 메시지를 가진다")
    void hasPublicMessage(ErrorCode errorCode) {
        assertThat(errorCode.publicMessage()).isNotBlank();
    }
}
