package com.jachwisunbae.property.entity.photo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.util.Arrays;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class PhotoFileTest {

    private static final int MAX_SIZE_BYTES = 5 * 1024 * 1024;
    private static final byte[] PNG = Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Test
    void 사진_파일의_SHA_256_체크섬을_계산한다() {
        PhotoFile photoFile = new PhotoFile(PNG, "image/png");

        assertThat(photoFile.checksum())
            .isEqualTo("431ced6916a2a21a156e38701afe55bbd7f88969fbbfc56d7fe099d47f265460");
    }

    @Test
    void 사진_크기가_정확히_5MiB이면_허용한다() {
        byte[] maximumSizePng = Arrays.copyOf(PNG, MAX_SIZE_BYTES);

        PhotoFile photoFile = new PhotoFile(maximumSizePng, "image/png");

        assertThat(photoFile.size()).isEqualTo(MAX_SIZE_BYTES);
    }

    @Test
    void 사진이_비어있거나_5MiB를_초과하면_예외가_발생한다() {
        assertSizeExceeded(null);
        assertSizeExceeded(new byte[0]);
        assertSizeExceeded(new byte[MAX_SIZE_BYTES + 1]);
    }

    @Test
    void 사진_바이트는_외부_변경으로부터_보호된다() {
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
            .isEqualTo(DomainErrorCode.PHOTO_LIMIT_EXCEEDED);
    }

}
