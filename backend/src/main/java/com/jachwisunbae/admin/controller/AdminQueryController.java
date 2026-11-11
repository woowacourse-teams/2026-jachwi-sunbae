package com.jachwisunbae.admin.controller;

import com.jachwisunbae.admin.repository.query.AdminMember;
import com.jachwisunbae.admin.repository.query.AdminSummary;
import com.jachwisunbae.admin.service.AdminQueryService;
import com.jachwisunbae.common.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin queries", description = "Authorization: Admin <접속 코드>로 조회하는 읽기 전용 운영 API")
public class AdminQueryController {

    private final AdminQueryService service;

    public AdminQueryController(AdminQueryService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @Operation(summary = "운영 통계", description = "활성 계정·오늘(KST) 신규 계정·활성 매물 수. 잘못된 접속 코드는 401.")
    public ApiResponse<AdminSummary> summary() {
        return ApiResponse.of(service.summary());
    }

    @GetMapping("/members")
    @Operation(summary = "최근 가입 회원 통계", description = "삭제·병합 회원을 제외한 최근 가입 회원 최대 20명. "
            + "가입 시각·ID 내림차순이며 활성 매물·사진 수를 반환합니다. 잘못된 접속 코드는 401.")
    public ApiResponse<List<AdminMember>> members() {
        return ApiResponse.of(service.recentMembers());
    }
}
