package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

// 세븐일레븐 첫 화면·더보기 HTML을 검증하고 공통 행사상품 모델로 변환한다.
class SevenElevenPromotionParser {

    private static final Pattern TOTAL_COUNT = Pattern.compile("var\\s+intTotalCount\\s*=\\s*\"([0-9]+)\"\\s*;");
    private static final int MAX_FIRST_PAGE_SIZE = 13;

    // 첫 화면은 탭 제목 항목 뒤에 상품 카드가 이어지고, 전체 상품 수를 스크립트 변수로 제공한다.
    FirstPage parseFirst(final String html, final SevenElevenPromotionTab tab) {
        Document document = document(html);
        if (!requireElement(document, "input#pTab").val().equals(tab.code())) {
            throw invalidResponse("요청한 행사 탭과 응답이 다릅니다. tab=" + tab);
        }
        for (int level = 1; level <= 3; level++) {
            if (!requireElement(document, "input#cateCd" + level).val().isEmpty()) {
                throw invalidResponse("전체 카테고리 요청에 분류 필터가 적용되어 있습니다.");
            }
        }
        int totalCount = readTotalCount(document);
        Element list = requireElement(document, "#listUl");
        Element title = list.children().first();
        if (title == null || !title.tagName().equals("li")
                || !title.text().replaceAll("(?U)\\s+", "").equals(tab.title())) {
            throw invalidResponse("행사 목록 제목이 올바르지 않습니다. tab=" + tab);
        }
        int pageSize = number(requireElement(document, "input#intPageSize").val());
        if (pageSize < 1 || pageSize > MAX_FIRST_PAGE_SIZE) {
            throw invalidResponse("첫 화면 크기가 확인한 범위를 벗어났습니다. pageSize=" + pageSize);
        }
        title.remove();
        List<PromotionProduct> products = products(list, tab);
        if (products.size() != Math.min(pageSize, totalCount)) {
            throw invalidResponse("첫 화면 상품 수가 전체 수·화면 크기와 다릅니다. tab=" + tab
                    + ", expected=" + Math.min(pageSize, totalCount) + ", actual=" + products.size());
        }
        return new FirstPage(products, totalCount);
    }

    // 더보기 응답은 상품 카드 li 조각이며, 다음 요청할 페이지 번호를 listPage로 제공한다.
    // 기대보다 적은 응답은 부분 수집 여부를 Fetcher가 판단하도록 반환하고, 빈 응답과 초과 응답만 거부한다.
    List<PromotionProduct> parseMore(final String html, final SevenElevenPromotionTab tab, final int requestedPage,
                                     final int expectedCount) {
        Document document = document(html);
        if (requestedPage < 2 || expectedCount < 1 || expectedCount > tab.moreSize()
                || number(requireElement(document, "input#listPage").val()) != requestedPage + 1) {
            throw invalidResponse("더보기 페이지 정보가 올바르지 않습니다. tab=" + tab + ", page=" + requestedPage);
        }
        // 실제 listCnt는 일부 페이지에서 누적 카드 수와 달라 형식만 확인하고 건수 판단에 쓰지 않는다.
        number(requireElement(document, "input#listCnt").val());
        List<PromotionProduct> products = products(document.body(), tab);
        if (products.isEmpty() || products.size() > expectedCount) {
            throw invalidResponse("더보기 상품 수가 남은 전체 수·페이지 크기와 다릅니다. tab=" + tab
                    + ", page=" + requestedPage + ", expectedCount=" + expectedCount
                    + ", actualCount=" + products.size());
        }
        return products;
    }

    private int readTotalCount(final Document document) {
        String scripts = document.select("script:not([src])").stream()
                .map(Element::data).reduce("", (left, right) -> left + "\n" + right);
        Matcher matcher = TOTAL_COUNT.matcher(scripts);
        Integer totalCount = null;
        while (matcher.find()) {
            int found = number(matcher.group(1));
            if (totalCount != null && totalCount != found) {
                throw invalidResponse("전체 상품 수 메타데이터가 서로 다릅니다.");
            }
            totalCount = found;
        }
        if (totalCount == null) {
            throw invalidResponse("전체 상품 수 메타데이터를 찾지 못했습니다.");
        }
        return totalCount;
    }

