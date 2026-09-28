package com.jachwisunbae.property.entity.photo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.time.LocalDateTime;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("PropertyPhoto")
class PropertyPhotoTest {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 9, 25, 12, 0);

    @Test
    @DisplayName("사진을 생성한다")
    void createPhoto() {
        PropertyPhoto photo = PropertyPhoto.create(
            1L, "members/1/properties/1/photo.png", "IMAGE/PNG", 1024L, CREATED_AT);

        assertThat(photo.getId()).isNull();
        assertThat(photo.getPropertyId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("저장된 사진을 복원한다")
    void reconstructPhoto() {
        PropertyPhoto photo = PropertyPhoto.reconstruct(
            10L, 1L, "members/1/properties/1/photo.heic", "image/heic", MAX_SIZE_BYTES, CREATED_AT);

        assertThat(photo.getId()).isEqualTo(10L);
        assertThat(photo.getContentType()).isEqualTo("image/heic");
        assertThat(photo.getSizeBytes()).isEqualTo(MAX_SIZE_BYTES);
    }

    @Test
    @DisplayName("매물 ID가 없으면 예외가 발생한다")
    void rejectMissingPropertyId() {
        assertErrorCode(
            () -> PropertyPhoto.create(null, "photo.png", "image/png", 1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    @DisplayName("저장 키가 비어 있으면 예외가 발생한다")
    void rejectBlankStorageKey() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, " ", "image/png", 1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    @DisplayName("콘텐츠 타입이 없으면 예외가 발생한다")
    void rejectMissingContentType() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", null, 1L, CREATED_AT),
            DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED);
    }

    @Test
    @DisplayName("지원하지 않는 콘텐츠 타입이면 예외가 발생한다")
    void rejectUnsupportedContentType() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.gif", "image/gif", 1L, CREATED_AT),
            DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED);
    }

    @Test
    @DisplayName("사진 크기가 없거나 음수이면 예외가 발생한다")
    void rejectMissingOrNegativeSize() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", null, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", -1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    @DisplayName("사진 크기가 5MiB를 초과하면 예외가 발생한다")
    void rejectOversizedPhoto() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", MAX_SIZE_BYTES + 1, CREATED_AT),
            DomainErrorCode.PHOTO_FILE_SIZE_INVALID);
    }

    @Test
    @DisplayName("생성 시각이 없으면 예외가 발생한다")
    void rejectMissingCreatedAt() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", 1L, null),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    private void assertErrorCode(final ThrowingCallable callable, final DomainErrorCode code) {
        assertThatThrownBy(callable)
            .isInstanceOf(BusinessException.class)
            .extracting("code")
            .isEqualTo(code);
    }
}
