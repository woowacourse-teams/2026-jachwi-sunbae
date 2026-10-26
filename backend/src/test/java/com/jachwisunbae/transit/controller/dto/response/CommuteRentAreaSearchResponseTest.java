package com.jachwisunbae.transit.controller.dto.response;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.jachwisunbae.rental.domain.AdminDongRent;
import com.jachwisunbae.rental.domain.AdminDongRents;
import com.jachwisunbae.transit.domain.CommuteArea;
import com.jachwisunbae.transit.domain.GtfsStop;
import com.jachwisunbae.transit.domain.ReachableStop;
import com.jachwisunbae.transit.domain.vo.Coordinate;
import com.jachwisunbae.transit.domain.vo.Seconds;
import com.jachwisunbae.transit.service.dto.result.CommuteAreaSearchResult;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CommuteRentAreaSearchResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Test
    @DisplayName("동네 시세를 동네 항목에 바로 펼치고 시세 기간을 함께 내보낸다")
    void serializesRent() throws Exception {
        GtfsStop station = new GtfsStop("S1", "신림역", new Coordinate(37.48, 126.93), "11210630");
        AdminDongRents rents = new AdminDongRents(LocalDate.of(2026, 3, 30), LocalDate.of(2026, 9, 30),
                Map.of("11210630", new AdminDongRent("11210630", List.of("신림동"), 450_000, 5_000_000, 12)));
        CommuteAreaSearchResult result = new CommuteAreaSearchResult(60, List.of(new CommuteArea("11210630",
                List.of(new ReachableStop(station, new Seconds(600))))), rents);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(CommuteRentAreaSearchResponse.from(result)));

        assertThat(json.path("rentStartDate").asText()).isEqualTo("2026-03-30");
        assertThat(json.path("rentEndDate").asText()).isEqualTo("2026-09-30");
        JsonNode area = json.path("areas").get(0);
        assertThat(area.path("monthlyRentKrw").asLong()).isEqualTo(450_000);
        assertThat(area.path("depositKrw").asLong()).isEqualTo(5_000_000);
        assertThat(area.path("transactionCount").asInt()).isEqualTo(12);
        assertThat(area.path("legalDongNames").get(0).asText()).isEqualTo("신림동");
    }

    @Test
    @DisplayName("시세가 없는 동네는 금액과 거래 수를 null로, 시세가 하나도 없으면 기간을 null로 내보낸다")
    void serializesMissingRent() throws Exception {
        GtfsStop station = new GtfsStop("S1", "역삼역", new Coordinate(37.55, 127.05), "11230640");
        CommuteAreaSearchResult result = new CommuteAreaSearchResult(40, List.of(new CommuteArea("11230640",
                List.of(new ReachableStop(station, new Seconds(150))))), AdminDongRents.empty());

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(
                CommuteRentAreaSearchResponse.from(result)));

        assertThat(json.path("rentStartDate").isNull()).isTrue();
        JsonNode area = json.path("areas").get(0);
        assertThat(area.fieldNames()).toIterable().containsExactly("adminDongCode", "commuteMinutes",
                "monthlyRentKrw", "depositKrw", "transactionCount", "legalDongNames", "stations");
        assertThat(area.path("monthlyRentKrw").isNull()).isTrue();
        assertThat(area.path("legalDongNames")).isEmpty();
    }
}
