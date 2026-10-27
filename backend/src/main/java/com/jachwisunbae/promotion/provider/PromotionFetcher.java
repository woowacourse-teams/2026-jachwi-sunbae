package com.jachwisunbae.promotion.provider;

import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import java.util.List;

public interface PromotionFetcher {

    ConvenienceBrand brand();

    List<PromotionProduct> fetch();
}
