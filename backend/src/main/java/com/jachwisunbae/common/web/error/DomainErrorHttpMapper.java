package com.jachwisunbae.common.web.error;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

// 레거시 BusinessException의 HTTP 상태를 ErrorCode마다 정한다. 아직 옮기지 않은 checklist 코드만 남아 있다.
// 새 예외 계층(JachwiException)은 예외 타입으로 상태를 정하므로, checklist를 옮기면 제거한다.
@Component
public class DomainErrorHttpMapper {

    public HttpStatus statusOf(ErrorCode code) {
        return switch (code) {
            case SYSTEM_CHECK_ITEM_STAGE_REQUIRED,
                 SYSTEM_CHECK_ITEM_TYPE_REQUIRED,
                 SYSTEM_CHECK_ITEM_QUESTION_INVALID,
                 USER_CHECKLIST_MEMBER_REQUIRED,
                 USER_CHECKLIST_NAME_INVALID,
                 USER_CHECKLIST_STAGE_REQUIRED,
                 CHECKLIST_ITEMS_INVALID,
                 CHECKLIST_INACTIVE_ITEM_NOT_ALLOWED,
                 DUPLICATE_CHECK_ITEM,
                 CHECKLIST_ITEM_COUNT_OUT_OF_RANGE,
                 INVALID_SYSTEM_CHECK_ITEM,
                 PROPERTY_CHECKLIST_STAGE_MISMATCH,
                 PROPERTY_CHECK_RESULT_INVALID -> HttpStatus.BAD_REQUEST;
            case MEMBER_NOT_FOUND,
                    CHECKLIST_NOT_FOUND,
                    PROPERTY_CHECKLIST_NOT_FOUND,
                    PROPERTY_CHECKLIST_ITEM_NOT_FOUND -> HttpStatus.NOT_FOUND;
            // 새 예외 계층으로 옮긴 코드(auth, map, property)는 BusinessException으로 던지지 않는다.
            // 레거시 매핑이 없는 코드가 들어오면 서버 문제로 드러낸다.
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
