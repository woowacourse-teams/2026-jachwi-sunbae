package com.jachwisunbae.checklist.service;

import com.jachwisunbae.checklist.repository.MemberChecklistPreferenceRepository;
import com.jachwisunbae.checklist.type.CheckStage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MemberChecklistPreferenceService {

    private final MemberChecklistPreferenceRepository preferenceRepository;

    public MemberChecklistPreferenceService(final MemberChecklistPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    public Long findPreferredChecklistId(final Long memberId, final CheckStage stage) {
        return preferenceRepository.findUserChecklistId(memberId, stage);
    }

    @Transactional
    public void save(final Long memberId, final CheckStage stage, final Long userChecklistId) {
        preferenceRepository.save(memberId, stage, userChecklistId);
    }
}
