package com.jachwisunbae.deliverydiscount.service;

import com.jachwisunbae.deliverydiscount.domain.DeliveryDiscountOffer;
import com.jachwisunbae.deliverydiscount.repository.JdbcDeliveryDiscountOfferRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Service;

// 한국 날짜 기준으로 오늘 이용할 수 있는 배달 할인정보를 조회한다.
@Service
public class DeliveryDiscountOfferQueryService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final JdbcDeliveryDiscountOfferRepository repository;
    private final Clock clock;

    public DeliveryDiscountOfferQueryService(final JdbcDeliveryDiscountOfferRepository repository, final Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    // 서버 시간대와 관계없이 KST 날짜를 기준으로 한다.
    public List<DeliveryDiscountOffer> findAvailable() {
        return repository.findAvailableOn(LocalDate.now(clock.withZone(KST)));
    }
}
