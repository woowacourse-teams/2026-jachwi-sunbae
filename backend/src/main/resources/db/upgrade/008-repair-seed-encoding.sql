-- MySQL 초기화 클라이언트의 문자셋 설정으로 깨진 초기 체크 항목과 스냅샷을 복구한다.
CREATE TEMPORARY TABLE seed_question_repairs (
    id BIGINT UNSIGNED PRIMARY KEY,
    question VARCHAR(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO seed_question_repairs (id, question) VALUES
    (101, '수압(싱크대, 세면대, 샤워기, 변기)이 충분히 강한가요?'),
    (102, '배수가 원활하고 역류나 악취가 없나요?'),
    (103, '벽지나 천장에 누수 흔적이나 곰팡이가 없나요?'),
    (104, '창문 방음과 닫힘 상태가 양호하며 외풍이 없나요?'),
    (105, '기본 옵션 가전제품(에어컨, 세탁기, 냉장고 등)이 정상 작동하나요?'),
    (106, '방 안 채광과 통풍이 원활한가요?'),
    (107, '건물 현관 도어락, CCTV 등 보안 시설이 잘 갖춰져 있나요?'),
    (108, '주변 소음(도로, 상가, 층간소음 등)이 심하지 않나요?'),
    (201, '등기부등본상 소유자와 임대인이 일치하나요?'),
    (202, '근저당권(융자) 및 선순위 보증금 규모가 위험하지 않은 수준인가요?'),
    (203, '건축물대장상 위반건축물 표시가 없나요?'),
    (204, '관리비에 포함된 항목과 실제 부과 내역을 확인했나요?'),
    (205, '특약사항(전세보증보험 가입 불가 시 계약 해제 등)이 명시되어 있나요?'),
    (206, '중개대상물 확인·설명서 내용에 이상이 없나요?');

UPDATE system_check_items item
JOIN seed_question_repairs repair ON repair.id = item.id
SET item.question = repair.question;

UPDATE user_checklist_items item
JOIN seed_question_repairs repair ON repair.id = item.system_check_item_id
SET item.question = repair.question;

UPDATE property_checklist_items item
JOIN seed_question_repairs repair ON repair.id = item.system_check_item_id
SET item.question = repair.question;

DROP TEMPORARY TABLE seed_question_repairs;
