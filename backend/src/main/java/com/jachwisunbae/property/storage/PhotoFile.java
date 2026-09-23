package com.jachwisunbae.property.storage;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

public record PhotoFile(byte[] bytes, String contentType) {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
        "image/jpeg", ".jpg",
        "image/png", ".png",
        "image/webp", ".webp"
    );

    public PhotoFile {
        bytes = validateBytes(bytes);
        contentType = validateContentType(contentType);
        validateImageFormat(bytes, contentType);
    }

    public byte[] bytes() {
        return bytes.clone();
    }

    public long size() {
        return bytes.length;
    }

    public String extension() {
        return EXTENSIONS.get(contentType);
    }

    public String checksum() {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", exception);
        }
    }

    private static byte[] validateBytes(final byte[] bytes) {
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_SIZE_BYTES) {
            throw new BusinessException(DomainErrorCode.PHOTO_SIZE_EXCEEDED,
                "사진은 1바이트 이상 5MiB 이하여야 합니다.");
        }
        return bytes.clone();
    }

    private static String validateContentType(final String value) {
        String contentType = value == null ? "" : value.toLowerCase(Locale.ROOT);
        if (!EXTENSIONS.containsKey(contentType)) {
            throw new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
                "JPEG, PNG, WebP 사진만 업로드할 수 있습니다.");
        }
        return contentType;
    }

    private static void validateImageFormat(final byte[] bytes, final String contentType) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = input == null ? Collections.emptyIterator() : ImageIO.getImageReaders(input);

            if (!readers.hasNext()) {
                throw new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
                    "파일 내용과 사진 형식이 일치하지 않습니다.");
            }
            ImageReader reader = readers.next();
            try {
                if (!matches(reader.getFormatName(), contentType)) {
                    throw new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
                        "파일 내용과 사진 형식이 일치하지 않습니다.");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new BusinessException(DomainErrorCode.PHOTO_CONTENT_TYPE_UNSUPPORTED,
                "손상되었거나 지원하지 않는 사진입니다.", exception);
        }
    }

    private static boolean matches(final String formatName, final String contentType) {
        String format = formatName.toLowerCase(Locale.ROOT);
        return switch (contentType) {
            case "image/jpeg" -> format.equals("jpeg") || format.equals("jpg");
            case "image/png" -> format.equals("png");
            case "image/webp" -> format.equals("webp");
            default -> false;
        };
    }

}
