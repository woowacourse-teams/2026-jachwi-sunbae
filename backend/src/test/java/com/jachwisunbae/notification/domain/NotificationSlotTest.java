package com.jachwisunbae.notification.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NotificationSlotTest {
    @Test
    @DisplayName("해가 바뀌어도 아침 알림은 오늘, 저녁 알림은 다음 날을 대상으로 한다")
    void morningUsesTodayAndEveningUsesTomorrowAcrossYearBoundary() {
        LocalDate date = LocalDate.of(2026, 12, 31);
        assertThat(NotificationSlot.MORNING.targetDate(date)).isEqualTo(date);
        assertThat(NotificationSlot.MORNING.firstForecastHour()).isEqualTo(7);
        assertThat(NotificationSlot.EVENING.targetDate(date)).isEqualTo(LocalDate.of(2027, 1, 1));
        assertThat(NotificationSlot.EVENING.firstForecastHour()).isZero();
    }
}
