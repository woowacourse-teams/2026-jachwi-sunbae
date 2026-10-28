package com.jachwisunbae.promotion.provider.seveneleven;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;

// 2026-10-29 세븐일레븐 공식 홈페이지에서 확보한 응답 HTML이다.
final class SevenElevenPromotionFixtures {

    private SevenElevenPromotionFixtures() {
    }

    static String html(final String name) {
        try {
            return new ClassPathResource("promotion/seveneleven/" + name + ".html")
                    .getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
