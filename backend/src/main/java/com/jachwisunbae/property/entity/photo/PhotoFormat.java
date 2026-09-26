package com.jachwisunbae.property.entity.photo;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

public enum PhotoFormat {

    JPEG("image/jpeg", ".jpg", Set.of("jpeg", "jpg")),
    PNG("image/png", ".png", Set.of("png")),
    WEBP("image/webp", ".webp", Set.of("webp")),
    HEIC("image/heic", ".heic", Set.of("heic", "heix", "hevc", "hevx", "heim", "heis")),
    HEIF("image/heif", ".heif", Set.of("mif1", "msf1"));

    private final String contentType;
    private final String extension;
    private final Set<String> identifiers;

    PhotoFormat(final String contentType, final String extension, final Set<String> identifiers) {
        this.contentType = contentType;
        this.extension = extension;
        this.identifiers = identifiers;
    }

    public static PhotoFormat from(final String value) {
        if (value == null) {
            throw unsupportedContentType();
        }
        String contentType = value.toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
            .filter(format -> format.contentType.equals(contentType))
            .findFirst()
            .orElseThrow(PhotoFormat::unsupportedContentType);
    }

    public String contentType() {
        return contentType;
    }

    public String extension() {
        return extension;
    }

    public void validate(final byte[] bytes) {
        if (this == HEIC || this == HEIF) {
            validateHeifContainer(bytes);
            return;
        }
        validateImageIoFormat(bytes);
    }

    private void validateImageIoFormat(final byte[] bytes) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = Collections.emptyIterator();
            if (input != null) {
                readers = ImageIO.getImageReaders(input);
            }
            if (!readers.hasNext()) {
                throw invalidPhotoFormat();
            }
            ImageReader reader = readers.next();
            try {
                if (!identifiers.contains(reader.getFormatName().toLowerCase(Locale.ROOT))) {
                    throw invalidPhotoFormat();
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
                "손상되었거나 지원하지 않는 사진입니다.", exception);
        }
    }

    private void validateHeifContainer(final byte[] bytes) {
        if (bytes.length < 12 || !fourCc(bytes, 4).equals("ftyp")) {
            throw invalidPhotoFormat();
        }
        int boxSize = ((bytes[0] & 0xff) << 24)
            | ((bytes[1] & 0xff) << 16)
            | ((bytes[2] & 0xff) << 8)
            | (bytes[3] & 0xff);
        int end = Math.min(bytes.length, boxSize);
        for (int offset = 8; offset + 4 <= end; offset += 4) {
            if (offset != 12 && identifiers.contains(fourCc(bytes, offset))) {
                return;
            }
        }
        throw invalidPhotoFormat();
    }

    private static String fourCc(final byte[] bytes, final int offset) {
        return new String(bytes, offset, 4, StandardCharsets.US_ASCII);
    }

    private static BusinessException invalidPhotoFormat() {
        return new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
            "파일 내용과 사진 형식이 일치하지 않습니다.");
    }

    private static BusinessException unsupportedContentType() {
        return new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
            "JPEG, PNG, WebP, HEIC, HEIF 사진만 업로드할 수 있습니다.");
    }
}
