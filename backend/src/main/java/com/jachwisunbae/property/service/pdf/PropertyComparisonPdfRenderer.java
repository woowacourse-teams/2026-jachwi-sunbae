package com.jachwisunbae.property.service.pdf;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.service.pdf.model.PropertyComparisonRecord;
import com.jachwisunbae.property.service.pdf.view.PropertyComparisonPdfView;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class PropertyComparisonPdfRenderer {

    private static final String TEMPLATE = "pdf/property-comparison";
    private static final String REGULAR_FONT = "/fonts/NanumGothic-Regular.ttf";
    private static final String BOLD_FONT = "/fonts/NanumGothic-Bold.ttf";

    private final TemplateEngine templateEngine;
    private final PropertyComparisonPdfViewMapper viewMapper;

    public PropertyComparisonPdfRenderer(final TemplateEngine templateEngine,
                                         final PropertyComparisonPdfViewMapper viewMapper) {
        this.templateEngine = templateEngine;
        this.viewMapper = viewMapper;
    }

    public byte[] render(final List<PropertyComparisonRecord> records) {
        return renderPdf(renderHtml(records));
    }

    private String renderHtml(final List<PropertyComparisonRecord> records) {
        PropertyComparisonPdfView view = viewMapper.map(records);
        Context context = new Context(Locale.KOREA);
        context.setVariable("overviewRows", view.overviewRows());
        context.setVariable("properties", view.properties());
        return templateEngine.process(TEMPLATE, context);
    }

    private byte[] renderPdf(final String html) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            configureFonts(builder);
            builder.withHtmlContent(html, null);
            builder.toStream(output);
            builder.run();
            return output.toByteArray();
        } catch (IOException | RuntimeException exception) {
            throw new BusinessException(DomainErrorCode.PROPERTY_COMPARISON_EXPORT_FAILED,
                "매물 비교 PDF를 생성하지 못했습니다.", exception);
        }
    }

    private void configureFonts(final PdfRendererBuilder builder) {
        builder.useFont(() -> requiredResource(REGULAR_FONT), "NanumGothic", 400, FontStyle.NORMAL, true);
        builder.useFont(() -> requiredResource(BOLD_FONT), "NanumGothic", 700, FontStyle.NORMAL, true);
    }

    private InputStream requiredResource(final String path) {
        InputStream input = getClass().getResourceAsStream(path);
        if (input == null) {
            throw new IllegalStateException("PDF 글꼴 리소스를 찾을 수 없습니다: " + path);
        }
        return input;
    }

}
