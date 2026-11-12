package com.jachwisunbae.admin.auth;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminAccessCodes {

    private final List<String> codes;

    public AdminAccessCodes(@Value("${ADMIN_ACCESS_CODES:}") String configuredCodes) {
        codes = Arrays.stream(configuredCodes.split(","))
                .map(String::trim)
                .filter(code -> !code.isEmpty())
                .toList();
    }

    public boolean matches(String code) {
        return code != null && !code.isBlank() && codes.contains(code);
    }
}
