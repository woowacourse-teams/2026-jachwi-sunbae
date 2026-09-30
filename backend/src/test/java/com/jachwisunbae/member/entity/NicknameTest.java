package com.jachwisunbae.member.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class NicknameTest {

    @Test
    @DisplayName("앞뒤 공백을 제거한다")
    void trimsValue() {
        assertThat(Nickname.from("  자취초보  ").value()).isEqualTo("자취초보");
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 30})
    @DisplayName("1자와 30자는 허용한다")
    void allowsBoundaryLength(int length) {
        assertThat(Nickname.from("가".repeat(length)).value()).hasSize(length);
    }

    @Test
    @DisplayName("앞뒤 공백을 제거한 길이로 검사한다")
    void checksLengthAfterTrim() {
        assertThat(Nickname.from("  " + "가".repeat(30) + "  ").value()).hasSize(30);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("비어 있으면 허용하지 않는다")
    void rejectsBlank(String value) {
        assertInvalid(value);
    }

    @Test
    @DisplayName("31자는 허용하지 않는다")
    void rejectsTooLong() {
        assertInvalid("가".repeat(31));
    }

    private static void assertInvalid(String value) {
        assertThatThrownBy(() -> Nickname.from(value))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getCode()).isEqualTo(DomainErrorCode.NICKNAME_INVALID));
    }
}
