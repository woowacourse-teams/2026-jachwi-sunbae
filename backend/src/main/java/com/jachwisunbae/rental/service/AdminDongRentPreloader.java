package com.jachwisunbae.rental.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

// 웹 서버가 뜰 때 행정동 월세 시세를 미리 계산해, 첫 탐색 요청이 계산을 기다리지 않게 한다.
// 적재 모드(web-application-type=none)에서는 만들지 않는다.
@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AdminDongRentPreloader {

    private final AdminDongRentService adminDongRentService;

    public AdminDongRentPreloader(final AdminDongRentService adminDongRentService) {
        this.adminDongRentService = adminDongRentService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void preload() {
        adminDongRentService.findRents();
    }
}
