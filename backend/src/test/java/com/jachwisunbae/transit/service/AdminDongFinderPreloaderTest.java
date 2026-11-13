package com.jachwisunbae.transit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;

class AdminDongFinderPreloaderTest {

    @Test
    @DisplayName("서버가 뜰 때 행정동 경계를 읽어 두어 이후 저장소가 바뀌어도 읽은 경계로 찾는다")
    void loadsBoundariesOnStartup() {
        // given
        InMemoryAdminDongRepository repository = new InMemoryAdminDongRepository(
                List.of(AdminDongFixture.SEOUL_STATION_DONG));
        AdminDongFinder finder = new AdminDongFinder(repository);

        // when
        new AdminDongFinderPreloader(finder).preload();
        repository.replace(List.of());

        // then
        assertThat(finder.findCode(new BigDecimal("37.55"), new BigDecimal("126.97")))
                .contains(AdminDongFixture.SEOUL_STATION_DONG.code());
    }

    @Test
    @DisplayName("행정동 경계를 읽지 못해도 서버 기동을 막지 않는다")
    void keepsStartingOnFailure() {
        // given
        AdminDongFinder finder = mock(AdminDongFinder.class);
        given(finder.findCode(any(), any())).willThrow(new DataAccessResourceFailureException("DB 연결 실패"));

        // when // then
        assertThatCode(() -> new AdminDongFinderPreloader(finder).preload()).doesNotThrowAnyException();
        verify(finder).findCode(BigDecimal.ZERO, BigDecimal.ZERO);
    }
}
