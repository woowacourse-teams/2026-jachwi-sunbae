-- 기존 데이터 정리
DELETE FROM property_checklist_items;
DELETE FROM property_checklists;
DELETE FROM user_checklist_items;
DELETE FROM user_checklists;
DELETE FROM member_checklist_preferences;
DELETE FROM system_check_items;

-- ON_SITE (방문 확인) 시스템 항목 Seed
INSERT INTO system_check_items (id, stage, item_type, question, display_order, created_at, deleted_at) VALUES
(101, 'ON_SITE', 'CORE', '수압(싱크대, 세면대, 샤워기, 변기)이 충분히 강한가요?', 1, NOW(), NULL),
(102, 'ON_SITE', 'CORE', '배수가 원활하고 역류나 악취가 없나요?', 2, NOW(), NULL),
(103, 'ON_SITE', 'CORE', '벽지나 천장에 누수 흔적이나 곰팡이가 없나요?', 3, NOW(), NULL),
(104, 'ON_SITE', 'CORE', '창문 방음과 닫힘 상태가 양호하며 외풍이 없나요?', 4, NOW(), NULL),
(105, 'ON_SITE', 'OPTIONAL', '기본 옵션 가전제품(에어컨, 세탁기, 냉장고 등)이 정상 작동하나요?', 5, NOW(), NULL),
(106, 'ON_SITE', 'OPTIONAL', '방 안 채광과 통풍이 원활한가요?', 6, NOW(), NULL),
(107, 'ON_SITE', 'OPTIONAL', '건물 현관 도어락, CCTV 등 보안 시설이 잘 갖춰져 있나요?', 7, NOW(), NULL),
(108, 'ON_SITE', 'OPTIONAL', '주변 소음(도로, 상가, 층간소음 등)이 심하지 않나요?', 8, NOW(), NULL);

-- PRE_CONTRACT (계약 전 확인) 시스템 항목 Seed
INSERT INTO system_check_items (id, stage, item_type, question, display_order, created_at, deleted_at) VALUES
(201, 'PRE_CONTRACT', 'CORE', '등기부등본상 소유자와 임대인이 일치하나요?', 1, NOW(), NULL),
(202, 'PRE_CONTRACT', 'CORE', '근저당권(융자) 및 선순위 보증금 규모가 위험하지 않은 수준인가요?', 2, NOW(), NULL),
(203, 'PRE_CONTRACT', 'CORE', '건축물대장상 위반건축물 표시가 없나요?', 3, NOW(), NULL),
(204, 'PRE_CONTRACT', 'OPTIONAL', '관리비에 포함된 항목과 실제 부과 내역을 확인했나요?', 4, NOW(), NULL),
(205, 'PRE_CONTRACT', 'OPTIONAL', '특약사항(전세보증보험 가입 불가 시 계약 해제 등)이 명시되어 있나요?', 5, NOW(), NULL),
(206, 'PRE_CONTRACT', 'OPTIONAL', '중개대상물 확인·설명서 내용에 이상이 없나요?', 6, NOW(), NULL);
