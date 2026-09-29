package com.jachwisunbae.property.storage;

public record PhotoContent(byte[] bytes, String contentType) {

    public PhotoContent {
        bytes = bytes.clone();
    }

    public byte[] bytes() {
        return bytes.clone();
    }
}
