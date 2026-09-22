package com.jachwisunbae.property.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.property.controller.dto.response.PropertyChecklistStageResponse;
import com.jachwisunbae.property.controller.dto.response.PropertyProgress;
import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.entity.PropertyMemo;
import com.jachwisunbae.property.repository.query.PropertyChecklistApplicationQuery;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemQuery;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

class PropertyComparisonPdfRendererTest {

    private static final byte[] SAMPLE_PNG = Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    @Test
    void rendersComparisonAsPdfFromHtmlTemplate() throws Exception {
        PropertyComparisonPdfRenderer renderer = new PropertyComparisonPdfRenderer(templateEngine());

        byte[] pdf = renderer.render(List.of(sampleRecord()));

        assertThat(pdf).startsWith('%', 'P', 'D', 'F');
        try (var document = PDDocument.load(pdf)) {
            assertThat(document.getNumberOfPages()).isGreaterThanOrEqualTo(2);
            assertThat(document.getPage(0).getMediaBox().getWidth())
                .isGreaterThan(document.getPage(0).getMediaBox().getHeight());
            assertThat(document.getPage(1).getMediaBox().getHeight())
                .isGreaterThan(document.getPage(1).getMediaBox().getWidth());
        }
    }

    private PropertyComparisonRecord sampleRecord() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 22, 14, 30);
        Property property = Property.reconstruct(
            1L, 1L, "햇살 좋은 원룸", 10_000_000L, 550_000L,
            "부동산 방문", "서울특별시 광진구 능동로 1",
            new BigDecimal("37.5410000"), new BigDecimal("127.0710000"),
            LocalDate.of(2026, 10, 1), 80_000L, now.plusDays(1),
            Set.of(), Set.of(), now, now);
        PropertyProgress progress = new PropertyProgress(2, 1, 1, 0, 1, 50);
        PropertyChecklistStageResponse summary = new PropertyChecklistStageResponse(
            CheckStage.ON_SITE, true, 1L, "현장 필수 확인", 1L, progress);
        PropertyChecklistApplicationQuery application = new PropertyChecklistApplicationQuery(
            1L, 1L, 1L, "현장 필수 확인", CheckStage.ON_SITE,
            List.of(
                new PropertyChecklistItemQuery(1L, 1L, "수압이 충분한가요?", 1,
                    CheckStatus.GOOD, "주방과 욕실 모두 확인"),
                new PropertyChecklistItemQuery(2L, 2L, "창문에 결로 흔적이 있나요?", 2,
                    CheckStatus.UNCONFIRMED, "")
            ));
        PropertyChecklistStageResponse unapplied = new PropertyChecklistStageResponse(
            CheckStage.PRE_CONTRACT, false, null, null, null,
            new PropertyProgress(0, 0, 0, 0, 0, 0));
        return new PropertyComparisonRecord(
            property,
            List.of(new PropertyComparisonRecord.Photo(1L, SAMPLE_PNG, "image/png", true)),
            PropertyMemo.reconstruct(1L, 1L, "채광이 좋고 주변이 조용했습니다.\n관리비 항목을 다시 확인해야 합니다."),
            List.of(
                new PropertyComparisonRecord.Stage(summary, application),
                new PropertyComparisonRecord.Stage(unapplied, null)
            ));
    }

    private TemplateEngine templateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        TemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);
        return templateEngine;
    }
}
