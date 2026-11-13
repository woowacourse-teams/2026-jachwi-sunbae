package com.jachwisunbae.admin.support;

import java.util.stream.Collectors;
import java.util.stream.IntStream;

public final class AdminTestCodes {

    private AdminTestCodes() {
    }

    public static String code(int index) {
        return "test-only-admin-code-" + index;
    }

    public static String configured() {
        return IntStream.range(0, 10).mapToObj(AdminTestCodes::code).collect(Collectors.joining(","));
    }
}
