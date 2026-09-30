package com.jachwisunbae.property.service.pdf;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.Iterator;
import java.util.Optional;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PropertyComparisonPhotoOptimizer {

    private static final Logger LOG = LoggerFactory.getLogger(PropertyComparisonPhotoOptimizer.class);
    private static final int MAX_DECODED_EDGE = 1_600;
    private static final int MAX_OUTPUT_EDGE = 1_200;
    private static final float JPEG_QUALITY = 0.78f;

    // 최적화하지 못한 사진은 비교 PDF에서 빼고 나머지로 PDF를 만든다. 대신 어떤 이유로 빠졌는지 로그를 남긴다.
    public byte[] optimize(final byte[] source) {
        Optional<BufferedImage> image = decode(source);
        if (image.isEmpty()) {
            return new byte[0];
        }
        try {
            return encodeJpeg(resize(image.get()));
        } catch (IOException exception) {
            LOG.warn("비교 PDF용 사진을 JPEG로 변환하지 못해 제외합니다.", exception);
            return new byte[0];
        }
    }

    // 사용자가 올린 이미지는 깨져 있을 수 있고, ImageIO는 깨진 이미지에서 IOException 외의 런타임 예외도 던진다.
    // 그래서 이미지를 해석하는 이 부분에 한정해 RuntimeException까지 잡아 그 사진만 제외한다.
    private Optional<BufferedImage> decode(final byte[] source) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(source))) {
            Iterator<ImageReader> readers = input == null ? Collections.emptyIterator()
                    : ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                LOG.info("비교 PDF에서 해석할 수 없는 사진 형식이라 제외합니다.");
                return Optional.empty();
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                int subsampling = Math.max(1, (int) Math.ceil(Math.max(width, height) / (double) MAX_DECODED_EDGE));

                ImageReadParam parameter = reader.getDefaultReadParam();
                parameter.setSourceSubsampling(subsampling, subsampling, 0, 0);
                return Optional.of(reader.read(0, parameter));
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException exception) {
            LOG.warn("비교 PDF용 사진을 해석하지 못해 제외합니다.", exception);
            return Optional.empty();
        }
    }

    private BufferedImage resize(final BufferedImage source) {
        double scale = Math.min(1d, MAX_OUTPUT_EDGE / (double) Math.max(source.getWidth(), source.getHeight()));
        int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(source.getHeight() * scale));
        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();

        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, width, height);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return target;
    }

    private byte[] encodeJpeg(final BufferedImage image) throws IOException {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ImageOutputStream imageOutput = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(imageOutput);
            ImageWriteParam parameter = writer.getDefaultWriteParam();
            parameter.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            parameter.setCompressionQuality(JPEG_QUALITY);

            writer.write(null, new IIOImage(image, null, null), parameter);
            imageOutput.flush();
            return output.toByteArray();
        } finally {
            writer.dispose();
        }
    }
}
