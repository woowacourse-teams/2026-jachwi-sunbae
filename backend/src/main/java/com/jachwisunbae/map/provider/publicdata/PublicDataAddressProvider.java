package com.jachwisunbae.map.provider.publicdata;

import com.jachwisunbae.map.domain.MapAddress;
import com.jachwisunbae.map.provider.AddressProvider;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

// 매물 주소와 좌표는 DB에 저장되므로 결과 저장이 허용된 공공데이터(행안부, SGIS)로 조회한다.
@Component
@ConditionalOnProperty(name = "map.provider.mode", havingValue = "public")
public class PublicDataAddressProvider implements AddressProvider {

    private final JusoAddressClient jusoClient;
    private final SgisAddressClient sgisClient;

    public PublicDataAddressProvider(JusoAddressClient jusoClient, SgisAddressClient sgisClient) {
        this.jusoClient = jusoClient;
        this.sgisClient = sgisClient;
    }

    @Override
    public List<MapAddress> geocode(String query) {
        List<MapAddress> results = new ArrayList<>();
        for (JusoAddressSearchResponse.Address address : jusoClient.search(query).addresses()) {
            if (address.roadAddress() == null) {
                continue;
            }
            // 좌표를 찾지 못한 후보는 지도에 표시하거나 저장할 수 없으므로 제외한다.
            sgisClient.geocode(address.roadAddress()).ifPresent(coordinate -> results.add(new MapAddress(
                    address.roadAddress(), address.jibunAddress(), coordinate.latitude(), coordinate.longitude())));
        }
        return List.copyOf(results);
    }

    @Override
    public MapAddress reverseGeocode(BigDecimal latitude, BigDecimal longitude) {
        Optional<String> roadAddress = sgisClient.reverseGeocode(latitude, longitude);
        return new MapAddress(roadAddress.orElse(null), null, latitude, longitude);
    }
}
