package com.jachwisunbae.map;

import java.util.List;

public record JusoAddressSearchResponse(List<Address> addresses) {

    public record Address(String roadAddress, String jibunAddress) {
    }
}
