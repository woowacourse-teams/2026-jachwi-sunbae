package com.jachwisunbae.property.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.type.RoomOption;
import com.jachwisunbae.property.type.UtilityOption;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("매물 도메인")
class PropertyTest {

    private static final Clock FIXED_CLOCK = Clock.fixed(
        Instant.parse("2026-09-24T10:00:00Z"), ZoneOffset.UTC);
    private static final LocalDateTime NOW = LocalDateTime.now(FIXED_CLOCK);
    private static final LocalDate TODAY = LocalDate.now(FIXED_CLOCK);

    @DisplayName("매물 생성은 null, 빈 문자열, 공백 이름을 거부한다")
    @ParameterizedTest(name = "[{index}] 이름: [{0}]")
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void createRejectsBlankName(String name) {
        assertPropertyError(() -> createProperty(input -> input.name = name),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("매물 생성은 1자와 30자 이름을 허용한다")
    @ParameterizedTest(name = "[{index}] 이름 길이: {0}")
    @ValueSource(ints = {1, 30})
    void createAcceptsNameLengthBoundary(int length) {
        String name = "가".repeat(length);

        Property property = createProperty(input -> input.name = name);

        assertThat(property.getName()).isEqualTo(name);
    }

    @DisplayName("매물 생성은 31자 이름을 거부한다")
    @Test
    void createRejectsThirtyOneCharacterName() {
        assertPropertyError(() -> createProperty(input -> input.name = "가".repeat(31)),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("매물 생성은 이름의 앞뒤 공백을 제거한다")
    @Test
    void createStoresTrimmedName() {
        Property property = createProperty(input -> input.name = "  새 매물  ");

        assertThat(property.getName()).isEqualTo("새 매물");
    }

    @DisplayName("매물 수정도 null, 빈 문자열, 공백 이름을 거부한다")
    @ParameterizedTest(name = "[{index}] 이름: [{0}]")
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void updateRejectsBlankName(String name) {
        Property property = createProperty();

        assertPropertyError(() -> updateProperty(property, input -> input.name = name),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("매물 수정은 유효한 이름의 앞뒤 공백을 제거한다")
    @Test
    void updateStoresTrimmedValidName() {
        Property property = createProperty();

        updateProperty(property, input -> input.name = "  수정 매물  ");

        assertThat(property.getName()).isEqualTo("수정 매물");
    }

    @DisplayName("생성과 수정은 입주 가능일과 방문 예정 시각의 과거, 현재, 미래를 모두 허용한다")
    @ParameterizedTest(name = "[{index}] 기준 시점과의 날짜 차이: {0}일")
    @ValueSource(ints = {-1, 0, 1})
    void createAndUpdateAcceptAllDateRelations(int dayOffset) {
        LocalDate availableMoveInDate = TODAY.plusDays(dayOffset);
        LocalDateTime visitScheduledAt = NOW.plusDays(dayOffset);

        Property created = createProperty(input -> {
            input.availableMoveInDate = availableMoveInDate;
            input.visitScheduledAt = visitScheduledAt;
        });
        Property updated = createProperty();
        updateProperty(updated, input -> {
            input.availableMoveInDate = availableMoveInDate;
            input.visitScheduledAt = visitScheduledAt;
        });

        assertThat(created.getAvailableMoveInDate()).isEqualTo(availableMoveInDate);
        assertThat(created.getVisitScheduledAt()).isEqualTo(visitScheduledAt);
        assertThat(updated.getAvailableMoveInDate()).isEqualTo(availableMoveInDate);
        assertThat(updated.getVisitScheduledAt()).isEqualTo(visitScheduledAt);
    }

    @DisplayName("입주 가능일과 방문 예정 시각은 입력하지 않아도 된다")
    @Test
    void createAcceptsNullOptionalDates() {
        Property property = createProperty(input -> {
            input.availableMoveInDate = null;
            input.visitScheduledAt = null;
        });

        assertThat(property.getAvailableMoveInDate()).isNull();
        assertThat(property.getVisitScheduledAt()).isNull();
    }

    @DisplayName("매물은 소유 회원 없이 생성할 수 없다")
    @Test
    void createRejectsNullMemberId() {
        assertPropertyError(() -> createProperty(input -> input.memberId = null),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("입력하지 않은 금액은 0으로 저장한다")
    @Test
    void createNormalizesNullAmountsToZero() {
        Property property = createProperty(input -> {
            input.depositAmount = null;
            input.monthlyRentAmount = null;
            input.maintenanceFeeAmount = null;
        });

        assertThat(property.getDepositAmount()).isZero();
        assertThat(property.getMonthlyRentAmount()).isZero();
        assertThat(property.getMaintenanceFeeAmount()).isZero();
    }

    @DisplayName("입력하지 않은 선택 정보는 빈 값으로 정규화한다")
    @Test
    void createNormalizesNullOptionalValues() {
        Property property = createProperty(input -> {
            input.discoverySource = null;
            input.address = "   ";
            input.roomOptions = null;
            input.utilityOptions = null;
        });

        assertThat(property.getDiscoverySource()).isEmpty();
        assertThat(property.getAddress()).isNull();
        assertThat(property.getRoomOptions()).isEmpty();
        assertThat(property.getUtilityOptions()).isEmpty();
    }

    @DisplayName("발견 경로와 주소의 최대 길이를 초과하면 생성할 수 없다")
    @Test
    void createRejectsTextOverMaximumLength() {
        assertPropertyError(() -> createProperty(input -> input.discoverySource = "출".repeat(501)),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertPropertyError(() -> createProperty(input -> input.address = "주".repeat(256)),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("위도와 경도는 함께 입력해야 한다")
    @Test
    void createRejectsIncompleteLocationPair() {
        assertPropertyError(() -> createProperty(input -> input.longitude = null),
            DomainErrorCode.PROPERTY_LOCATION_INVALID);
        assertPropertyError(() -> createProperty(input -> input.latitude = null),
            DomainErrorCode.PROPERTY_LOCATION_INVALID);
    }

    @DisplayName("위도와 경도는 유효한 좌표 범위 안에 있어야 한다")
    @Test
    void createRejectsLocationOutsideRange() {
        assertPropertyError(() -> createProperty(input -> input.latitude = BigDecimal.valueOf(90.0000001)),
            DomainErrorCode.PROPERTY_LOCATION_INVALID);
        assertPropertyError(() -> createProperty(input -> input.longitude = BigDecimal.valueOf(180.0000001)),
            DomainErrorCode.PROPERTY_LOCATION_INVALID);
    }

    @DisplayName("지원하는 방 옵션과 공과금 옵션은 중복 없이 저장한다")
    @Test
    void createParsesAndDeduplicatesOptions() {
        Property property = createProperty(input -> {
            input.roomOptions = List.of("BED", "BED", "DESK");
            input.utilityOptions = List.of("WATER", "WATER", "INTERNET");
        });

        assertThat(property.getRoomOptions()).containsExactlyInAnyOrder(RoomOption.BED, RoomOption.DESK);
        assertThat(property.getUtilityOptions()).containsExactlyInAnyOrder(UtilityOption.WATER,
            UtilityOption.INTERNET);
    }

    @DisplayName("지원하지 않는 방 옵션과 공과금 옵션은 거부한다")
    @Test
    void createRejectsUnknownOptions() {
        assertPropertyError(() -> createProperty(input -> input.roomOptions = List.of("UNKNOWN")),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertPropertyError(() -> createProperty(input -> input.utilityOptions = List.of("UNKNOWN")),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("매물 수정은 생성과 동일한 기본 정보 검증을 적용한다")
    @Test
    void updateAppliesSameBasicInfoValidationAsCreate() {
        assertUpdatePropertyError(input -> input.name = "가".repeat(31),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertUpdatePropertyError(input -> input.depositAmount = -1L,
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertUpdatePropertyError(input -> input.longitude = null,
            DomainErrorCode.PROPERTY_LOCATION_INVALID);
        assertUpdatePropertyError(input -> input.latitude = BigDecimal.valueOf(90.0000001),
            DomainErrorCode.PROPERTY_LOCATION_INVALID);
        assertUpdatePropertyError(input -> input.roomOptions = List.of("UNKNOWN"),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
        assertUpdatePropertyError(input -> input.utilityOptions = List.of("UNKNOWN"),
            DomainErrorCode.PROPERTY_INPUT_INVALID);
    }

    @DisplayName("매물 수정은 기본 정보와 수정 시각만 바꾸고 식별자와 생성 시각을 유지한다")
    @Test
    void updateReplacesBasicInfoAndPreservesIdentity() {
        LocalDateTime createdAt = NOW.minusDays(10);
        Property property = Property.reconstruct(10L, 20L, "기존 매물", 1L, 2L, "기존 주소",
            BigDecimal.valueOf(37), BigDecimal.valueOf(127), TODAY, 3L, NOW,
            Set.of(RoomOption.BED), Set.of(UtilityOption.WATER), "기존 경로", createdAt, NOW.minusDays(1));
        LocalDateTime updatedAt = NOW.plusHours(1);

        updateProperty(property, input -> {
            input.name = "수정 매물";
            input.depositAmount = 10L;
            input.monthlyRentAmount = 20L;
            input.address = "수정 주소";
            input.latitude = BigDecimal.valueOf(38);
            input.longitude = BigDecimal.valueOf(128);
            input.availableMoveInDate = TODAY.minusDays(1);
            input.maintenanceFeeAmount = 30L;
            input.visitScheduledAt = NOW.minusHours(1);
            input.roomOptions = List.of("DESK", "DESK");
            input.utilityOptions = List.of("INTERNET", "INTERNET");
            input.discoverySource = "수정 경로";
            input.now = updatedAt;
        });

        assertThat(property.getId()).isEqualTo(10L);
        assertThat(property.getMemberId()).isEqualTo(20L);
        assertThat(property.getCreatedAt()).isEqualTo(createdAt);
        assertThat(property.getUpdatedAt()).isEqualTo(updatedAt);
        assertThat(property.getName()).isEqualTo("수정 매물");
        assertThat(property.getDepositAmount()).isEqualTo(10L);
        assertThat(property.getMonthlyRentAmount()).isEqualTo(20L);
        assertThat(property.getDiscoverySource()).isEqualTo("수정 경로");
        assertThat(property.getAddress()).isEqualTo("수정 주소");
        assertThat(property.getLatitude()).isEqualByComparingTo("38");
        assertThat(property.getLongitude()).isEqualByComparingTo("128");
        assertThat(property.getAvailableMoveInDate()).isEqualTo(TODAY.minusDays(1));
        assertThat(property.getMaintenanceFeeAmount()).isEqualTo(30L);
        assertThat(property.getVisitScheduledAt()).isEqualTo(NOW.minusHours(1));
        assertThat(property.getRoomOptions()).containsExactly(RoomOption.DESK);
        assertThat(property.getUtilityOptions()).containsExactly(UtilityOption.INTERNET);
    }

    private static Property createProperty() {
        return createProperty(input -> {
        });
    }

    private static Property createProperty(Consumer<PropertyFixture> customization) {
        PropertyFixture input = new PropertyFixture();
        customization.accept(input);
        return input.create();
    }

    private static void updateProperty(Property property, Consumer<PropertyFixture> customization) {
        PropertyFixture input = new PropertyFixture();
        customization.accept(input);
        input.update(property);
    }

    private static void assertPropertyError(ThrowingCallable callable, DomainErrorCode expectedCode) {
        assertThatThrownBy(callable)
            .isInstanceOfSatisfying(BusinessException.class,
                exception -> assertThat(exception.getCode()).isEqualTo(expectedCode));
    }

    private static void assertUpdatePropertyError(Consumer<PropertyFixture> customization,
                                                  DomainErrorCode expectedCode) {
        Property property = createProperty();
        assertPropertyError(() -> updateProperty(property, customization), expectedCode);
    }

    private static final class PropertyFixture {

        private Long memberId = 1L;
        private String name = "새 매물";
        private Long depositAmount = 10_000_000L;
        private Long monthlyRentAmount = 500_000L;
        private String address = "서울시 강남구";
        private BigDecimal latitude = BigDecimal.valueOf(37.5);
        private BigDecimal longitude = BigDecimal.valueOf(127);
        private LocalDate availableMoveInDate = TODAY;
        private Long maintenanceFeeAmount = 100_000L;
        private LocalDateTime visitScheduledAt = NOW;
        private List<String> roomOptions = List.of("AIR_CONDITIONER");
        private List<String> utilityOptions = List.of("WATER");
        private String discoverySource = "부동산 앱";
        private LocalDateTime now = NOW;

        private Property create() {
            return Property.create(memberId, name, depositAmount, monthlyRentAmount, address,
                latitude, longitude, availableMoveInDate, maintenanceFeeAmount, visitScheduledAt,
                roomOptions, utilityOptions, discoverySource, now);
        }

        private void update(Property property) {
            property.replaceBasicInfo(name, depositAmount, monthlyRentAmount, address,
                latitude, longitude, availableMoveInDate, maintenanceFeeAmount, visitScheduledAt,
                roomOptions, utilityOptions, discoverySource, now);
        }
    }
}
