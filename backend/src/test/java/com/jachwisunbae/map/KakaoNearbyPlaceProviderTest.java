package com.jachwisunbae.map;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class KakaoNearbyPlaceProviderTest {

    private static final BigDecimal LATITUDE = new BigDecimal("37.406");
    private static final BigDecimal LONGITUDE = new BigDecimal("127.088");

    private MockRestServiceServer server;
    private KakaoNearbyPlaceProvider provider;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://dapi.kakao.com");
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new KakaoNearbyPlaceProvider(builder.build());
    }

    @Test
    @DisplayName("좌표 ,반경, 카테고리로 거리순 검색을 요청하고 응답을 주변 시설로 변환한다")
    void requestsCategorySearchAndMapsPlaces() {
        server.expect(requestTo(Matchers.containsString("/v2/local/search/category.json")))
            .andExpect(queryParam("category_group_code", "CS2"))
            .andExpect(queryParam("x", "127.088"))
            .andExpect(queryParam("y", "37.406"))
            .andExpect(queryParam("radius", "500"))
            .andExpect(queryParam("sort", "distance"))
            .andExpect(queryParam("page", "1"))
            .andExpect(queryParam("size", "15"))
            .andRespond(withSuccess("""
                {
                  "meta": {"is_end": true},
                  "documents": [{
                    "id": "123",
                    "place_name": "이마트24 KT판교사옥점",
                    "road_address_name": "경기 성남시 수정구 금토로 32",
                    "address_name": "경기 성남시 수정구 금토동 696",
                    "y": "37.4066144",
                    "x": "127.0908479",
                    "distance": "250"
                  }]
                }
                """, MediaType.APPLICATION_JSON));

        List<NearbyPlace> places = provider.nearby(LATITUDE, LONGITUDE, 500, EnumSet.of(MapCategory.CONVENIENCE));

        assertThat(places).containsExactly(new NearbyPlace("kakao:123", "이마트24 KT판교사옥점",
            MapCategory.CONVENIENCE, "경기 성남시 수정구 금토로 32",
            new BigDecimal("37.4066144"), new BigDecimal("127.0908479"), 250));
        server.verify();
    }

    @Test
    @DisplayName("도로명주소가 비어 있으면 지번 주소를 사용한다")
    void usesJibunAddressWhenRoadAddressIsBlank() {
        expectPage("HP8", 1, true, "1", "", "경기 성남시 수정구 금토동 715");

        List<NearbyPlace> places = provider.nearby(LATITUDE, LONGITUDE, 500, EnumSet.of(MapCategory.HOSPITAL));

        assertThat(places).extracting(NearbyPlace::address).containsExactly("경기 성남시 수정구 금토동 715");
        server.verify();
    }

    @Test
    @DisplayName("마지막 페이지가 아니면 다음 페이지를 조회하고 마지막 페이지에서 멈춘다")
    void readsNextPageUntilLastPage() {
        expectPage("HP8", 1, false, "1", "도로명 1", "지번 1");
        expectPage("HP8", 2, true, "2", "도로명 2", "지번 2");

        List<NearbyPlace> places = provider.nearby(LATITUDE, LONGITUDE, 1000, EnumSet.of(MapCategory.HOSPITAL));

        assertThat(places).extracting(NearbyPlace::providerPlaceId).containsExactly("kakao:1", "kakao:2");
        server.verify();
    }

    @Test
    @DisplayName("카테고리당 최대 3페이지까지만 조회한다")
    void readsAtMostThreePagesPerCategory() {
        expectPage("SC4", 1, false, "1", "도로명 1", "지번 1");
        expectPage("SC4", 2, false, "2", "도로명 2", "지번 2");
        expectPage("SC4", 3, false, "3", "도로명 3", "지번 3");

        List<NearbyPlace> places = provider.nearby(LATITUDE, LONGITUDE, 2000, EnumSet.of(MapCategory.SCHOOL));

        assertThat(places).hasSize(3);
        server.verify();
    }

    @Test
    @DisplayName("카테고리마다 카카오 카테고리 코드로 조회한다")
    void mapsEveryCategoryToKakaoCode() {
        expectPage("HP8", 1, true, "1", "병원", "");
        expectPage("SW8", 1, true, "2", "지하철역", "");
        expectPage("SC4", 1, true, "3", "학교", "");
        expectPage("CS2", 1, true, "4", "편의점", "");
        expectPage("AG2", 1, true, "5", "중개업소", "");

        List<NearbyPlace> places = provider.nearby(LATITUDE, LONGITUDE, 500, EnumSet.allOf(MapCategory.class));

        assertThat(places).extracting(NearbyPlace::category).containsExactly(MapCategory.values());
        server.verify();
    }

    @Test
    @DisplayName("카카오 요청이 실패하면 지도 공급자 오류로 변환한다")
    void convertsKakaoFailureToProviderUnavailable() {
        server.expect(requestTo(Matchers.containsString("/v2/local/search/category.json")))
            .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));

        assertThatThrownBy(() -> provider.nearby(LATITUDE, LONGITUDE, 500, EnumSet.of(MapCategory.HOSPITAL)))
            .isInstanceOfSatisfying(BusinessException.class,
                exception -> assertThat(exception.getCode()).isEqualTo(DomainErrorCode.MAP_PROVIDER_UNAVAILABLE));
    }

    private void expectPage(String categoryCode, int page, boolean end, String id, String roadAddress,
                            String address) {
        server.expect(requestTo(Matchers.containsString("/v2/local/search/category.json")))
            .andExpect(queryParam("category_group_code", categoryCode))
            .andExpect(queryParam("page", String.valueOf(page)))
            .andRespond(withSuccess("""
                {
                  "meta": {"is_end": %s},
                  "documents": [{
                    "id": "%s",
                    "place_name": "장소 %s",
                    "road_address_name": "%s",
                    "address_name": "%s",
                    "y": "37.4064",
                    "x": "127.0888",
                    "distance": "100"
                  }]
                }
                """.formatted(end, id, id, roadAddress, address), MediaType.APPLICATION_JSON));
    }
}
