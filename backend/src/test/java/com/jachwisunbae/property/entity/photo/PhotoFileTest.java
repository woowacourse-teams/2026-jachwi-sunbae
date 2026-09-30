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

    private void assertSizeExceeded(final byte[] bytes) {
        assertThatThrownBy(() -> new PhotoFile(bytes, "image/png"))
            .isInstanceOf(BusinessException.class)
            .extracting("code")
            .isEqualTo(DomainErrorCode.PHOTO_FILE_SIZE_INVALID);
    }

}
