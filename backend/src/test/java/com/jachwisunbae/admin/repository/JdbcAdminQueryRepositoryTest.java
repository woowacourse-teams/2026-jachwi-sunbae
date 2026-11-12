package com.jachwisunbae.admin.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.admin.repository.query.AdminMember;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.JdbcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JdbcAdminQueryRepositoryTest {

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10");

    @Autowired
    JdbcTemplate jdbc;

    @Test
    @DisplayName("삭제·병합 회원과 삭제된 매물·사진을 제외하고 중복 없이 집계한다")
    void excludesDeletedAndMergedData() {
        var repository = new JdbcAdminQueryRepository(jdbc);
        var start = LocalDateTime.parse("2026-11-11T15:00:00");
        member(100, start.minusSeconds(1));
        member(101, start);
        member(102, start.plusDays(1).minusNanos(1000));
        member(103, start.plusDays(1));
        member(104, start);
        member(105, start);
        jdbc.update("UPDATE members SET deleted_at = ? WHERE id = 104", start);
        jdbc.update("UPDATE members SET merged_into_member_id = 100 WHERE id = 105");
        property(200, 101, false);
        property(201, 101, false);
        property(202, 101, true);
        property(203, 104, false);
        property(204, 105, false);
        photo(300, 200, 101, false);
        photo(301, 200, 101, false);
        photo(302, 201, 101, false);
        photo(303, 201, 101, true);
        photo(304, 202, 101, false);
        photo(305, 203, 104, false);
        photo(306, 204, 105, false);

        var summary = repository.summary(start, start.plusDays(1));
        assertThat(summary.activeAccounts()).isEqualTo(4);
        assertThat(summary.newAccountsToday()).isEqualTo(2);
        assertThat(summary.activeProperties()).isEqualTo(2);
        var recent = repository.recentMembers();
        assertThat(recent).extracting(AdminMember::memberId).containsExactly(103L, 102L, 101L, 100L);
        var found = recent.stream().filter(member -> member.memberId() == 101).findFirst().orElseThrow();
        assertThat(found.activeProperties()).isEqualTo(2);
        assertThat(found.activePhotos()).isEqualTo(3);
        assertThat(found.createdAt()).isEqualTo(start.toInstant(ZoneOffset.UTC));
        assertThat(recent.getLast().activePhotos()).isZero();
    }

    @Test
    @DisplayName("같은 가입 시각은 ID 내림차순으로 정렬하고 최근 20명만 조회한다")
    void limitsToRecentTwenty() {
        var repository = new JdbcAdminQueryRepository(jdbc);
        for (int id = 100; id < 123; id++) member(id, LocalDateTime.parse("2026-11-11T00:00:00"));
        var recent = repository.recentMembers();
        assertThat(recent).hasSize(20);
        assertThat(recent.getFirst().memberId()).isEqualTo(122L);
        assertThat(recent.getLast().memberId()).isEqualTo(103L);
    }

    @Test
    @DisplayName("회원이 없을 때 모든 집계는 0이고 목록은 비어 있다")
    void handlesEmptyDatabase() {
        var repository = new JdbcAdminQueryRepository(jdbc);
        var start = LocalDateTime.parse("2026-11-11T15:00:00");
        assertThat(repository.summary(start, start.plusDays(1)).activeAccounts()).isZero();
        assertThat(repository.summary(start, start.plusDays(1)).newAccountsToday()).isZero();
        assertThat(repository.recentMembers()).isEmpty();
    }

    private void member(long id, LocalDateTime createdAt) {
        jdbc.update("INSERT INTO members (id, created_at, updated_at) VALUES (?, ?, ?)", id, createdAt, createdAt);
    }

    private void property(long id, long member, boolean deleted) {
        jdbc.update("""
                INSERT INTO properties (id, member_id, name, created_at, deleted_at)
                VALUES (?, ?, '테스트 매물', NOW(6), ?)
                """, id, member, deleted ? LocalDateTime.now() : null);
    }

    private void photo(long id, long property, long member, boolean deleted) {
        jdbc.update("""
                INSERT INTO property_photos (id, property_id, member_id, storage_key, content_type, size_bytes, created_at, deleted_at)
                VALUES (?, ?, ?, ?, 'image/jpeg', 100, NOW(6), ?)
                """, id, property, member, "admin-test-" + id, deleted ? LocalDateTime.now() : null);
    }
}
