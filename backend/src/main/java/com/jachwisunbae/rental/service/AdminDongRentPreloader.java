package com.jachwisunbae.rental.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

// 웹 서버가 뜰 때 저장된 행정동 월세 시세를 메모리에 올린다. 적재 모드(web-application-type=none)에서는 만들지 않는다.
// DB를 읽지 못해도 서버는 그대로 띄우고, 시세 없이 응답한다. 다시 읽으려면 서버를 재시작한다.
@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AdminDongRentPreloader {

    private static final Logger LOG = LoggerFactory.getLogger(AdminDongRentPreloader.class);

    private final AdminDongRentService adminDongRentService;

    public AdminDongRentPreloader(final AdminDongRentService adminDongRentService) {
        this.adminDongRentService = adminDongRentService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void preload() {
        try {
            int count = adminDongRentService.load();
            LOG.info("행정동 월세 시세를 메모리에 올렸습니다. adminDongs={}", count);
        } catch (RuntimeException exception) {
            LOG.warn("행정동 월세 시세를 읽지 못해 시세 없이 응답합니다. reason={}", exception.getMessage());
        }
    }
}
