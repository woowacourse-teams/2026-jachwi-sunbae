package com.jachwisunbae.support;

import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

// 스프링 컨텍스트를 만들기 전에 실행되어, 새 컨텍스트와 캐시된 컨텍스트 모두 비운 DB에서 시작한다.
public class ResetDatabaseExtension implements BeforeAllCallback {

    @Override
    public void beforeAll(final ExtensionContext context) {
        DatabaseReset.reset();
    }
}
