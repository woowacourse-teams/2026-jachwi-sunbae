package com.jachwisunbae.promotion.provider.seveneleven;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
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

    // 실제 첫 화면의 전체 상품 수만 바꾼다.
    static String first(final SevenElevenPromotionTab tab, final int totalCount) {
        return html("tab" + tab.code() + "-first")
                .replaceAll("var intTotalCount = \"[0-9]+\";", "var intTotalCount = \"" + totalCount + "\";");
    }

    // 실제 1+1 더보기 응답에서 상품 수·페이지 번호·배지를 바꾼다.
    static String more(final SevenElevenPromotionTab tab, final int page, final int count) {
        Document document = Jsoup.parse(html("tab1-page2").replace(">1+1</li>", ">" + tab.badge() + "</li>"));
        List<Element> cards = document.body().children().stream()
                .filter(element -> element.tagName().equals("li") && !element.hasClass("btn_more"))
                .toList();
        cards.subList(count, cards.size()).forEach(Element::remove);
        document.selectFirst("#listPage").val(String.valueOf(page + 1));
        return document.body().html();
    }
}
