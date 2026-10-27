package com.jachwisunbae.promotion.provider;

import com.jachwisunbae.promotion.domain.PromotionProduct;
import java.util.List;

public interface PromotionFetcher {

    List<PromotionProduct> fetch();
}
