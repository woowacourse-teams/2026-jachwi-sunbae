package com.jachwisunbae.property.service;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.controller.dto.response.PropertyChecklistStageResponse;
import com.jachwisunbae.property.controller.dto.response.PropertyProgress;
import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemQuery;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.stream.IntStream;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class PropertyComparisonPdfRenderer {

    private static final String TEMPLATE = "property-comparison";
    private static final String REGULAR_FONT = "/fonts/NanumGothic-Regular.ttf";
    private static final String BOLD_FONT = "/fonts/NanumGothic-Bold.ttf";
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");
    private static final NumberFormat WON = NumberFormat.getIntegerInstance(Locale.KOREA);

    private final TemplateEngine templateEngine;

    public PropertyComparisonPdfRenderer(final TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public byte[] render(final List<PropertyComparisonRecord> records) {
        Context context = new Context(Locale.KOREA);
        context.setVariable("overviewRows", createOverviewRows(records));
        context.setVariable("properties", createPropertyViews(records));

        String html = templateEngine.process(TEMPLATE, context);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFont(() -> requiredResource(REGULAR_FONT), "NanumGothic", 400, FontStyle.NORMAL, false);
            builder.useFont(() -> requiredResource(BOLD_FONT), "NanumGothic", 700, FontStyle.NORMAL, false);
            builder.withHtmlContent(html, null);
            builder.toStream(output);
            builder.run();
            return output.toByteArray();
        } catch (IOException | RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.PROPERTY_COMPARISON_EXPORT_FAILED,
                "매물 비교 PDF를 생성하지 못했습니다.", exception);
        }
    }

    private List<OverviewRow> createOverviewRows(final List<PropertyComparisonRecord> records) {
        List<OverviewRow> rows = new ArrayList<>();
        rows.add(new OverviewRow("구분", records.stream()
            .map(record -> record.property().getName()).toList(), true));
        rows.add(new OverviewRow("주소", records.stream()
            .map(record -> display(record.property().getAddress())).toList(), false));
        rows.add(new OverviewRow("보증금", records.stream()
            .map(record -> money(record.property().getDepositAmount())).toList(), false));
        rows.add(new OverviewRow("월세", records.stream()
            .map(record -> money(record.property().getMonthlyRentAmount())).toList(), false));
        rows.add(new OverviewRow("발견 경로", records.stream()
            .map(record -> abbreviate(display(record.property().getDiscoverySource()), 70)).toList(), false));
        rows.add(new OverviewRow("사진", records.stream()
            .map(record -> record.photos().size() + "장").toList(), false));
        for (CheckStage stage : CheckStage.values()) {
            rows.add(new OverviewRow(stageLabel(stage), records.stream()
                .map(record -> stageSummary(record, stage)).toList(), false));
        }
        return List.copyOf(rows);
    }

    private List<PropertyView> createPropertyViews(final List<PropertyComparisonRecord> records) {
        return IntStream.range(0, records.size())
            .mapToObj(index -> createPropertyView(records.get(index), index + 1, records.size()))
            .toList();
    }

    private PropertyView createPropertyView(final PropertyComparisonRecord record,
                                            final int index,
                                            final int total) {
        Property property = record.property();
        List<KeyValue> basics = List.of(
            new KeyValue("보증금", money(property.getDepositAmount())),
            new KeyValue("월세", money(property.getMonthlyRentAmount())),
            new KeyValue("발견 경로", display(property.getDiscoverySource())),
            new KeyValue("주소", display(property.getAddress())),
            new KeyValue("좌표", coordinates(property.getLatitude(), property.getLongitude())),
            new KeyValue("등록 시각", format(property.getCreatedAt()))
        );
        List<PhotoView> photos = IntStream.range(0, record.photos().size())
            .mapToObj(photoIndex -> createPhotoView(record.photos().get(photoIndex), photoIndex + 1))
            .toList();
        List<StageView> stages = IntStream.range(0, record.stages().size())
            .mapToObj(stageIndex -> createStageView(record.stages().get(stageIndex), stageIndex + 1))
            .toList();
        String memo = record.memo() == null ? "" : blankToEmpty(record.memo().getFreeMemo());
        return new PropertyView(index, total, property.getName(), basics, photos, memo, stages);
    }

    private PhotoView createPhotoView(final PropertyComparisonRecord.Photo photo, final int index) {
        String contentType = photo.contentType() == null || photo.contentType().isBlank()
            ? "image/jpeg"
            : photo.contentType();
        String dataUri = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(photo.bytes());
        String label = "사진 " + index + (photo.representative() ? " · 대표 사진" : "");
        return new PhotoView(dataUri, label);
    }

    private StageView createStageView(final PropertyComparisonRecord.Stage stage, final int index) {
        PropertyChecklistStageResponse summary = stage.summary();
        boolean applied = summary.applied() && stage.application() != null;
        List<CheckItemView> items = applied ? stage.application().items().stream()
            .map(this::createCheckItemView)
            .toList() : List.of();
        return new StageView(index, stageLabel(summary.stage()), applied,
            applied ? display(summary.checklistName()) : "",
            applied ? progressText(summary.progress()) : "",
            items);
    }

    private CheckItemView createCheckItemView(final PropertyChecklistItemQuery item) {
        return new CheckItemView(statusLabel(item.status()), statusClass(item.status()),
            item.question(), blankToEmpty(item.memo()));
    }

    private InputStream requiredResource(final String path) {
        InputStream input = getClass().getResourceAsStream(path);
        if (input == null) {
            throw new IllegalStateException("PDF 글꼴 리소스를 찾을 수 없습니다: " + path);
        }
        return input;
    }

    private static String stageSummary(final PropertyComparisonRecord record, final CheckStage stage) {
        return record.stages().stream()
            .filter(candidate -> candidate.summary().stage() == stage)
            .findFirst()
            .map(candidate -> candidate.summary().applied()
                ? progressText(candidate.summary().progress())
                : "미적용")
            .orElse("미적용");
    }

    private static String progressText(final PropertyProgress progress) {
        return progress.completedCount() + "/" + progress.totalCount()
            + " · 괜찮음 " + progress.goodCount()
            + " · 주의 " + progress.cautionCount()
            + " · 미확인 " + progress.unconfirmedCount();
    }

    private static String stageLabel(final CheckStage stage) {
        return switch (stage) {
            case ON_SITE -> "현장 확인";
            case PRE_CONTRACT -> "계약 전 확인";
        };
    }

    private static String statusLabel(final CheckStatus status) {
        return switch (status) {
            case GOOD -> "괜찮음";
            case CAUTION -> "주의";
            case UNCONFIRMED -> "미확인";
        };
    }

    private static String statusClass(final CheckStatus status) {
        return switch (status) {
            case GOOD -> "good";
            case CAUTION -> "caution";
            case UNCONFIRMED -> "unconfirmed";
        };
    }

    private static String money(final Long amount) {
        return WON.format(amount == null ? 0 : amount) + "원";
    }

    private static String coordinates(final BigDecimal latitude, final BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            return "입력 없음";
        }
        return latitude.toPlainString() + ", " + longitude.toPlainString();
    }

    private static String format(final LocalDateTime value) {
        return value == null ? "입력 없음" : DATE_TIME.format(value);
    }

    private static String display(final String value) {
        return value == null || value.isBlank() ? "입력 없음" : value;
    }

    private static String blankToEmpty(final String value) {
        return value == null || value.isBlank() ? "" : value;
    }

    private static String abbreviate(final String value, final int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength - 1) + "…";
    }

    public record OverviewRow(String label, List<String> values, boolean heading) {
    }

    public record KeyValue(String label, String value) {
    }

    public record PhotoView(String source, String label) {
    }

    public record CheckItemView(String status, String statusClass, String question, String memo) {
    }

    public record StageView(int index, String label, boolean applied, String checklistName,
                            String progress, List<CheckItemView> items) {
    }

    public record PropertyView(int index, int total, String name, List<KeyValue> basics,
                               List<PhotoView> photos, String memo, List<StageView> stages) {
    }
}
