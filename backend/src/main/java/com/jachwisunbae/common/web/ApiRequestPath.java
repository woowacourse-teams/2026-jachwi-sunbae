package com.jachwisunbae.common.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.util.UrlPathHelper;

// 인증 필터와 MVC가 세미콜론 경로 파라미터·URL 인코딩·context path를 같은 경계로 해석하게 한다.
public final class ApiRequestPath {

    private ApiRequestPath() {
    }

    public static String resolve(HttpServletRequest request) {
        return UrlPathHelper.defaultInstance.getPathWithinApplication(request);
    }

    public static boolean isWithin(HttpServletRequest request, String boundary) {
        String path = resolve(request);
        return path.equals(boundary) || path.startsWith(boundary + "/");
    }
}
