package com.jachwisunbae.property.entity.photo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("PhotoFormat")
class PhotoFormatTest {

    private static final byte[] PNG = Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @ParameterizedTest(name = "{0}은 {1}이고 확장자는 {2}이다")
    @DisplayName("콘텐츠 타입으로 사진 형식과 확장자를 찾는다")
    @CsvSource({
        "image/jpeg, JPEG, .jpg",
        "image/png, PNG, .png",
        "image/webp, WEBP, .webp",
        "image/heic, HEIC, .heic",
        "image/heif, HEIF, .heif"
    })
    void findFormatAndExtension(final String contentType, final PhotoFormat expected, final String extension) {
        PhotoFormat format = PhotoFormat.from(contentType);

        assertThat(format).isEqualTo(expected);
        assertThat(format.contentType()).isEqualTo(contentType);
        assertThat(format.extension()).isEqualTo(extension);
    }

    @Test
    @DisplayName("지원하는 이미지 형식이면 검증에 성공한다")
    void validateSupportedImage() {
        assertThatCode(() -> PhotoFormat.PNG.validate(PNG)).doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "{0}은 {1} 브랜드를 허용한다")
    @DisplayName("HEIC·HEIF 컨테이너의 브랜드가 일치하면 검증에 성공한다")
    @CsvSource({"HEIC, heic", "HEIF, mif1"})
    void validateHeifContainer(final PhotoFormat format, final String brand) {
        assertThatCode(() -> format.validate(heifContainer(brand)))
            .doesNotThrowAnyException();
    }

    @ParameterizedTest(name = "[{index}] 지원하지 않는 타입: {0}")
    @DisplayName("지원하지 않는 콘텐츠 타입이면 예외가 발생한다")
    @NullAndEmptySource
    @ValueSource(strings = {"image/jpg", "image/gif"})
    void rejectUnsupportedContentType(final String contentType) {
        assertUnsupported(() -> PhotoFormat.from(contentType));
    }

    @Test
    @DisplayName("콘텐츠 타입과 실제 이미지 형식이 다르면 예외가 발생한다")
    void rejectMismatchedImageFormat() {
        assertUnsupported(() -> PhotoFormat.JPEG.validate(PNG));
    }

    @Test
    @DisplayName("손상된 이미지이면 예외가 발생한다")
    void rejectCorruptedImage() {
        assertUnsupported(() -> PhotoFormat.PNG.validate(new byte[] {1, 2, 3, 4}));
    }

    @ParameterizedTest(name = "{0}은 {1} 브랜드를 거부한다")
    @DisplayName("HEIC·HEIF 브랜드가 콘텐츠 타입과 다르면 예외가 발생한다")
    @CsvSource({"HEIC, mif1", "HEIF, heic"})
    void rejectMismatchedHeifBrand(final PhotoFormat format, final String brand) {
        assertUnsupported(() -> format.validate(heifContainer(brand)));
    }

    private void assertUnsupported(final org.assertj.core.api.ThrowableAssert.ThrowingCallable callable) {
        assertThatThrownBy(callable)
            .isInstanceOf(InvalidInputException.class)
            .extracting("errorCode")
            .isEqualTo(ErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED);
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
