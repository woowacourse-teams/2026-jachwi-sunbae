package com.jachwisunbae.transit.provider.gtfs;

import java.io.IOException;
import java.io.PushbackReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;

public class GtfsFiles {

    private static final CSVFormat CSV = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .get();
    private static final char BYTE_ORDER_MARK = '﻿';

    private final Path directory;

    public GtfsFiles(final Path directory) {
        this.directory = directory;
    }

    public <T> List<T> read(final String fileName, final Function<GtfsRecord, Optional<T>> mapper) {
        List<T> rows = new ArrayList<>();
        forEach(fileName, record -> mapper.apply(record).ifPresent(rows::add));
        return rows;
    }

    // 람다 안에서 쓰도록 IOException을 UncheckedIOException으로 바꾼다. commons-csv도 행을 읽다 실패하면 같은 예외를 던진다.
    public void forEach(final String fileName, final Consumer<GtfsRecord> consumer) {
        try (CSVParser parser = open(directory.resolve(fileName))) {
            parser.forEach(row -> consumer.accept(new GtfsRecord(row)));
        } catch (IOException exception) {
            throw new UncheckedIOException(fileName + " 파일을 읽지 못했습니다.", exception);
        }
    }

    // UTF-8 BOM이 붙은 파일은 첫 헤더 이름에 BOM이 섞여 컬럼을 찾지 못하므로 건너뛴다.
    private CSVParser open(final Path path) throws IOException {
        PushbackReader reader = new PushbackReader(Files.newBufferedReader(path, StandardCharsets.UTF_8), 1);
        int firstCharacter = reader.read();
        if (firstCharacter != BYTE_ORDER_MARK && firstCharacter != -1) {
            reader.unread(firstCharacter);
        }
        return CSV.parse(reader);
    }
}
