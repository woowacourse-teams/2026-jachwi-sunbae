package com.jachwisunbae.admin.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jachwisunbae.admin.auth.AdminAccessCodes;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.web.ApiRequestPath;
import com.jachwisunbae.common.web.error.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class AdminAuthenticationFilter extends OncePerRequestFilter {

    private final AdminAccessCodes codes;
    private final ObjectMapper objectMapper;

    public AdminAuthenticationFilter(AdminAccessCodes codes, ObjectMapper objectMapper) {
        this.codes = codes;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !ApiRequestPath.isWithin(request, "/api/admin");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Admin ")
                || !codes.matches(authorization.substring("Admin ".length()))) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding("UTF-8");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), new ErrorResponse(
                    ErrorCode.ADMIN_ACCESS_DENIED.name(), ErrorCode.ADMIN_ACCESS_DENIED.publicMessage()));
            return;
        }
        chain.doFilter(request, response);
    }
}
