package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.promotion.domain.PromotionProduct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

final class SevenElevenPromotionFixtures {

    private SevenElevenPromotionFixtures() {
    }

    static String html(final String name) {
        try (var input = SevenElevenPromotionFixtures.class.getResourceAsStream("/promotion/seveneleven/" + name + ".html")) {
            if (input == null) {
                throw new IllegalArgumentException("fixture 없음: " + name);
            }
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException(exception);
        }
    }

    // 실제 첫 화면 39건 + 중복 제거 검증용 1건. 전체 수집 결과가 아니다.
    static List<PromotionProduct> sample() {
        SevenElevenPromotionParser parser = new SevenElevenPromotionParser();
        List<PromotionProduct> products = new ArrayList<>();
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            products.addAll(parser.parseFirst(html("tab" + tab.code() + "-first"), tab).products());
        }
        products.add(products.getFirst());
        return List.copyOf(products);
    }
}
