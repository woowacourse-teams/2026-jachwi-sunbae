package com.jachwisunbae.common.web.error;

import com.jachwisunbae.common.exception.errorcode.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

// 레거시 BusinessException의 HTTP 상태를 ErrorCode마다 정한다.
// 새 예외 계층(JachwiException)은 예외 타입으로 상태를 정하므로, 모든 패키지를 옮기면 제거한다.
@Component
public class DomainErrorHttpMapper {

    public HttpStatus statusOf(ErrorCode code) {
        return switch (code) {
            case INVALID_REQUEST,
                 SYSTEM_CHECK_ITEM_STAGE_REQUIRED,
                 SYSTEM_CHECK_ITEM_TYPE_REQUIRED,
                 SYSTEM_CHECK_ITEM_QUESTION_INVALID,
                 NICKNAME_INVALID,
                 NICKNAME_PASSWORD_INVALID,
                 USER_CHECKLIST_MEMBER_REQUIRED,
                 USER_CHECKLIST_NAME_INVALID,
                 USER_CHECKLIST_STAGE_REQUIRED,
                 USER_CHECKLIST_DELETED_AT_REQUIRED,
                 CHECKLIST_ITEMS_INVALID,
                 CHECKLIST_ITEM_STAGE_MISMATCH,
                 CHECKLIST_CORE_ITEM_REQUIRED,
                 CHECKLIST_INACTIVE_ITEM_NOT_ALLOWED,
                 DUPLICATE_CHECK_ITEM,
                 CHECKLIST_ITEM_COUNT_OUT_OF_RANGE,
                 INVALID_SYSTEM_CHECK_ITEM,
                 PROPERTY_INPUT_INVALID,
                 PROPERTY_LOCATION_INVALID,
                 PROPERTY_MEMO_INVALID,
                 PROPERTY_CHECKLIST_STAGE_MISMATCH,
                 PROPERTY_CHECK_RESULT_INVALID,
                 PHOTO_LIMIT_EXCEEDED,
                 PHOTO_CONTENT_TYPE_UNSUPPORTED,
                 PHOTO_FILE_SIZE_INVALID,
                 PHOTO_FILE_READ_FAILURE,
                 MAP_QUERY_INVALID -> HttpStatus.BAD_REQUEST;
            case RESOURCE_NOT_FOUND,
                    MEMBER_NOT_FOUND,
                    CHECKLIST_NOT_FOUND,
                    CHECKLIST_ITEM_NOT_FOUND,
                    PROPERTY_NOT_FOUND,
                    PHOTO_NOT_FOUND,
                    PROPERTY_CHECKLIST_NOT_FOUND,
                    PROPERTY_CHECKLIST_ITEM_NOT_FOUND,
                    MAP_ADDRESS_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case ACCESS_TOKEN_INVALID,
                    NICKNAME_AUTHENTICATION_FAILED -> HttpStatus.UNAUTHORIZED;
            case PROPERTY_LIMIT_EXCEEDED -> HttpStatus.CONFLICT;
            case METHOD_NOT_ALLOWED -> HttpStatus.METHOD_NOT_ALLOWED;
            case PHOTO_FILE_TOO_LARGE -> HttpStatus.PAYLOAD_TOO_LARGE;
            case UNSUPPORTED_MEDIA_TYPE -> HttpStatus.UNSUPPORTED_MEDIA_TYPE;
            case INTERNAL_SERVER_ERROR -> HttpStatus.INTERNAL_SERVER_ERROR;
            case PHOTO_STORAGE_FAILURE,
                    PROPERTY_COMPARISON_EXPORT_FAILED,
                    MAP_PROVIDER_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
        };
    }
}
