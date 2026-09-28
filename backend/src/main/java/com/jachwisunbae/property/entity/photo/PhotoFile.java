package com.jachwisunbae.property.entity.photo;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public class PhotoFile {

    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    private final byte[] bytes;
    private final PhotoFormat format;

    public PhotoFile(final byte[] bytes, final String contentType) {
        this.bytes = validateBytes(bytes);
        this.format = PhotoFormat.from(contentType);
        format.validate(this.bytes);
    }

    public byte[] bytes() {
        return bytes.clone();
    }

    public String getContentType() {
        return format.contentType();
    }

    public long size() {
        return bytes.length;
    }

    public String extension() {
        return format.extension();
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
            throw new BusinessException(DomainErrorCode.PHOTO_FILE_SIZE_INVALID,
                "사진은 1바이트 이상 5MiB 이하여야 합니다.");
        }
        return bytes.clone();
    }

}
