package com.jachwisunbae.checklist.repository;

import com.jachwisunbae.checklist.type.CheckStage;

public interface MemberChecklistPreferenceRepository {

    Long findUserChecklistId(long memberId, CheckStage stage);

    void save(long memberId, CheckStage stage, Long userChecklistId);
}
