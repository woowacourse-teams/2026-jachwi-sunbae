package com.jachwisunbae.property.service.pdf;

import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.property.controller.dto.response.PropertyChecklistStageResponse;
import com.jachwisunbae.property.controller.dto.response.PropertyProgress;
import com.jachwisunbae.property.entity.Property;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemQuery;
import com.jachwisunbae.property.service.pdf.model.PropertyComparisonPhoto;
import com.jachwisunbae.property.service.pdf.model.PropertyComparisonRecord;
import com.jachwisunbae.property.service.pdf.model.PropertyComparisonStage;
import com.jachwisunbae.property.service.pdf.view.CheckItemView;
import com.jachwisunbae.property.service.pdf.view.KeyValue;
import com.jachwisunbae.property.service.pdf.view.OverviewRow;
import com.jachwisunbae.property.service.pdf.view.PhotoView;
import com.jachwisunbae.property.service.pdf.view.PropertyComparisonPdfView;
import com.jachwisunbae.property.service.pdf.view.PropertyView;
import com.jachwisunbae.property.service.pdf.view.StageView;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.IntStream;
import org.springframework.stereotype.Component;

@Component
public class PropertyComparisonPdfViewMapper {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");
    private static final NumberFormat WON = NumberFormat.getIntegerInstance(Locale.KOREA);

    public PropertyComparisonPdfView map(final List<PropertyComparisonRecord> records) {
        return new PropertyComparisonPdfView(createOverviewRows(records), createPropertyViews(records));
    }

    private List<OverviewRow> createOverviewRows(final List<PropertyComparisonRecord> records) {
        List<OverviewRow> rows = new ArrayList<>();
        rows.add(overviewRow("구분", records, record -> record.property().getName(), true));
        rows.add(overviewRow("주소", records, record -> display(record.property().getAddress())));
        rows.add(overviewRow("보증금", records, record -> money(record.property().getDepositAmount())));
        rows.add(overviewRow("월세", records, record -> money(record.property().getMonthlyRentAmount())));
        rows.add(overviewRow("발견 경로", records,
            record -> abbreviate(display(record.property().getDiscoverySource()), 70)));
        rows.add(overviewRow("사진", records, record -> record.photos().size() + "장"));

        for (CheckStage stage : CheckStage.values()) {
            rows.add(overviewRow(stageLabel(stage), records, record -> stageSummary(record, stage)));
        }
        return List.copyOf(rows);
    }

    private OverviewRow overviewRow(final String label,
                                    final List<PropertyComparisonRecord> records,
                                    final Function<PropertyComparisonRecord, String> valueMapper) {
        return overviewRow(label, records, valueMapper, false);
    }

    private OverviewRow overviewRow(final String label,
                                    final List<PropertyComparisonRecord> records,
                                    final Function<PropertyComparisonRecord, String> valueMapper,
                                    final boolean heading) {
        return new OverviewRow(label, records.stream().map(valueMapper).toList(), heading);
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

    private PhotoView createPhotoView(final PropertyComparisonPhoto photo, final int index) {
        String contentType = photo.contentType() == null || photo.contentType().isBlank()
            ? "image/jpeg"
            : photo.contentType();

        String source = "data:" + contentType + ";base64,"
            + Base64.getEncoder().encodeToString(photo.bytes());

        String label = "사진 " + index + (photo.representative() ? " · 대표 사진" : "");
        return new PhotoView(source, label);
    }

    private StageView createStageView(final PropertyComparisonStage stage, final int index) {
        PropertyChecklistStageResponse summary = stage.summary();
        boolean hasApplication = summary.applied() && stage.application() != null;

        List<CheckItemView> items = hasApplication ? stage.application().items().stream()
            .map(this::createCheckItemView)
            .toList() : List.of();

        return new StageView(index, stageLabel(summary.stage()), hasApplication,
            hasApplication ? display(summary.checklistName()) : "",
            hasApplication ? progressText(summary.progress()) : "",
            items);
    }

    private CheckItemView createCheckItemView(final PropertyChecklistItemQuery item) {
        return new CheckItemView(statusLabel(item.status()), statusClass(item.status()),
            item.question(), blankToEmpty(item.memo()));
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
}
