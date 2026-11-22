package com.jachwisunbae.support;

import com.jachwisunbae.auth.client.OAuthProviderClient;
import com.jachwisunbae.auth.repository.MemberIdentityRepository;
import com.jachwisunbae.notification.provider.PushSender;
import com.jachwisunbae.promotion.provider.emart24.Emart24PromotionFetcher;
import com.jachwisunbae.property.ai.BedrockPropertyExtractor;
import com.jachwisunbae.property.repository.JdbcPropertyRepository;
import com.jachwisunbae.property.service.PropertyAiUsageLimiter;
import com.jachwisunbae.property.storage.PhotoStorage;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

// 스프링 부트 통합·인수 테스트의 공통 설정. 설정이 같아야 컨텍스트 캐시를 재사용하므로
// 목·스파이·시계·MockMvc를 여기서 한 번에 정하고, 하위 클래스는 필요한 빈을 @Autowired로 받는다.
// 외부 시스템 빈은 늘 목으로 두고, 스파이는 실제 동작을 그대로 쓰며 테스트가 끝날 때마다 초기화된다.
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@Import(IntegrationTest.ClockConfig.class)
@ContextConfiguration(initializers = MySqlContainerInitializer.class)
@ResetDatabase
public abstract class IntegrationTest {

    @MockitoBean
    private PushSender pushSender;
    @MockitoBean
    private PhotoStorage photoStorage;
    @MockitoBean
    private BedrockPropertyExtractor bedrockPropertyExtractor;
    @MockitoBean
    private PropertyAiUsageLimiter propertyAiUsageLimiter;
    @MockitoSpyBean
    private OAuthProviderClient oauthProviderClient;
    @MockitoSpyBean
    private MemberIdentityRepository memberIdentityRepository;
    @MockitoSpyBean
    private Emart24PromotionFetcher emart24PromotionFetcher;
    @MockitoSpyBean
    private JdbcPropertyRepository jdbcPropertyRepository;

    @Autowired
    private TestClock testClock;

    @BeforeEach
    void resetTestClock() {
        testClock.reset();
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class ClockConfig {

        @Bean
        @Primary
        TestClock testClock() {
            return new TestClock();
        }
    }
}
