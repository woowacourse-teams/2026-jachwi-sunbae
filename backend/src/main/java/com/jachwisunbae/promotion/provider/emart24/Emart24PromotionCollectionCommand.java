package com.jachwisunbae.promotion.provider.emart24;

import com.jachwisunbae.promotion.domain.ProductCategory;
import com.jachwisunbae.promotion.domain.PromotionProduct;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

// Spring 애플리케이션과 DB를 실행하지 않는 명시적 로컬 검증 진입점이다.
public class Emart24PromotionCollectionCommand {

    public static void main(final String[] args) {
        if (args.length != 1 || !List.of("--sample", "--sample-all", "--all").contains(args[0])) {
            throw new IllegalArgumentException("실행 모드를 지정하세요: --sample | --sample-all | --all");
        }
        System.out.println("[EMART24] 수집 시작 (" + args[0] + ")");
        Emart24PromotionClient client = new Emart24PromotionClient();
        List<PromotionProduct> products = switch (args[0]) {
            case "--all" -> new Emart24PromotionFetcher(client).fetch();
            case "--sample-all" -> sample(client, Emart24ProductCategory.values());
            default -> sample(client, new Emart24ProductCategory[]{Emart24ProductCategory.MEAL});
        };
        for (ProductCategory category : ProductCategory.values()) {
            long count = products.stream().filter(product -> product.category() == category).count();
            System.out.println(category.displayName() + ": " + count + "개");
        }
        System.out.println("전체 수집: " + products.size() + "개");
        System.out.println("동일한 모든 필드의 중복: " + (products.size() - new HashSet<>(products).size()) + "개");
        long crossCategoryCount = products.stream().collect(Collectors.groupingBy(
                        product -> List.of(product.name(), product.price(), product.imageUrl(), product.promotionType()),
                        Collectors.mapping(PromotionProduct::category, Collectors.toSet())))
                .values().stream().filter(categories -> categories.size() > 1).count();
        System.out.println("카테고리 외 필드가 같은 분류 간 중복 후보: " + crossCategoryCount + "그룹 (원본 보존)");
        System.out.println("샘플 상품:");
        for (ProductCategory category : ProductCategory.values()) {
            products.stream().filter(product -> product.category() == category).findFirst().ifPresent(product ->
                    System.out.printf("- 브랜드: %s%n  상품명: %s%n  가격: %d%n  이미지: %s%n  카테고리: %s%n  행사 유형: %s%n",
                            product.brand(), product.name(), product.price(), product.imageUrl(),
                            product.category().displayName(), product.promotionType().displayName()));
        }
        System.out.println("[EMART24] 수집 완료");
    }

    private static List<PromotionProduct> sample(final Emart24PromotionClient client,
                                               final Emart24ProductCategory[] categories) {
        Emart24PromotionParser parser = new Emart24PromotionParser();
        List<PromotionProduct> products = new ArrayList<>();
        for (Emart24ProductCategory category : categories) {
            Emart24PromotionParser.Page page = parser.parse(client.fetch(category, 1), category, 1);
            System.out.printf("HTTP 200, %s page=1, 카드=%d개, 전체=%d개%n", category.category().displayName(),
                    page.products().size(), page.totalCount());
            products.addAll(page.products());
        }
        return List.copyOf(products);
    }
}
