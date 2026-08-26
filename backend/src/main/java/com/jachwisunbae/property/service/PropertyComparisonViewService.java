package com.jachwisunbae.property.service;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.member.repository.MemberRepository;
import com.jachwisunbae.property.repository.PropertyComparisonViewEventRepository;
import com.jachwisunbae.property.repository.PropertyRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PropertyComparisonViewService {

    private final MemberRepository memberRepository;
    private final PropertyRepository propertyRepository;
    private final PropertyComparisonViewEventRepository comparisonViewEventRepository;
    private final Clock clock;

    public PropertyComparisonViewService(final MemberRepository memberRepository,
                                         final PropertyRepository propertyRepository,
                                         final PropertyComparisonViewEventRepository comparisonViewEventRepository,
                                         final Clock clock) {
        this.memberRepository = memberRepository;
        this.propertyRepository = propertyRepository;
        this.comparisonViewEventRepository = comparisonViewEventRepository;
        this.clock = clock;
    }

    @Transactional
    public void record(final Long memberId) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(DomainErrorCode.MEMBER_NOT_FOUND,
                        "회원을 찾을 수 없습니다."));
        int propertyCount = propertyRepository.countByMemberId(memberId);
        comparisonViewEventRepository.save(memberId, propertyCount, LocalDateTime.now(clock));
    }
}
