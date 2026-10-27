package com.jachwisunbae.promotion.provider.seveneleven;

import com.jachwisunbae.promotion.collector.PromotionLocalCollectionCommand;
import com.jachwisunbae.promotion.domain.ConvenienceBrand;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import com.jachwisunbae.promotion.domain.PromotionType;
import com.jachwisunbae.promotion.provider.PromotionFetcher;
import com.jachwisunbae.promotion.support.PromotionProductsFixture;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;

// test classpath 전용. 저장 대상은 기존 명령이 생성하는 새 로컬 Testcontainers MySQL이다.
public class SevenElevenLocalCollectionCommand {

    public static void main(final String[] args) {
        PromotionFetcher fetcher = fetcher(args);
        System.out.println("출처: 세븐일레븐 공식 홈페이지 " + SevenElevenPromotionClient.SOURCE_URL);
        System.out.println("mode=" + args[0] + "; --fixture는 실제 첫 화면을 재사용한 부분 표본이며 전체 수집이 아닙니다.");
        PromotionLocalCollectionCommand.store(PromotionProductsFixture.fetcher(ConvenienceBrand.SEVEN_ELEVEN, () -> {
            List<PromotionProduct> products = fetcher.fetch();
            for (PromotionType type : PromotionType.values()) {
                System.out.println("원본 " + type.displayName() + ": "
                        + products.stream().filter(product -> product.promotionType() == type).count() + "건");
            }
            System.out.println("증정행사: 0건 (비어 있지 않은 증정행사는 조건 검증 전 수집 실패로 처리)");
            System.out.println("원본=" + products.size() + ", 중복=" + (products.size() - new HashSet<>(products).size())
                    + ", 중복 제거 후=" + new HashSet<>(products).size());
            System.out.println("공식 카테고리 미확보: 모든 상품 UNKNOWN");
            return products;
        }));
    }

    static PromotionFetcher fetcher(final String[] args) {
        if (args.length == 1 && args[0].equals("--fixture")) {
            return PromotionProductsFixture.fetcher(ConvenienceBrand.SEVEN_ELEVEN, SevenElevenPromotionFixtures::sample);
        }
        if (args.length != 2 || !(args[0].equals("--live") || args[0].equals("--replay"))) {
            throw new IllegalArgumentException("--fixture | --live <새 응답 폴더> | --replay <완료된 응답 폴더>");
        }
        boolean live = args[0].equals("--live");
        Path directory = Path.of(args[1]).toAbsolutePath();
        try {
            if (live) {
                Files.createDirectories(directory.getParent());
                Files.createDirectory(directory);
            } else if (!Files.isRegularFile(directory.resolve("completed.txt"))) {
                throw new IllegalArgumentException("완료 표시가 없는 부분 수집은 저장하지 않습니다.");
            }
        } catch (IOException exception) {
            throw new IllegalStateException("응답 폴더 준비 실패", exception);
        }
        SevenElevenPromotionClient client = new SevenElevenPromotionClient() {
            @Override
            synchronized String fetchFirst(final SevenElevenPromotionTab tab) {
                return response("tab" + tab.code() + "-first.html", () -> super.fetchFirst(tab));
            }

            @Override
            synchronized String fetchMore(final SevenElevenPromotionTab tab, final int page) {
                return response("tab" + tab.code() + "-page" + page + ".html", () -> super.fetchMore(tab, page));
            }

            private String response(final String file, final java.util.function.Supplier<String> request) {
                try {
                    if (!live) {
                        return Files.readString(directory.resolve(file));
                    }
                    String html = request.get();
                    Files.writeString(directory.resolve(file), html, StandardOpenOption.CREATE_NEW);
                    return html;
                } catch (IOException exception) {
                    throw new IllegalStateException("응답 파일 읽기·저장 실패: " + file, exception);
                }
            }
        };
        return PromotionProductsFixture.fetcher(ConvenienceBrand.SEVEN_ELEVEN, () -> {
            if (live) {
                claimDailyAttempt(Path.of(System.getProperty("user.home"), ".jachwi-sunbae", "promotions"),
                        Clock.systemUTC());
            }
            List<PromotionProduct> products = new SevenElevenPromotionFetcher(client).fetch();
            if (live) {
                try {
                    Files.writeString(directory.resolve("completed.txt"), Clock.systemUTC().instant().toString(),
                            StandardOpenOption.CREATE_NEW);
                } catch (IOException exception) {
                    throw new IllegalStateException("수집 완료 기록 실패", exception);
                }
            }
            return products;
        });
    }

    static void claimDailyAttempt(final Path directory, final Clock clock) {
        LocalDate today = clock.instant().atZone(ZoneId.of("Asia/Seoul")).toLocalDate();
        try {
            Files.createDirectories(directory);
            Files.writeString(directory.resolve("seven-eleven-" + today + ".attempt"), clock.instant().toString(),
                    StandardOpenOption.CREATE_NEW);
        } catch (IOException exception) {
            throw new IllegalStateException("당일 실행 기록이 있거나 기록할 수 없어 외부 수집을 중단합니다. day=" + today,
                    exception);
        }
    }
}
