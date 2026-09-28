package com.jachwisunbae.property.entity.photo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.util.Arrays;
import java.util.Base64;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("PhotoFile")
class PhotoFileTest {

    private static final int MAX_SIZE_BYTES = 5 * 1024 * 1024;
    private static final byte[] PNG = Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Test
    @DisplayName("사진 파일의 SHA-256 체크섬을 계산한다")
    void calculateChecksum() {
        PhotoFile photoFile = new PhotoFile(PNG, "image/png");

        assertThat(photoFile.checksum())
            .isEqualTo("431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460");
    }

    @Test
    @DisplayName("사진 크기가 정확히 5MiB이면 허용한다")
    void acceptMaximumSize() {
        byte[] maximumSizePng = Arrays.copyOf(PNG, MAX_SIZE_BYTES);

        PhotoFile photoFile = new PhotoFile(maximumSizePng, "image/png");

        assertThat(photoFile.size()).isEqualTo(MAX_SIZE_BYTES);
    }

    @Test
    @DisplayName("사진이 비어 있거나 5MiB를 초과하면 예외가 발생한다")
    void rejectInvalidSize() {
        assertSizeExceeded(new byte[0]);
        assertSizeExceeded(new byte[MAX_SIZE_BYTES + 1]);
    }

    @Test
    @DisplayName("사진 바이트는 외부 변경으로부터 보호된다")
    void protectBytesFromExternalChanges() {
        byte[] source = PNG.clone();
        PhotoFile photoFile = new PhotoFile(source, "image/png");
        byte firstByte = photoFile.bytes()[0];

        source[0] = 0;
        byte[] exposed = photoFile.bytes();
        exposed[0] = 0;

        assertThat(photoFile.bytes()[0]).isEqualTo(firstByte);
    }

    private void assertSizeExceeded(final byte[] bytes) {
        assertThatThrownBy(() -> new PhotoFile(bytes, "image/png"))
            .isInstanceOf(BusinessException.class)
            .extracting("code")
            .isEqualTo(DomainErrorCode.PHOTO_SIZE_EXCEEDED);
    }

}
