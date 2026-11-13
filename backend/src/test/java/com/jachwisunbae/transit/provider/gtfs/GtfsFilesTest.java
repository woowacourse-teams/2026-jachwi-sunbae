package com.jachwisunbae.transit.provider.gtfs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.common.exception.server.InternalSystemException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class GtfsFilesTest {

    @TempDir
    private Path directory;

    @Test
    @DisplayName("BOM이 붙은 파일도 헤더로 컬럼을 찾고, 조건에 맞는 행만 바꿔 읽는다")
    void readsFilteredRowsWithBom() throws IOException {
        // given
        write("routes.txt", "﻿" + """
                route_id,route_short_name,route_long_name,route_type
                R1,101,간선 101,3
                R2,경의선,경의선,2
                R3,1호선,서울 1호선,1
                """);

        // when
        List<String> routeIds = new GtfsFiles(directory).read("routes.txt",
                record -> record.integer("route_type") != 2, record -> record.text("route_id"));

        // then
        assertThat(routeIds).containsExactly("R1", "R3");
    }

    @Test
    @DisplayName("파일 순서대로 행을 하나씩 넘기고, 없는 선택 컬럼은 빈 문자열로 읽는다")
    void visitsRowsInOrder() throws IOException {
        // given
        write("stops.txt", """
                stop_id,stop_name,stop_lat,stop_lon
                S1,첫째,37.5,127.0
                S2,둘째,37.6,127.1
                """);
        List<String> visited = new ArrayList<>();

        // when
        new GtfsFiles(directory).forEach("stops.txt",
                record -> visited.add(record.text("stop_id") + record.optionalText("parent_station")));

        // then
        assertThat(visited).containsExactly("S1", "S2");
    }

    @Test
    @DisplayName("값을 읽지 못한 행은 파일 이름을 담아 적재를 멈춘다")
    void stopsOnInvalidValue() throws IOException {
        // given
        write("routes.txt", """
                route_id,route_short_name,route_long_name,route_type
                R1,101,간선 101,버스
                """);
        GtfsFiles files = new GtfsFiles(directory);

        // when // then
        assertThatThrownBy(() -> files.forEach("routes.txt", record -> record.integer("route_type")))
                .isInstanceOf(InternalSystemException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TRANSIT_FEED_READ_FAILURE)
                .hasMessageContaining("routes.txt");
    }

    @Test
    @DisplayName("파일이 없으면 파일 이름을 담아 실패한다")
    void failsOnMissingFile() {
        // given
        GtfsFiles files = new GtfsFiles(directory);

        // when // then
        assertThatThrownBy(() -> files.forEach("trips.txt", record -> {
        }))
                .isInstanceOf(UncheckedIOException.class)
                .hasMessageContaining("trips.txt");
    }

    private void write(final String fileName, final String content) throws IOException {
        Files.writeString(directory.resolve(fileName), content, StandardCharsets.UTF_8);
    }
}
