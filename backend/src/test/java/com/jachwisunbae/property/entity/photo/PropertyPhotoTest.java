package com.jachwisunbae.property.entity.photo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.time.LocalDateTime;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;

class PropertyPhotoTest {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 9, 25, 12, 0);

    @Test
    void 사진을_생성한다() {
        PropertyPhoto photo = PropertyPhoto.create(
            1L, "members/1/properties/1/photo.png", "IMAGE/PNG", 1024L, CREATED_AT);

        assertThat(photo.getId()).isNull();
        assertThat(photo.getPropertyId()).isEqualTo(1L);
        assertThat(photo.getStorageKey()).isEqualTo("members/1/properties/1/photo.png");
        assertThat(photo.getContentType()).isEqualTo("image/png");
        assertThat(photo.getSizeBytes()).isEqualTo(1024L);
        assertThat(photo.getCreatedAt()).isEqualTo(CREATED_AT);
    }

    @Test
    void 저장된_사진을_복원한다() {
        PropertyPhoto photo = PropertyPhoto.reconstruct(
            10L, 1L, "members/1/properties/1/photo.heic", "image/heic", MAX_SIZE_BYTES, CREATED_AT);

        assertThat(photo.getId()).isEqualTo(10L);
        assertThat(photo.getContentType()).isEqualTo("image/heic");
        assertThat(photo.getSizeBytes()).isEqualTo(MAX_SIZE_BYTES);
    }

    @Test
    void 매물_ID가_없으면_예외가_발생한다() {
        assertErrorCode(
            () -> PropertyPhoto.create(null, "photo.png", "image/png", 1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    void 저장_키가_비어있으면_예외가_발생한다() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, " ", "image/png", 1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    void 콘텐츠_타입이_없으면_예외가_발생한다() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", null, 1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    void 지원하지_않는_콘텐츠_타입이면_예외가_발생한다() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.gif", "image/gif", 1L, CREATED_AT),
            DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED);
    }

    @Test
    void 사진_크기가_없거나_음수이면_예외가_발생한다() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", null, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", -1L, CREATED_AT),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @Test
    void 사진_크기가_5MiB를_초과하면_예외가_발생한다() {
        assertErrorCode(
            () -> PropertyPhoto.create(1L, "photo.png", "image/png", MAX_SIZE_BYTES + 1, CREATED_AT),
            DomainErrorCode.PHOTO_SIZE_EXCEEDED);
    }

    @Test
    void 생성_시각이_없으면_예외가_발생한다() {
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
