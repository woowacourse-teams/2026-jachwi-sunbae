package com.jachwisunbae.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.jachwisunbae.common.exception.client.InvalidInputException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.rental.repository.JdbcRentalTransactionRepository;
import com.jachwisunbae.rental.repository.query.RentalDatasetInfo;
import com.jachwisunbae.rental.service.dto.result.RentalTransactionPage;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class RentalTransactionQueryServiceTest {

    private static final String CODE = "1162010200";
    // 한국 시각으로는 2026-10-11 00:30이다.
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-10T15:30:00Z"), ZoneOffset.UTC);
    private static final LocalDate END = LocalDate.parse("2026-10-11");
    private static final LocalDate START = LocalDate.parse("2026-04-11");

    private JdbcRentalTransactionRepository repository;
    private RentalTransactionQueryService service;

    @BeforeEach
    void setUp() {
        repository = mock(JdbcRentalTransactionRepository.class);
        service = new RentalTransactionQueryService(repository, CLOCK);
    }

    @Test
    @DisplayName("한국 날짜 기준 최근 6개월을 조회하고 페이지 번호로 건너뛸 거래 수를 정한다")
    void queriesKoreanSixMonthWindow() {
        // given
        RentalDatasetInfo datasetInfo = new RentalDatasetInfo(LocalDate.parse("2026-04-09"),
                LocalDate.parse("2026-10-09"), Instant.parse("2026-10-10T03:00:00Z"));
        given(repository.countByLegalDongCode(CODE, START, END)).willReturn(25L);
        given(repository.findPageByLegalDongCode(CODE, START, END, 10, 20L)).willReturn(List.of());
        given(repository.findLegalDongName(CODE)).willReturn(Optional.of("서울특별시 관악구 신림동"));
        given(repository.findDatasetInfo()).willReturn(Optional.of(datasetInfo));

        // when
        RentalTransactionPage page = service.findTransactions(CODE, 2, 10);

        // then
        assertThat(page.queryStartDate()).isEqualTo(START);
        assertThat(page.queryEndDate()).isEqualTo(END);
        assertThat(page.legalDongName()).isEqualTo("서울특별시 관악구 신림동");
        assertThat(page.datasetInfo()).isEqualTo(datasetInfo);
        assertThat(page.totalCount()).isEqualTo(25);
        assertThat(page.hasNext()).isFalse();
        verify(repository).findPageByLegalDongCode(CODE, START, END, 10, 20L);
    }

    @Test
    @DisplayName("거래가 없으면 페이지를 읽지 않고 이름과 수집 정보가 없어도 빈 결과를 준다")
    void skipsPageQueryWithoutTransactions() {
        // given
        given(repository.countByLegalDongCode(CODE, START, END)).willReturn(0L);
        given(repository.findLegalDongName(CODE)).willReturn(Optional.empty());
        given(repository.findDatasetInfo()).willReturn(Optional.empty());

        // when
        RentalTransactionPage page = service.findTransactions(CODE, 0, 20);

        // then
        assertThat(page.items()).isEmpty();
        assertThat(page.legalDongName()).isNull();
        assertThat(page.datasetInfo()).isNull();
        verify(repository, never()).findPageByLegalDongCode(anyString(), any(), any(), anyInt(), anyLong());
    }

    @ParameterizedTest
    @CsvSource(nullValues = "NULL", value = {
            "NULL, 0, 20", "116201020, 0, 20", "116201020a, 0, 20",
            "1162010200, -1, 20", "1162010200, 10001, 20", "1162010200, 0, 0", "1162010200, 0, 101"})
    @DisplayName("법정동 코드, page, size가 범위를 벗어나면 거부한다")
    void rejectsInvalidQuery(final String code, final int page, final int size) {
        // when // then
        assertThatThrownBy(() -> service.findTransactions(code, page, size))
                .isInstanceOf(InvalidInputException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RENTAL_QUERY_INVALID);
        verify(repository, never()).countByLegalDongCode(anyString(), any(), any());
    }
}
