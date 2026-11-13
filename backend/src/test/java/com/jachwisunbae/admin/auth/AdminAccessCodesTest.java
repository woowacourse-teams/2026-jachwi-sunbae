package com.jachwisunbae.admin.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.admin.support.AdminTestCodes;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminAccessCodesTest {

    @Test
    @DisplayName("등록한 코드 열 개는 허용하고 다른 코드는 거부한다")
    void acceptsConfiguredCodes() {
        var codes = new AdminAccessCodes(AdminTestCodes.configured());
        for (int index = 0; index < 10; index++) {
            assertThat(codes.matches(AdminTestCodes.code(index))).isTrue();
        }
        assertThat(codes.matches("not-configured")).isFalse();
    }

    @Test
    @DisplayName("코드 목록의 공백은 정리하고 비어 있는 항목은 무시한다")
    void readsSimpleCodeList() {
        var codes = new AdminAccessCodes(" first-code, ,second-code ");
        assertThat(codes.matches("first-code")).isTrue();
        assertThat(codes.matches("second-code")).isTrue();
        assertThat(codes.matches("")).isFalse();
    }

    @Test
    @DisplayName("접속 코드가 설정되지 않았거나 입력이 없으면 허용하지 않는다")
    void rejectsMissingCodes() {
        var codes = new AdminAccessCodes("");
        assertThat(codes.matches("any-code")).isFalse();
        assertThat(codes.matches("")).isFalse();
        assertThat(codes.matches(null)).isFalse();
        assertThat(new AdminAccessCodes(AdminTestCodes.configured()).matches(null)).isFalse();
    }
}
