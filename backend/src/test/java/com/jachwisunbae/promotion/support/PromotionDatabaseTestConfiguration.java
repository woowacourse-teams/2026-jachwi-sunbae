package com.jachwisunbae.promotion.support;

import com.jachwisunbae.promotion.repository.JdbcPromotionProductRepository;
import com.jachwisunbae.promotion.service.PromotionCollectionService;
import javax.sql.DataSource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@TestConfiguration(proxyBeanMethods = false)
@EnableTransactionManagement
@Import({JdbcPromotionProductRepository.class, PromotionCollectionService.class})
public class PromotionDatabaseTestConfiguration {

    @Bean
    JdbcTemplate jdbcTemplate(final DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    PlatformTransactionManager transactionManager(final DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
