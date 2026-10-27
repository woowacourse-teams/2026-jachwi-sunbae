package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

public class SevenElevenPromotionParser {

    FirstPage parseFirst(final String html, final SevenElevenPromotionTab tab) {
        Document document = document(html);
        if (!require(document, "input#pTab").val().equals(tab.code())) {
            throw invalid("요청한 행사 탭과 응답이 다릅니다.");
        }
        for (int level = 1; level <= 3; level++) {
            if (!require(document, "input#cateCd" + level).val().isEmpty()) {
                throw invalid("전체 카테고리 요청에 분류 필터가 적용되어 있습니다.");
            }
        }
        String scripts = document.select("script:not([src])").stream().map(Element::data)
                .reduce("", (left, right) -> left + "\n" + right);
        Matcher matcher = Pattern.compile("var\\s+intTotalCount\\s*=\\s*\"([0-9]+)\"\\s*;").matcher(scripts);
        Integer total = null;
        while (matcher.find()) {
            int found = number(matcher.group(1));
            if (total != null && total != found) {
                throw invalid("전체 상품 수 메타데이터가 서로 다릅니다.");
            }
            total = found;
        }
        if (total == null) {
            throw invalid("전체 상품 수 메타데이터가 없습니다.");
        }
        Element list = require(document, "#listUl");
        Element title = list.children().first();
        if (title == null || !title.tagName().equals("li")
                || !title.text().replaceAll("(?U)\\s+", "").equals(tab.title())) {
            throw invalid("행사 목록 제목이 올바르지 않습니다.");
        }
        int pageSize = number(require(document, "input#intPageSize").val());
        if (pageSize < 1 || pageSize > 13) {
            throw invalid("확인한 첫 화면 크기 범위를 벗어났습니다.");
        }
        title.remove();
        List<PromotionProduct> products = products(list, tab);
        if (products.size() != Math.min(pageSize, total)) {
            throw invalid("첫 화면 상품 수가 전체 수·페이지 크기와 다릅니다.");
        }
        return new FirstPage(products, total);
    }

    List<PromotionProduct> parseMore(final String html, final SevenElevenPromotionTab tab,
                                     final int page, final int expectedCount) {
        Document document = document(html);
        if (page < 2 || expectedCount < 1 || expectedCount > tab.pageSize()
                || number(require(document, "input#listPage").val()) != page + 1) {
            throw invalid("더보기 페이지 메타데이터가 올바르지 않습니다.");
        }
        // 실제 listCnt는 일부 페이지에서 카드 누적 수와 달랐다. 종료 기준으로 사용하지 않는다.
        number(require(document, "input#listCnt").val());
        List<PromotionProduct> products = products(document.body(), tab);
        if (products.size() != expectedCount) {
            throw invalid("더보기 상품 수가 남은 전체 수·페이지 크기와 다릅니다.");
        }
        return products;
    }

    private List<PromotionProduct> products(final Element root, final SevenElevenPromotionTab tab) {
        List<Element> cards = root.children().stream()
                .filter(element -> element.tagName().equals("li") && !element.hasClass("btn_more")).toList();
        if (tab == SevenElevenPromotionTab.GIFT && !cards.isEmpty()) {
            throw invalid("증정행사 카드·조건은 아직 검증하지 못했습니다. 기존 브랜드 데이터를 유지합니다.");
        }
        return cards.stream().map(card -> product(card, tab)).toList();
    }

    private PromotionProduct product(final Element card, final SevenElevenPromotionTab tab) {
        String name = require(card, ".infowrap .name").text().replaceAll("(?U)\\s+", " ").strip();
        Element price = require(card, ".infowrap .price");
        List<Element> amounts = price.children().stream().filter(element -> element.tagName().equals("span")
                && element.select("del, s").isEmpty() && !element.hasClass("hide")).toList();
        if (amounts.size() != 1) {
            throw invalid("판매가격을 하나로 찾지 못했습니다.");
        }
        String priceText = amounts.getFirst().text().strip();
        if (!priceText.matches("(?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+)")) {
            throw invalid("판매가격 형식이 올바르지 않습니다.");
        }
        Element image = require(card, ".pic_product img");
        if (image.attr("src").isBlank()) {
            throw invalid("이미지 src가 비어 있습니다.");
        }
        String expectedBadge = tab == SevenElevenPromotionTab.SALE ? "할인" : tab.title();
        long badges = card.select(".tag_list_01 > li").stream()
                .filter(element -> element.text().strip().equals(expectedBadge)).count();
        if (badges != 1) {
            throw invalid("요청한 행사와 상품 배지가 다릅니다.");
        }
        PromotionType type = switch (tab) {
            case ONE_PLUS_ONE -> PromotionType.ONE_PLUS_ONE;
            case TWO_PLUS_ONE -> PromotionType.TWO_PLUS_ONE;
            case SALE -> PromotionType.SALE;
            case GIFT -> throw invalid("증정행사 상품 변환은 아직 지원하지 않습니다.");
        };
        try {
            return new PromotionProduct(ConvenienceBrand.SEVEN_ELEVEN, name, number(priceText.replace(",", "")),
                    image.absUrl("src"), ProductCategory.UNKNOWN, type);
        } catch (IllegalArgumentException exception) {
            throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                    "세븐일레븐 상품 필드가 올바르지 않습니다.", exception);
        }
    }

    private Document document(final String html) {
        if (html == null || html.isBlank()) {
            throw invalid("HTML 응답이 비어 있습니다.");
        }
        return Jsoup.parse(html, SevenElevenPromotionClient.SOURCE_URL);
    }

    private Element require(final Element root, final String selector) {
        var elements = root.select(selector);
        if (elements.size() != 1) {
            throw invalid("필수 요소를 하나로 찾지 못했습니다. selector=" + selector);
        }
        return elements.first();
    }

    private int number(final String text) {
        try {
            if (!text.matches("[0-9]+")) {
                throw invalid("정수 메타데이터가 올바르지 않습니다.");
            }
            return Integer.parseInt(text);
        } catch (NumberFormatException exception) {
            throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                    "세븐일레븐 숫자가 정수 범위를 벗어났습니다.", exception);
        }
    }

    private UpstreamServiceException invalid(final String message) {
        return new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID, "세븐일레븐 " + message);
    }

    record FirstPage(List<PromotionProduct> products, int totalCount) {
        FirstPage {
            products = List.copyOf(products);
        }
    }
}
