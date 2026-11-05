package com.jachwisunbae.streetmemo.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

class StreetMemoCategoryTest {

    @ParameterizedTest
    @EnumSource(StreetMemoCategory.class)
    @DisplayName("대문자 코드를 같은 카테고리로 바꾼다")
    void convertsUpperCaseCode(StreetMemoCategory category) {
        assertThat(StreetMemoCategory.fromCode(category.name())).isEqualTo(category);
    }

    @Test
    @DisplayName("카테고리를 보내지 않으면 GENERAL로 둔다")
    void usesGeneralWhenCodeIsMissing() {
        assertThat(StreetMemoCategory.fromCode(null)).isEqualTo(StreetMemoCategory.GENERAL);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "place", "SHOP"})
    @DisplayName("빈 문자열, 소문자, 정의되지 않은 코드는 거부한다")
    void rejectsUndefinedCode(String code) {
        assertThatThrownBy(() -> StreetMemoCategory.fromCode(code))
                .isInstanceOfSatisfying(InvalidInputException.class, exception ->
                        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.STREET_MEMO_CATEGORY_INVALID));
    }
}
