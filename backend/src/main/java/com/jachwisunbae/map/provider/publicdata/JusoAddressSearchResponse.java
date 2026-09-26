package com.jachwisunbae.map.provider.publicdata;

import java.util.List;

public record JusoAddressSearchResponse(List<Address> addresses) {

    public record Address(String roadAddress, String jibunAddress) {
    }
}
