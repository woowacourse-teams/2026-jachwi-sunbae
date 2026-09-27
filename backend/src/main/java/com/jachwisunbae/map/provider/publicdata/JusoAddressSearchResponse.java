package com.jachwisunbae.map.provider.publicdata;

import java.util.List;

//행정안전부 도로명주소 API 응답
public record JusoAddressSearchResponse(List<Address> addresses) {
    /**
     * @param roadAddress  도로명주소 (예: 금토로80번길 40)
     * @param jibunAddress 지번주소 (예: 금토동 715)
     */
    public record Address(String roadAddress, String jibunAddress) {
    }
}
