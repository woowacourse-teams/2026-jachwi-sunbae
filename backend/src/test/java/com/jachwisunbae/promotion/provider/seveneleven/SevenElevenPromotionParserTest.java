package com.jachwisunbae.promotion.provider.seveneleven;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionType;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class SevenElevenPromotionParserTest {

    private final SevenElevenPromotionParser parser = new SevenElevenPromotionParser();

    @ParameterizedTest
    @EnumSource(SevenElevenPromotionTab.class)
    void readsCapturedFirstPages(final SevenElevenPromotionTab tab) {
        var result = parser.parseFirst(SevenElevenPromotionFixtures.html("tab" + tab.code() + "-first"), tab);
        int total = switch (tab) {
            case ONE_PLUS_ONE -> 919;
            case TWO_PLUS_ONE -> 926;
            case GIFT -> 0;
            case SALE -> 484;
        };
        assertThat(result.totalCount()).isEqualTo(total);
        assertThat(result.products()).hasSize(tab == SevenElevenPromotionTab.GIFT ? 0 : 13);
        assertThat(result.products()).allSatisfy(product -> {
            assertThat(product.brand()).isEqualTo(ConvenienceBrand.SEVEN_ELEVEN);
            assertThat(product.category()).isEqualTo(ProductCategory.UNKNOWN);
            assertThat(product.imageUrl()).startsWith("https://www.7-eleven.co.kr/upload/product/");
        });
        if (tab == SevenElevenPromotionTab.SALE) {
            assertThat(result.products().getFirst().name()).isEqualTo("남양)딸기에몽190ml");
            assertThat(result.products().getFirst().price()).isEqualTo(1400);
            assertThat(result.products().getFirst().promotionType()).isEqualTo(PromotionType.SALE);
        }
    }

    @Test
    void readsMoreFragmentWithoutCountingNestedBadgesOrOldPrice() {
        var products = parser.parseMore(SevenElevenPromotionFixtures.html("tab1-page2"),
                SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 10);
        assertThat(products).hasSize(10);
        assertThat(products.getFirst().name()).isEqualTo("남양)아몬드데이언스위트190ml");
        assertThat(products.getFirst().price()).isEqualTo(1700);
        assertThat(products).allSatisfy(product -> assertThat(product.promotionType()).isEqualTo(PromotionType.ONE_PLUS_ONE));
    }

    @Test
    void usesSalePriceWhenOriginalPriceIsAlsoPresent() {
        String html = SevenElevenPromotionFixtures.html("tab4-first")
                .replace("<span>1,400</span>", "<span><del>1,600</del></span><span>1,400</span>");
        assertThat(parser.parseFirst(html, SevenElevenPromotionTab.SALE).products().getFirst().price()).isEqualTo(1400);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "<html>차단 안내</html>"})
    void rejectsMissingResponse(final String html) {
        assertThatThrownBy(() -> parser.parseFirst(html, SevenElevenPromotionTab.ONE_PLUS_ONE))
                .isInstanceOf(UpstreamServiceException.class);
    }

    @ParameterizedTest
    @MethodSource("brokenFirstPages")
    void rejectsMalformedFieldsInsteadOfSkippingOrGuessing(final UnaryOperator<String> mutation) {
        String html = mutation.apply(SevenElevenPromotionFixtures.html("tab1-first"));
        assertThatThrownBy(() -> parser.parseFirst(html, SevenElevenPromotionTab.ONE_PLUS_ONE))
                .isInstanceOfSatisfying(UpstreamServiceException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROMOTION_RESPONSE_INVALID));
    }

    static Stream<UnaryOperator<String>> brokenFirstPages() {
        return Stream.of(
                html -> html.replace("value=\"1\"", "value=\"2\""),
                html -> html.replace("id=\"cateCd1\" value=\"\"", "id=\"cateCd1\" value=\"123\""),
                html -> html.replace("var intTotalCount = \"919\";", ""),
                html -> html.replace("</script>", "var intTotalCount = \"920\";</script>"),
                html -> html.replace("value=\"13\"", "value=\"10000\""),
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
    void rejectsUnexpectedGiftCardsUntilTheirConditionsAreVerified() {
        String html = SevenElevenPromotionFixtures.html("tab1-first")
                .replace("value=\"1\"", "value=\"3\"").replace("1+1", "증정행사");
        assertThatThrownBy(() -> parser.parseFirst(html, SevenElevenPromotionTab.GIFT))
                .isInstanceOf(UpstreamServiceException.class).hasMessageContaining("증정행사 카드·조건");
    }

    @Test
    void rejectsTruncatedCumulativeOrWrongPageFragments() {
        String html = SevenElevenPromotionFixtures.html("tab1-page2");
        assertThatThrownBy(() -> parser.parseMore(html, SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 9))
                .isInstanceOf(UpstreamServiceException.class);
        assertThatThrownBy(() -> parser.parseMore(html, SevenElevenPromotionTab.ONE_PLUS_ONE, 3, 10))
                .isInstanceOf(UpstreamServiceException.class);
        assertThatThrownBy(() -> parser.parseMore(html + html, SevenElevenPromotionTab.ONE_PLUS_ONE, 2, 10))
                .isInstanceOf(UpstreamServiceException.class);
    }
}