    // 직계 li 중 더보기 버튼을 뺀 항목만 상품 카드로 본다. 카드 안의 배지 li는 세지 않는다.
    private List<PromotionProduct> products(final Element root, final SevenElevenPromotionTab tab) {
        return root.children().stream()
                .filter(element -> element.tagName().equals("li") && !element.hasClass("btn_more"))
                .map(card -> parseProduct(card, tab))
                .toList();
    }

    private PromotionProduct parseProduct(final Element card, final SevenElevenPromotionTab tab) {
        String name = requireElement(card, ".infowrap .name").text().replaceAll("(?U)\\s+", " ").strip();
        // 할인 전 가격(del·s)과 숨김 텍스트를 제외한 판매가격이 하나여야 한다.
        List<Element> amounts = requireElement(card, ".infowrap .price").children().stream()
                .filter(element -> element.tagName().equals("span") && element.select("del, s").isEmpty()
                        && !element.hasClass("hide"))
                .toList();
        if (amounts.size() != 1) {
            throw invalidResponse("판매가격을 하나로 찾지 못했습니다. name=" + name);
        }
        String priceText = amounts.getFirst().text().strip();
        if (!priceText.matches("(?:0|[1-9][0-9]*|[1-9][0-9]{0,2}(?:,[0-9]{3})+)")) {
            throw invalidResponse("판매가격 형식이 올바르지 않습니다. price=" + priceText);
        }
        Element image = requireElement(card, ".pic_product img");
        // 빈 src는 absUrl이 페이지 주소로 바꾸므로 먼저 거부한다.
        if (image.attr("src").isBlank()) {
            throw invalidResponse("이미지 src가 비어 있습니다.");
        }
        String imageUrl = image.absUrl("src");
        long badges = card.select(".tag_list_01 > li").stream()
                .filter(element -> element.text().strip().equals(tab.badge()))
                .count();
        if (badges != 1) {
            throw invalidResponse("요청한 행사와 상품 배지가 다릅니다. tab=" + tab + ", name=" + name);
        }
        // 빈 상품명과 절대 HTTP가 아닌 이미지 주소는 도메인 검증에서 거부한다.
        try {
            return new PromotionProduct(ConvenienceBrand.SEVEN_ELEVEN, name, number(priceText.replace(",", "")),
                    imageUrl, ProductCategory.UNKNOWN, tab.promotionType());
        } catch (IllegalArgumentException exception) {
            throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                    "세븐일레븐 상품 정보가 올바르지 않습니다. name=" + name + ", image=" + imageUrl, exception);
        }
    }

    private Document document(final String html) {
        if (html == null || html.isBlank()) {
            throw invalidResponse("HTML 응답이 비어 있습니다.");
        }
        return Jsoup.parse(html, SevenElevenPromotionClient.BASE_URL + SevenElevenPromotionClient.FIRST_PATH);
    }

    private Element requireElement(final Element root, final String selector) {
        Elements elements = root.select(selector);
        if (elements.size() != 1) {
            throw invalidResponse("필수 HTML 요소를 하나로 찾지 못했습니다. selector=" + selector);
        }
        return elements.first();
    }

    private int number(final String text) {
        if (!text.matches("[0-9]+")) {
            throw invalidResponse("숫자 형식이 올바르지 않습니다. value=" + text);
        }
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException exception) {
            throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                    "세븐일레븐 숫자가 정수 범위를 벗어났습니다.", exception);
        }
    }

    private UpstreamServiceException invalidResponse(final String message) {
        return new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID, "세븐일레븐 " + message);
    }

    record FirstPage(List<PromotionProduct> products, int totalCount) {
        FirstPage {
            products = List.copyOf(products);
        }
    }
}
