package com.jachwisunbae.rental.importer;

import com.jachwisunbae.rental.domain.LegalDong;
import com.jachwisunbae.rental.domain.RentalArea;
import com.jachwisunbae.rental.domain.RentalPrice;
import com.jachwisunbae.rental.domain.RentalSource;
import com.jachwisunbae.rental.domain.RentalTransaction;
import com.jachwisunbae.rental.domain.RentalTransaction.AreaBasis;
import com.jachwisunbae.rental.domain.RentalTransaction.HousingType;
import java.io.IOException;
import java.io.PushbackReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.csv.DuplicateHeaderMode;

public class RentalCsvReader {
    private static final Set<String> REQUIRED = Set.of(
        "legal_dong", "housing_type", "deposit_10k_krw", "monthly_rent_10k_krw", "area_m2",
        "area_basis", "contract_date", "contract_type", "building_name", "floor",
        "contract_period", "source_file", "source_row_number"
    );

    public Result read(final Path path, final LegalDongCatalog catalog) throws IOException {
        List<RentalTransaction> transactions = new ArrayList<>();
        Map<String, Integer> unmatched = new TreeMap<>();
        Set<SourceRow> identities = new HashSet<>();
        int totalRows = 0;
        CSVFormat format = CSVFormat.RFC4180.builder().setHeader().setSkipHeaderRecord(true)
            .setDuplicateHeaderMode(DuplicateHeaderMode.DISALLOW).get();
        try (PushbackReader reader = new PushbackReader(Files.newBufferedReader(path, StandardCharsets.UTF_8))) {
            int first = reader.read();
            if (first != -1 && first != '\uFEFF') {
                reader.unread(first);
            }
            try (CSVParser parser = format.parse(reader)) {
                if (!parser.getHeaderMap().keySet().containsAll(REQUIRED)) {
                    throw new IllegalArgumentException("정제 거래 CSV의 필수 헤더가 누락됐습니다.");
                }
                for (CSVRecord row : parser) {
                    totalRows++;
                    if (!row.isConsistent()) {
                        throw new IllegalArgumentException("CSV 열 수가 일치하지 않습니다: " + row.getRecordNumber());
                    }
                    String name = LegalDongCatalog.normalizeName(row.get("legal_dong"));
                    SourceRow identity = new SourceRow(row.get("source_file"), Long.parseLong(row.get("source_row_number")));
                    if (!identities.add(identity)) {
                        throw new IllegalArgumentException("원본 행 식별자가 중복됐습니다: " + identity);
                    }
                    String code = catalog.findCode(name).orElse(null);
                    if (code == null) {
                        unmatched.merge(name, 1, Integer::sum);
                        continue;
                    }
                    try {
                        transactions.add(parse(row, code, name));
                    } catch (IllegalArgumentException | ArithmeticException exception) {
                        throw new IllegalArgumentException("CSV 거래 값이 올바르지 않습니다: 행 "
                            + row.getRecordNumber(), exception);
                    }
                }
            }
        }
        if (totalRows == 0) {
            throw new IllegalArgumentException("거래 CSV가 비어 있습니다.");
        }
        return new Result(transactions, unmatched, totalRows);
    }

    private RentalTransaction parse(final CSVRecord row, final String code, final String name) {
        HousingType type = switch (row.get("housing_type")) {
            case "연립다세대" -> HousingType.ROWHOUSE;
            case "단독다가구" -> HousingType.DETACHED;
            case "오피스텔" -> HousingType.OFFICETEL;
            default -> throw new IllegalArgumentException("알 수 없는 주택 유형입니다.");
        };
        AreaBasis basis = switch (row.get("area_basis")) {
            case "exclusive" -> AreaBasis.EXCLUSIVE;
            case "contract" -> AreaBasis.CONTRACT;
            default -> throw new IllegalArgumentException("알 수 없는 면적 기준입니다.");
        };
        String contractType = switch (row.get("contract_type")) {
            case "신규" -> "NEW";
            case "갱신" -> "RENEWAL";
            case "-", "" -> "UNKNOWN";
            default -> throw new IllegalArgumentException("알 수 없는 계약 구분입니다.");
        };
        return new RentalTransaction(new LegalDong(code, name), type,
            new RentalPrice(
                new BigDecimal(row.get("deposit_10k_krw")).multiply(BigDecimal.valueOf(10000)).longValueExact(),
                new BigDecimal(row.get("monthly_rent_10k_krw")).multiply(BigDecimal.valueOf(10000)).longValueExact()),
            new RentalArea(new BigDecimal(row.get("area_m2")), basis), LocalDate.parse(row.get("contract_date")),
            contractType, row.get("building_name"), row.get("floor"), row.get("contract_period"),
            new RentalSource(row.get("source_file"), Long.parseLong(row.get("source_row_number"))));
    }

    private record SourceRow(String sourceFile, long sourceRowNumber) {
    }

    public record Result(List<RentalTransaction> transactions, Map<String, Integer> unmatched, int totalRows) {
        public Result {
            transactions = List.copyOf(transactions);
            unmatched = Map.copyOf(unmatched);
        }
    }
}
