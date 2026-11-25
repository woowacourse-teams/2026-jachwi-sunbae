package com.jachwisunbae.property.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;

import com.jachwisunbae.checklist.entity.PropertyChecklistItem;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.common.exception.JachwiException;
import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import com.jachwisunbae.property.repository.JdbcPropertyChecklistItemRepository;
import com.jachwisunbae.property.repository.JdbcPropertyChecklistRepository;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemStateQuery;
import java.util.List;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.ExecutionException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.function.Executable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class PropertyChecklistItemServiceIntegrationTest {

    @Container
    @ServiceConnection
    private static final MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.4.10");

    private static final long MEMBER_ID = 1L;
    private static final long OTHER_MEMBER_ID = 2L;
    private static final long PROPERTY_ID = 10L;

    @Autowired
    private PropertyChecklistItemService service;

    @Autowired
    private JdbcPropertyChecklistRepository checklistRepository;

    @Autowired
    private JdbcPropertyChecklistItemRepository itemRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private long checklistId;
    private long itemId;

    @AfterEach
    void cleanUp() {
        jdbcTemplate.update("DELETE FROM property_checklist_items");
        jdbcTemplate.update("DELETE FROM property_checklists");
        jdbcTemplate.update("DELETE FROM properties");
        jdbcTemplate.update("DELETE FROM members");
    }

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("INSERT INTO members (id, created_at, updated_at) VALUES (?, NOW(6), NOW(6)), "
                + "(?, NOW(6), NOW(6))", MEMBER_ID, OTHER_MEMBER_ID);
        jdbcTemplate.update("""
                INSERT INTO properties (id, member_id, name, address, latitude, longitude, created_at)
                VALUES (?, ?, '판교 원룸', '경기도 성남시 분당구 판교역로 166', 37.3948, 127.1112, NOW(6))
                """, PROPERTY_ID, MEMBER_ID);
        checklistId = checklistRepository.save(PROPERTY_ID, null, "시스템 기본 체크리스트", CheckStage.ON_SITE);
        Long systemCheckItemId = jdbcTemplate.queryForObject("SELECT MIN(id) FROM system_check_items", Long.class);
        itemRepository.saveAll(checklistId, List.of(new PropertyChecklistItemStateQuery(
                systemCheckItemId, "수압을 확인했나요?", 1, CheckStatus.UNCONFIRMED, "")));
        itemId = jdbcTemplate.queryForObject("SELECT id FROM property_checklist_items WHERE property_checklist_id = ?",
                Long.class, checklistId);
    }

    @Test
    @DisplayName("항목의 상태와 메모를 저장하고 다시 읽어도 유지한다")
    void savesStatusAndMemo() {
        // when
        service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.CAUTION, 0L);
        service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "아침에 수압이 약하다", 0L);

        // then
        assertThat(itemRepository.find(MEMBER_ID, PROPERTY_ID, checklistId, itemId)).get()
                .extracting(PropertyChecklistItem::getStatus, PropertyChecklistItem::getMemo)
                .containsExactly(CheckStatus.CAUTION, "아침에 수압이 약하다");
    }

    @Test
    @DisplayName("항목 메모는 500자까지 저장하고 넘으면 거부해 기존 메모를 유지한다")
    void limitsMemoToFiveHundredCharacters() {
        // given
        service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "가".repeat(500), 0L);

        // when & then
        assertError(() -> service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "가".repeat(501), 1L),
                ErrorCode.PROPERTY_CHECK_RESULT_INVALID);
        assertThat(itemRepository.find(MEMBER_ID, PROPERTY_ID, checklistId, itemId)).get()
                .extracting(PropertyChecklistItem::getMemo).isEqualTo("가".repeat(500));
    }

    @Test
    @DisplayName("다른 회원의 항목이나 없는 항목은 바꿀 수 없다")
    void rejectsOtherMembersOrMissingItem() {
        // when & then
        assertError(() -> service.updateStatus(OTHER_MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L),
                ErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND);
        assertError(() -> service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId + 1, "메모", 0L),
                ErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND);
        assertThat(itemRepository.find(MEMBER_ID, PROPERTY_ID, checklistId, itemId)).get()
                .extracting(PropertyChecklistItem::getStatus).isEqualTo(CheckStatus.UNCONFIRMED);
    }

    @Test
    @DisplayName("같은 상태와 메모 저장을 재시도해도 토글·중복 항목 생성 없이 같은 상태를 유지한다")
    void repeatedAssignmentsKeepTheSamePersistedState() {
        service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L);
        service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "수압 확인", 0L);
        var before = jdbcTemplate.queryForList("SELECT * FROM property_checklist_items ORDER BY id");

        service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L);
        service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "수압 확인", 0L);

        assertThat(jdbcTemplate.queryForList("SELECT * FROM property_checklist_items ORDER BY id")).isEqualTo(before);
    }

    @Test
    @DisplayName("이전 상태 요청이 늦게 재전송되면 거절하고 최신 선택을 보존한다")
    void rejectsLateOldAssignmentAndPreservesTheNewerSelection() {
        service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L);
        service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.CAUTION, 1L);

        assertThatThrownBy(() -> service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L))
                .isInstanceOf(JachwiException.class);
        assertThat(jdbcTemplate.queryForObject("SELECT status FROM property_checklist_items WHERE id = ?",
                String.class, itemId)).isEqualTo("CAUTION");
    }

    @Test
    @DisplayName("이전 메모 재전송은 거절하고 최신 메모와 버전을 보존한다")
    void rejectsLateMemoAndPreservesTheNewerMemo() {
        service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "이전 메모", 0L);
        service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "최신 메모", 1L);

        assertError(() -> service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "이전 메모", 0L),
                ErrorCode.PROPERTY_CHECKLIST_ITEM_CONFLICT);

        assertThat(jdbcTemplate.queryForMap("SELECT memo, memo_version FROM property_checklist_items WHERE id = ?",
                itemId)).containsEntry("memo", "최신 메모").containsEntry("memo_version", 2L);
    }

    @Test
    @DisplayName("최종 커밋 실패는 상태·메모와 두 버전을 함께 롤백한다")
    void rollsBackValuesAndVersionsWhenCommitFails() {
        var admin = new JdbcTemplate(new DriverManagerDataSource(
                mysqlContainer.getJdbcUrl(), "root", mysqlContainer.getPassword()));
        var before = jdbcTemplate.queryForMap("SELECT * FROM property_checklist_items WHERE id = ?", itemId);

        assertThatThrownBy(() -> new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L);
            service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "저장 중 실패", 0L);
            long connectionId = jdbcTemplate.queryForObject("SELECT CONNECTION_ID()", Long.class);
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void beforeCommit(boolean readOnly) {
                    admin.execute("KILL CONNECTION " + connectionId);
                }
            });
        })).isInstanceOf(TransactionSystemException.class);

        assertThat(jdbcTemplate.queryForMap("SELECT * FROM property_checklist_items WHERE id = ?", itemId))
                .isEqualTo(before);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @DisplayName("상태와 메모 동시 수정은 실제 행 잠금을 기다린 뒤 각각의 값을 보존한다")
    void concurrentAssignmentsPreserveIndependentFieldsOrRejectStaleVersion(boolean sameField) throws Exception {
        var admin = new JdbcTemplate(new DriverManagerDataSource(
                mysqlContainer.getJdbcUrl(), "root", mysqlContainer.getPassword()));
        CountDownLatch changed = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicLong secondConnection = new AtomicLong();
        var transaction = new TransactionTemplate(transactionManager);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> transaction.execute(status -> {
                service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.GOOD, 0L);
                changed.countDown();
                waitFor(release);
                return true;
            }));
            try {
                waitFor(changed);
                var second = executor.submit(() -> transaction.execute(status -> {
                    secondConnection.set(jdbcTemplate.queryForObject("SELECT CONNECTION_ID()", Long.class));
                    return sameField
                            ? service.updateStatus(MEMBER_ID, PROPERTY_ID, checklistId, itemId, CheckStatus.CAUTION, 0L)
                            : service.updateMemo(MEMBER_ID, PROPERTY_ID, checklistId, itemId, "동시 저장 메모", 0L);
                }));
                await().atMost(Duration.ofSeconds(10)).until(() -> Boolean.TRUE.equals(admin.queryForObject("""
                        SELECT EXISTS(SELECT 1 FROM performance_schema.data_lock_waits w
                        JOIN performance_schema.threads t ON t.THREAD_ID = w.REQUESTING_THREAD_ID
                        WHERE t.PROCESSLIST_ID = ?)
                        """, Boolean.class, secondConnection.get())));
                assertThat(second.isDone()).isFalse();
                release.countDown();
                assertThat(first.get(10, TimeUnit.SECONDS)).isTrue();
                if (sameField) {
                    assertThatThrownBy(() -> second.get(10, TimeUnit.SECONDS))
                            .isInstanceOfSatisfying(ExecutionException.class,
                                    error -> assertThat(error.getCause()).isInstanceOfSatisfying(JachwiException.class,
                                            failure -> assertThat(failure.getErrorCode())
                                                    .isEqualTo(ErrorCode.PROPERTY_CHECKLIST_ITEM_CONFLICT)));
                } else {
                    assertThat(second.get(10, TimeUnit.SECONDS).getMemo()).isEqualTo("동시 저장 메모");
                }
                assertThat(jdbcTemplate.queryForMap("SELECT status, memo FROM property_checklist_items WHERE id = ?",
                        itemId)).containsEntry("status", "GOOD").containsEntry("memo", sameField ? "" : "동시 저장 메모");
            } finally {
                release.countDown();
            }
        }
    }

    private static void waitFor(CountDownLatch latch) {
        try {
            assertThat(latch.await(10, TimeUnit.SECONDS)).as("작업자 동기화 제한 시간").isTrue();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("작업자 동기화가 중단됐습니다.", exception);
        }
    }

    private void assertError(Executable executable, ErrorCode errorCode) {
        assertThatThrownBy(executable::execute)
                .isInstanceOfSatisfying(JachwiException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(errorCode));
    }
}
