package com.jachwisunbae.rental.importer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LegalDongCatalogTest {

    private static final Charset MS949 = Charset.forName("MS949");
    private static final String HEADER = "법정동코드\t법정동명\t폐지여부\n";

    @TempDir
    private Path directory;

    @Test
    @DisplayName("현재 법정동만 이름으로 코드를 찾고, 이름의 공백 차이는 무시한다")
    void findsCurrentLegalDongsByNormalizedName() throws IOException {
        // given
        Path file = writeText("codes.txt", HEADER
                + "1162010200\t서울특별시 관악구 신림동\t존재\n"
                + "1162010999\t서울특별시 관악구 옛동\t폐지\n");

        // when
        LegalDongCatalog catalog = LegalDongCatalog.load(file);

        // then
        assertThat(catalog.findCode("  서울특별시   관악구 신림동 ")).contains("1162010200");
        assertThat(catalog.findCode("서울특별시 관악구 옛동")).isEmpty();
    }

    @Test
    @DisplayName("ZIP 안의 첫 파일을 읽는다")
    void readsFirstEntryOfZip() throws IOException {
        // given
        Path zip = directory.resolve("codes.zip");
        try (OutputStream output = Files.newOutputStream(zip);
             ZipOutputStream zipOutput = new ZipOutputStream(output, MS949)) {
            zipOutput.putNextEntry(new ZipEntry("법정동코드 전체자료.txt"));
            zipOutput.write((HEADER + "1162010200\t서울특별시 관악구 신림동\t존재\n").getBytes(MS949));
            zipOutput.closeEntry();
        }

        // when
        LegalDongCatalog catalog = LegalDongCatalog.load(zip);

        // then
        assertThat(catalog.findCode("서울특별시 관악구 신림동")).contains("1162010200");
    }

    @Test
    @DisplayName("빈 ZIP은 거부한다")
    void rejectsEmptyZip() throws IOException {
        // given
        // ZipOutputStream은 항목 없는 ZIP을 만들지 않으므로 중앙 디렉터리 끝 레코드만 직접 쓴다.
        byte[] emptyZip = new byte[22];
        emptyZip[0] = 'P';
        emptyZip[1] = 'K';
        emptyZip[2] = 5;
        emptyZip[3] = 6;
        Path zip = Files.write(directory.resolve("empty.zip"), emptyZip);

        // when // then
        assertThatThrownBy(() -> LegalDongCatalog.load(zip))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비어 있습니다");
    }

    @Test
    @DisplayName("필수 헤더가 없으면 거부한다")
    void rejectsMissingHeader() throws IOException {
        // given
        Path file = writeText("codes.txt", "법정동코드\t법정동명\n1162010200\t서울특별시 관악구 신림동\n");

        // when // then
        assertThatThrownBy(() -> LegalDongCatalog.load(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("헤더");
    }

    @Test
    @DisplayName("폐지 여부가 존재나 폐지가 아니면 거부한다")
    void rejectsUnknownAbolitionStatus() throws IOException {
        // given
        Path file = writeText("codes.txt", HEADER + "1162010200\t서울특별시 관악구 신림동\t모름\n");

        // when // then
        assertThatThrownBy(() -> LegalDongCatalog.load(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("행이 올바르지 않습니다");
    }

    @Test
    @DisplayName("코드가 숫자 10자리가 아니면 거부한다")
    void rejectsInvalidCode() throws IOException {
        // given
        Path file = writeText("codes.txt", HEADER + "11620102\t서울특별시 관악구 신림동\t존재\n");

        // when // then
        assertThatThrownBy(() -> LegalDongCatalog.load(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("값이 올바르지 않습니다");
    }

    @Test
    @DisplayName("같은 현재 이름에 코드가 여러 개면 거부한다")
    void rejectsDuplicateNameWithDifferentCodes() throws IOException {
        // given
        Path file = writeText("codes.txt", HEADER
                + "1162010200\t서울특별시 관악구 신림동\t존재\n"
                + "1162010300\t서울특별시 관악구 신림동\t존재\n");

        // when // then
        assertThatThrownBy(() -> LegalDongCatalog.load(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("코드가 여러 개");
    }

    @Test
    @DisplayName("현재 법정동이 하나도 없으면 거부한다")
    void rejectsWhenNoCurrentLegalDong() throws IOException {
        // given
        Path file = writeText("codes.txt", HEADER + "1162010999\t서울특별시 관악구 옛동\t폐지\n");

        // when // then
        assertThatThrownBy(() -> LegalDongCatalog.load(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("현재 법정동 코드가 없습니다");
    }

    private Path writeText(final String fileName, final String content) throws IOException {
        return Files.writeString(directory.resolve(fileName), content, MS949);
    }
}
