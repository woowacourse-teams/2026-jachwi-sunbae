package com.jachwisunbae.promotion.provider.seveneleven;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import java.util.List;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class SevenElevenPromotionParserTest {

    private final SevenElevenPromotionParser parser = new SevenElevenPromotionParser();

    @ParameterizedTest
    @MethodSource("firstPages")
    @DisplayName("실제 첫 화면에서 전체 상품 수와 13개 상품을 행사 유형·UNKNOWN 카테고리로 변환한다")
    void parsesCapturedFirstPages(final SevenElevenPromotionTab tab, final int totalCount, final PromotionType type) {
        SevenElevenPromotionParser.FirstPage page =
                parser.parseFirst(SevenElevenPromotionFixtures.html("tab" + tab.code() + "-first"), tab);

        assertThat(page.totalCount()).isEqualTo(totalCount);
        assertThat(page.products()).hasSize(13).allSatisfy(product -> {
            assertThat(product.brand()).isEqualTo(ConvenienceBrand.SEVEN_ELEVEN);
            assertThat(product.category()).isEqualTo(ProductCategory.UNKNOWN);
            assertThat(product.promotionType()).isEqualTo(type);
            assertThat(product.imageUrl()).startsWith("https://www.7-eleven.co.kr/upload/product/");
        });
    }

    static Stream<Arguments> firstPages() {
        return Stream.of(
                Arguments.of(SevenElevenPromotionTab.ONE_PLUS_ONE, 919, PromotionType.ONE_PLUS_ONE),
                Arguments.of(SevenElevenPromotionTab.TWO_PLUS_ONE, 926, PromotionType.TWO_PLUS_ONE),
                Arguments.of(SevenElevenPromotionTab.SALE, 484, PromotionType.SALE));
    }

    @Test
    @DisplayName("첫 상품의 이름·가격·이미지를 그대로 읽는다")
    void parsesProductFields() {
        PromotionProduct product = parser.parseFirst(SevenElevenPromotionFixtures.html("tab1-first"),
                SevenElevenPromotionTab.ONE_PLUS_ONE).products().getFirst();

        assertThat(product).isEqualTo(new PromotionProduct(ConvenienceBrand.SEVEN_ELEVEN, "빙그레)래핑카우8포션치즈120g",
                7800, "https://www.7-eleven.co.kr/upload/product/3073780/886840.1.jpg", ProductCategory.UNKNOWN,
                PromotionType.ONE_PLUS_ONE));
    }

    @Test
    @DisplayName("할인 전 가격이 함께 있으면 판매가격만 읽는다")
    void usesSalePriceWhenOriginalPriceIsPresent() {
        String html = SevenElevenPromotionFixtures.html("tab4-first")
                .replace("<span>1,400</span>", "<span><del>1,600</del></span><span>1,400</span>");

        PromotionProduct product = parser.parseFirst(html, SevenElevenPromotionTab.SALE).products().getFirst();

        assertThat(product.name()).isEqualTo("남양)딸기에몽190ml");
        assertThat(product.price()).isEqualTo(1400);
    }

    @Test
    @DisplayName("더보기 응답에서 카드 안의 배지 li와 더보기 버튼을 상품으로 세지 않는다")
    void parsesMoreFragment() {
        List<PromotionProduct> products = parser.parseMore(SevenElevenPromotionFixtures.html("tab1-page2"),
                SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 10);

        assertThat(products).hasSize(10)
                .allSatisfy(product -> assertThat(product.promotionType()).isEqualTo(PromotionType.ONE_PLUS_ONE));
        assertThat(products.getFirst().name()).isEqualTo("남양)아몬드데이언스위트190ml");
        assertThat(products.getFirst().price()).isEqualTo(1700);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "<html>차단 안내</html>"})
    @DisplayName("비어 있거나 행사 목록이 아닌 응답은 거부한다")
    void rejectsMissingResponse(final String html) {
        assertInvalid(() -> parser.parseFirst(html, SevenElevenPromotionTab.ONE_PLUS_ONE));
    }

    @ParameterizedTest
    @MethodSource("brokenFirstPages")
    @DisplayName("필드 하나라도 형식이 다르면 건너뛰거나 추정하지 않고 전체를 거부한다")
    void rejectsMalformedFirstPage(final UnaryOperator<String> mutation) {
        String html = mutation.apply(SevenElevenPromotionFixtures.html("tab1-first"));

        assertInvalid(() -> parser.parseFirst(html, SevenElevenPromotionTab.ONE_PLUS_ONE));
    }

    static Stream<UnaryOperator<String>> brokenFirstPages() {
        return Stream.of(
                html -> html.replace("value=\"1\"", "value=\"2\""),
                html -> html.replace("id=\"cateCd1\" value=\"\"", "id=\"cateCd1\" value=\"123\""),
                html -> html.replace("var intTotalCount = \"919\";", ""),
                html -> html.replace("</script>", "var intTotalCount = \"920\";</script>"),
                html -> html.replace("value=\"13\"", "value=\"10000\""),
                html -> html.replace("<span class=\"img_list_tit_02\">1+1</span>", "<span>2+1</span>"),
                html -> html.replace("7,800", "7,8"),
                html -> html.replace("7,800", "가격미정"),
                html -> html.replace("7,800", "2147483648"),
                html -> html.replace("7,800", "-100"),
                html -> html.replace("빙그레)래핑카우8포션치즈120g</div>", " </div>"),
                html -> html.replace("src=\"/upload/product/3073780/886840.1.jpg\"", "src=\"\""),
                html -> html.replace("src=\"/upload/product/3073780/886840.1.jpg\"", "src=\"javascript:void(0)\""),
                html -> html.replace("class='ico_tag_06'>1+1", "class='ico_tag_06'>2+1"),
                html -> html.replace("class='price'", "class='missing-price'"));
    }

    @Test
    @DisplayName("더보기 응답의 페이지 번호나 상품 수가 기대와 다르면 거부한다")
    void rejectsWrongMoreFragment() {
        String html = SevenElevenPromotionFixtures.html("tab1-page2");

        assertInvalid(() -> parser.parseMore(html, SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 9));
        assertInvalid(() -> parser.parseMore(html, SevenElevenPromotionTab.ONE_PLUS_ONE, 3, 10));
        assertInvalid(() -> parser.parseMore(html + html, SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 10));
    }

    @Test
    @DisplayName("실제 할인행사 48페이지처럼 기대보다 짧은 응답은 부분 수집 판단을 위해 그대로 반환한다")
    void returnsShortSaleResponse() {
        // 2026-10-29: 전체 484건 중 47페이지까지 473건. 48페이지는 기대한 10건 대신 7건을 반환했다.
        String html = SevenElevenPromotionFixtures.html("sale-short-before-total");

        assertThat(parser.parseMore(html, SevenElevenPromotionTab.SALE, 48, 10)).hasSize(7)
                .allSatisfy(product -> assertThat(product.promotionType()).isEqualTo(PromotionType.SALE));
    }

    @Test
    @DisplayName("상품이 없는 더보기 응답은 거부한다")
    void rejectsEmptyMoreFragment() {
        assertInvalid(() -> parser.parseMore(SevenElevenPromotionFixtures.more(SevenElevenPromotionTab.ONE_PLUS_ONE,
                2, 0), SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 10));
    }

    private void assertInvalid(final Runnable parsing) {
        assertThatThrownBy(parsing::run).isInstanceOfSatisfying(UpstreamServiceException.class,
                exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID));
    }
}
