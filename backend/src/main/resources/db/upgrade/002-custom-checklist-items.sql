-- 기존 체크리스트 스냅샷을 유지하면서 사용자 직접 문항을 허용하고 새 제공 문항으로 전환한다.
-- 이전 제공 문항은 삭제하지 않고 비활성화해 기존 FK와 질문 스냅샷을 보존한다.

ALTER TABLE user_checklist_items
    MODIFY system_check_item_id BIGINT UNSIGNED NULL;

ALTER TABLE property_checklist_items
    MODIFY system_check_item_id BIGINT UNSIGNED NULL;

UPDATE system_check_items
SET deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP(6))
WHERE id BETWEEN 1 AND 18;

-- ONLINE_PHONE 문항(옛 101-112번)은 담지 않는다. 006이 이 트랜잭션 안에서 곧바로 삭제해
-- 최종 상태에는 어차피 남지 않고, 통합 스키마(001-schema.sql)는 처음부터
-- chk_system_check_items_stage CHECK로 stage='ONLINE_PHONE' 자체를 막아 INSERT가 실패한다.
INSERT INTO system_check_items (id, stage, item_type, question, display_order, created_at, deleted_at)
VALUES
    (113, 'ON_SITE', 'CORE', '가구 배치시 방구조가 어떤가?', 1, NOW(), NULL),
    (114, 'ON_SITE', 'CORE', '햇빛이 들어오는건 어떤가?', 2, NOW(), NULL),
    (115, 'ON_SITE', 'CORE', '방충망/방범창 이상 없고 괜찮은가?', 3, NOW(), NULL),
    (116, 'ON_SITE', 'CORE', '환기는 어떤가?', 4, NOW(), NULL),
    (117, 'ON_SITE', 'CORE', '싱크대/세면대/샤워기 물 잘 나오는가?', 5, NOW(), NULL),
    (118, 'ON_SITE', 'CORE', '변기 물 잘 내려가는가?', 6, NOW(), NULL),
    (119, 'ON_SITE', 'CORE', '옵션 가구 종류 확인했는가?', 7, NOW(), NULL),
    (120, 'ON_SITE', 'CORE', '쓰레기 배출 장소 방법은 어떤가?', 8, NOW(), NULL),
    (121, 'ON_SITE', 'OPTIONAL', '어플 사진과 실제와 차이는 어떤가?', 9, NOW(), NULL),
    (122, 'ON_SITE', 'OPTIONAL', 'CCTV는 어떤가?', 10, NOW(), NULL),
    (123, 'ON_SITE', 'OPTIONAL', '싱크대/화장실 배수구 잘 내려가는가?', 11, NOW(), NULL),
    (124, 'ON_SITE', 'OPTIONAL', '온수 잘 나오는지, 난방 잘 되는가?', 12, NOW(), NULL),
    (125, 'ON_SITE', 'OPTIONAL', '화장실 내부에 창문 있는가?', 13, NOW(), NULL),
    (126, 'ON_SITE', 'OPTIONAL', '세면대 있는가?', 14, NOW(), NULL),
    (127, 'ON_SITE', 'OPTIONAL', '배수구 냄새 괜찮은가?', 15, NOW(), NULL),
    (128, 'ON_SITE', 'OPTIONAL', '샤워 여유 공간은 괜찮은가?', 16, NOW(), NULL),
    (129, 'ON_SITE', 'OPTIONAL', '에어컨/냉장고 작동 괜찮은가?', 17, NOW(), NULL),
    (130, 'ON_SITE', 'OPTIONAL', '화구 종류 체크했는가?', 18, NOW(), NULL),
    (131, 'ON_SITE', 'OPTIONAL', '옵션 가구 필요 없다면 치워줄 수 있는지 확인했는가?', 19, NOW(), NULL),
    (132, 'ON_SITE', 'OPTIONAL', '수납 공간 충분한가?', 20, NOW(), NULL),
    (133, 'ON_SITE', 'OPTIONAL', '곰팡이, 결로, 누수 흔적은 어떤가?', 21, NOW(), NULL),
    (134, 'ON_SITE', 'OPTIONAL', '벌레 흔적은 어땠는가?', 22, NOW(), NULL),
    (135, 'ON_SITE', 'OPTIONAL', '콘센트 개수 충분했는가?', 23, NOW(), NULL),
    (136, 'ON_SITE', 'OPTIONAL', '방음은 어떤가?', 24, NOW(), NULL),
    (137, 'ON_SITE', 'OPTIONAL', '최근 방이나 건물에 수리한 내역은 어떤가?', 25, NOW(), NULL),
    (138, 'ON_SITE', 'OPTIONAL', '주차 공간은 어떤가?', 26, NOW(), NULL),
    (139, 'ON_SITE', 'OPTIONAL', '인터넷 설치가 되어있는가?', 27, NOW(), NULL),
    (140, 'PRE_CONTRACT', 'CORE', '신분증과 도장을 준비했는가?', 1, NOW(), NULL),
    (141, 'PRE_CONTRACT', 'CORE', '보증금이 준비 되었는가?', 2, NOW(), NULL),
    (142, 'PRE_CONTRACT', 'CORE', '보증금, 월세, 관리비를 확인했는가?', 3, NOW(), NULL),
    (143, 'PRE_CONTRACT', 'CORE', '계약 시작, 종료, 입주, 퇴거일과 같은 계약 기간을 확인했는가?', 4, NOW(), NULL),
    (144, 'PRE_CONTRACT', 'CORE', '관리비(전기, 수도, 인터넷 등 포함 여부) 및 추가 별도 공과금을 확인했는가?', 5, NOW(), NULL),
    (145, 'PRE_CONTRACT', 'CORE', '파손 및 손해배상 조건을 확인했는가?', 6, NOW(), NULL),
    (146, 'PRE_CONTRACT', 'CORE', '전입신고와 확정일자 발급이 가능한지 확인했는가?', 7, NOW(), NULL),
    (147, 'PRE_CONTRACT', 'OPTIONAL', '퇴거 시 청소비 및 수리비 조건을 확인했는가?', 8, NOW(), NULL),
    (148, 'PRE_CONTRACT', 'OPTIONAL', '계약 해지 및 위약금 규정 확인을 했는가?', 9, NOW(), NULL),
    (149, 'PRE_CONTRACT', 'OPTIONAL', '집주인(임대인)의 신분이 등기부등본 소유자와 일치하는지 확인했는가?', 10, NOW(), NULL),
    (150, 'PRE_CONTRACT', 'OPTIONAL', '소유자와 계약자가 동일한지 확인했는가?', 11, NOW(), NULL),
    (151, 'PRE_CONTRACT', 'OPTIONAL', '대리인 계약이면 위임장, 인감증명서, 신분증 사본 등 원본 증빙을 확인했는가?', 12, NOW(), NULL),
    (152, 'PRE_CONTRACT', 'OPTIONAL', '근저당권, 전세권, 가압류, 압류가 있는지 확인했는가?', 13, NOW(), NULL),
    (153, 'PRE_CONTRACT', 'OPTIONAL', '가처분, 가압류 등 분쟁 기록이 없는지 확인했는가?', 14, NOW(), NULL) AS new
ON DUPLICATE KEY UPDATE
    stage = new.stage,
    item_type = new.item_type,
    question = new.question,
    display_order = new.display_order,
    deleted_at = NULL;
