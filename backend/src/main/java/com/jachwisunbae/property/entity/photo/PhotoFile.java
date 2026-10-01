package com.jachwisunbae.property.entity.photo;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;

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

    private static byte[] validateBytes(final byte[] bytes) {
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_SIZE_BYTES) {
            throw new InvalidInputException(ErrorCode.PHOTO_FILE_SIZE_INVALID,
                "사진은 1바이트 이상 5MiB 이하여야 합니다.");
        }
        return bytes.clone();
    }

}
