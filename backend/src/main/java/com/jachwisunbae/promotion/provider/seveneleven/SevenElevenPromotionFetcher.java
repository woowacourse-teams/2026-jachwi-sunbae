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
import org.springframework.stereotype.Component;

@Component
public class SevenElevenPromotionFetcher implements PromotionFetcher {

    private static final Logger LOG = LoggerFactory.getLogger(SevenElevenPromotionFetcher.class);
    private static final int MAX_PAGE_COUNT = 250;
    private final SevenElevenPromotionClient client;
    private final SevenElevenPromotionParser parser = new SevenElevenPromotionParser();

    public SevenElevenPromotionFetcher(final SevenElevenPromotionClient client) {
        this.client = client;
    }

    @Override
    public ConvenienceBrand brand() {
        return ConvenienceBrand.SEVEN_ELEVEN;
    }

    @Override
    public List<PromotionProduct> fetch() {
        long startedAt = System.nanoTime();
        List<PromotionProduct> products = new ArrayList<>();
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            int page = 1;
            try {
                SevenElevenPromotionParser.FirstPage first = parser.parseFirst(client.fetchFirst(tab), tab);
                List<PromotionProduct> tabProducts = new ArrayList<>(first.products());
                logPage(tab, page, first.products().size(), tabProducts.size(), first.totalCount());
                for (page = 2; tabProducts.size() < first.totalCount(); page++) {
                    if (page > MAX_PAGE_COUNT) {
                        throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                                "세븐일레븐 최대 페이지 초과. tab=" + tab + ", limit=" + MAX_PAGE_COUNT);
                    }
                    int expected = Math.min(tab.pageSize(), first.totalCount() - tabProducts.size());
                    List<PromotionProduct> next = parser.parseMore(client.fetchMore(tab, page), tab, page, expected);
                    tabProducts.addAll(next);
                    logPage(tab, page, next.size(), tabProducts.size(), first.totalCount());
                }
                products.addAll(tabProducts);
            } catch (RuntimeException exception) {
                LOG.warn("promotion-fetch-failed brand=SEVEN_ELEVEN tab={} page={} exceptionType={} elapsedMillis={}",
                        tab, page, exception.getClass().getSimpleName(), (System.nanoTime() - startedAt) / 1_000_000);
                throw exception;
            }
        }
        LOG.info("promotion-fetch-completed brand=SEVEN_ELEVEN rawCount={} elapsedMillis={}",
                products.size(), (System.nanoTime() - startedAt) / 1_000_000);
        return List.copyOf(products);
    }

    private void logPage(final SevenElevenPromotionTab tab, final int page, final int count,
                         final int cumulativeCount, final int totalCount) {
        LOG.info("promotion-page-parsed brand=SEVEN_ELEVEN tab={} page={} pageCount={} cumulativeCount={} totalCount={}",
                tab, page, count, cumulativeCount, totalCount);
    }
}
