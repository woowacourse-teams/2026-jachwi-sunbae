package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// 세븐일레븐의 모든 행사 탭을 첫 화면부터 더보기 끝까지 수집한다.
// 더보기가 전체 수보다 일찍 짧게 끝나면, 탭마다 98% 이상 확보한 경우에만 부분 수집으로 인정한다.
public class SevenElevenPromotionFetcher implements PromotionFetcher {

    private static final Logger LOG = LoggerFactory.getLogger(SevenElevenPromotionFetcher.class);
    private static final int MAX_PAGE_COUNT = 250;
    private static final int MIN_PARTIAL_PERCENT = 98;

    private final SevenElevenPromotionClient client;
    private final SevenElevenPromotionParser parser = new SevenElevenPromotionParser();
    private final int maxPageCount;

    public SevenElevenPromotionFetcher(final SevenElevenPromotionClient client) {
        this(client, MAX_PAGE_COUNT);
    }

    SevenElevenPromotionFetcher(final SevenElevenPromotionClient client, final int maxPageCount) {
        if (maxPageCount < 1) {
            throw new IllegalArgumentException("최대 수집 페이지는 1 이상이어야 합니다.");
        }
        this.client = client;
        this.maxPageCount = maxPageCount;
    }

    @Override
    public ConvenienceBrand brand() {
        return ConvenienceBrand.SEVEN_ELEVEN;
    }

    @Override
    public List<PromotionProduct> fetch() {
        List<PromotionProduct> products = new ArrayList<>();
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            products.addAll(fetchTab(tab));
        }
        // 이름만으로 동일 상품을 판단할 수 없으므로 원본 중복을 보존한다.
        return List.copyOf(products);
    }

    private List<PromotionProduct> fetchTab(final SevenElevenPromotionTab tab) {
        SevenElevenPromotionParser.FirstPage first = parser.parseFirst(client.fetchFirst(tab), tab);
        int totalCount = first.totalCount();
        List<PromotionProduct> products = new ArrayList<>(first.products());
        // 첫 화면 이후 더보기는 2페이지부터 시작한다.
        for (int page = 2; products.size() < totalCount; page++) {
            if (page > maxPageCount) {
                throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                        "세븐일레븐 최대 수집 페이지를 초과했습니다. tab=" + tab + ", limit=" + maxPageCount);
            }
            int expectedCount = Math.min(tab.moreSize(), totalCount - products.size());
            List<PromotionProduct> next = parser.parseMore(client.fetchMore(tab, page), tab, page, expectedCount);
            products.addAll(next);
            if (next.size() < expectedCount) {
                // 짧은 응답 뒤에 상품이 더 있는지 확인할 수 없어 더 요청하지 않고 확보율로 판단한다.
                acceptPartial(tab, page, totalCount, products.size());
                return products;
            }
        }
        return products;
    }

    private void acceptPartial(final SevenElevenPromotionTab tab, final int page, final int totalCount,
                               final int collectedCount) {
        if ((long) collectedCount * 100 < (long) totalCount * MIN_PARTIAL_PERCENT) {
            throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                    "세븐일레븐 부분 수집 확보율이 기준보다 낮습니다. tab=" + tab + ", page=" + page
                            + ", totalCount=" + totalCount + ", collectedCount=" + collectedCount);
        }
        // 전체 수집과 구분할 수 있도록 누락 규모를 남긴다.
        LOG.atWarn()
                .addKeyValue("tab", tab.name())
                .addKeyValue("page", page)
                .addKeyValue("totalCount", totalCount)
                .addKeyValue("collectedCount", collectedCount)
                .addKeyValue("missingCount", totalCount - collectedCount)
                .log("promotion-seven-eleven-partial-collection");
    }
}
