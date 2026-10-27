package com.jachwisunbae.promotion.collector;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PromotionLocalCollectionCommandTest {

    @Test
    @DisplayName("로컬 저장 명령은 모드를 요구하고 DB 주소·프로필·추가 옵션을 허용하지 않는다")
    void rejectsMissingModeAndExternalDatabaseOptionsBeforeStartingDocker() {
        for (String[] arguments : new String[][]{
                {}, {"--all"}, {"--fixture", "--spring.profiles.active=prod"},
                {"--fixture", "--spring.datasource.url=jdbc:mysql://remote/db"}, {"--live", "extra"}}) {
            assertThatThrownBy(() -> PromotionLocalCollectionCommand.validateArguments(arguments))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
