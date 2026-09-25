package com.jachwisunbae.property.entity.photo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class PhotoFormatTest {

    private static final byte[] PNG = Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Test
    void 콘텐츠_타입으로_사진_형식을_찾는다() {
        PhotoFormat format = PhotoFormat.from("image/png");

        assertThat(format.contentType()).isEqualTo("image/png");
        assertThat(format.extension()).isEqualTo(".png");
    }

    @Test
    void 지원하는_이미지_형식이면_검증에_성공한다() {
        assertThatCode(() -> PhotoFormat.PNG.validate(PNG)).doesNotThrowAnyException();
    }

    @Test
    void HEIC_컨테이너이면_검증에_성공한다() {
        assertThatCode(() -> PhotoFormat.HEIC.validate(heifContainer("heic")))
            .doesNotThrowAnyException();
    }

    @Test
    void HEIF_컨테이너이면_검증에_성공한다() {
        assertThatCode(() -> PhotoFormat.HEIF.validate(heifContainer("mif1")))
            .doesNotThrowAnyException();
    }

    @Test
    void 지원하지_않는_콘텐츠_타입이면_예외가_발생한다() {
        assertUnsupported(() -> PhotoFormat.from("image/jpg"));
        assertUnsupported(() -> PhotoFormat.from(null));
    }

    @Test
    void 콘텐츠_타입과_실제_이미지_형식이_다르면_예외가_발생한다() {
        assertUnsupported(() -> PhotoFormat.JPEG.validate(PNG));
    }

    @Test
    void 손상된_이미지이면_예외가_발생한다() {
        assertUnsupported(() -> PhotoFormat.PNG.validate(new byte[] {1, 2, 3, 4}));
    }

    @Test
    void HEIC과_HEIF의_브랜드가_콘텐츠_타입과_다르면_예외가_발생한다() {
        assertUnsupported(() -> PhotoFormat.HEIC.validate(heifContainer("mif1")));
        assertUnsupported(() -> PhotoFormat.HEIF.validate(heifContainer("heic")));
    }

    private void assertUnsupported(final org.assertj.core.api.ThrowableAssert.ThrowingCallable callable) {
        assertThatThrownBy(callable)
            .isInstanceOf(BusinessException.class)
            .extracting("code")
            .isEqualTo(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED);
    }

    private byte[] heifContainer(final String brand) {
        return ByteBuffer.allocate(20)
            .putInt(20)
            .put("ftyp".getBytes(StandardCharsets.US_ASCII))
            .put(brand.getBytes(StandardCharsets.US_ASCII))
            .putInt(0)
            .put(brand.getBytes(StandardCharsets.US_ASCII))
            .array();
    }
}
