package com.jachwisunbae.member.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.support.TestClock;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class MemberTest {

    private final TestClock clock = new TestClock();

    @Test
    @DisplayName("익명 회원을 생성하면 생성 시각과 수정 시각이 같고 삭제 시각은 없다")
    void createsAnonymousMember() {
        LocalDateTime now = LocalDateTime.now(clock);
        Member member = Member.create(now);

        assertThat(member.getId()).isNull();
        assertThat(member.getCreatedAt()).isEqualTo(now);
        assertThat(member.getUpdatedAt()).isEqualTo(now);
        assertThat(member.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("정상 회원의 식별자와 생성 및 수정 시각을 복원한다")
    void reconstructsActiveMember() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime updatedAt = now.plusDays(1);

        Member member = Member.reconstruct(7L, now, updatedAt, null);

        assertThat(member.getId()).isEqualTo(7L);
        assertThat(member.getCreatedAt()).isEqualTo(now);
        assertThat(member.getUpdatedAt()).isEqualTo(updatedAt);
        assertThat(member.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("삭제 시각이 있는 회원도 상태를 유지해 복원한다")
    void reconstructsDeletedMember() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime deletedAt = now.plusDays(1);

        Member member = Member.reconstruct(7L, now, deletedAt, deletedAt);

        assertThat(member.getDeletedAt()).isEqualTo(deletedAt);
    }
}
