package com.jachwisunbae.property.controller.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.checklist.type.CheckStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class UpdatePropertyChecklistStatusRequestTest {

    private static final Validator VALIDATOR = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    @DisplayName("체크 상태 변경 요청은 검증을 통과한다")
    void acceptsStatus() {
        // given
        UpdatePropertyChecklistStatusRequest request = new UpdatePropertyChecklistStatusRequest(CheckStatus.GOOD, 0L);

        // when
        Set<ConstraintViolation<UpdatePropertyChecklistStatusRequest>> violations = VALIDATOR.validate(request);

        // then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("체크 상태가 없으면 요청 검증에 실패한다")
    void rejectsNullStatus() {
        // given
        UpdatePropertyChecklistStatusRequest request = new UpdatePropertyChecklistStatusRequest(null, 0L);

        // when
        Set<ConstraintViolation<UpdatePropertyChecklistStatusRequest>> violations = VALIDATOR.validate(request);

        // then
        assertThat(violations)
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("status");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(longs = {-1L})
    @DisplayName("버전이 없거나 음수이면 요청 검증에 실패한다")
    void rejectsMissingOrNegativeVersion(Long version) {
        // given
        var request = new UpdatePropertyChecklistStatusRequest(CheckStatus.GOOD, version);
        // when
        var violations = VALIDATOR.validate(request);
        // then
        assertThat(violations).extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("expectedVersion");
    }
}
