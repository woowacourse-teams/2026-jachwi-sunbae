package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.UpstreamServiceException;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SevenElevenPromotionFetcher implements PromotionFetcher {

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
        List<PromotionProduct> products = new ArrayList<>();
        for (SevenElevenPromotionTab tab : SevenElevenPromotionTab.values()) {
            SevenElevenPromotionParser.FirstPage first = parser.parseFirst(client.fetchFirst(tab), tab);
            List<PromotionProduct> tabProducts = new ArrayList<>(first.products());
            for (int page = 2; tabProducts.size() < first.totalCount(); page++) {
                if (page > MAX_PAGE_COUNT) {
                    throw new UpstreamServiceException(ErrorCode.PROMOTION_RESPONSE_INVALID,
                            "세븐일레븐 최대 페이지 초과. tab=" + tab + ", limit=" + MAX_PAGE_COUNT);
                }
                int expected = Math.min(tab.pageSize(), first.totalCount() - tabProducts.size());
                tabProducts.addAll(parser.parseMore(client.fetchMore(tab, page), tab, page, expected));
            }
            products.addAll(tabProducts);
        }
        return List.copyOf(products);
    }
}
