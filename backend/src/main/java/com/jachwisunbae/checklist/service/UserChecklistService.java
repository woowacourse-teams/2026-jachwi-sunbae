package com.jachwisunbae.checklist.service;

import com.jachwisunbae.checklist.entity.SystemCheckItem;
import com.jachwisunbae.checklist.entity.UserChecklist;
import com.jachwisunbae.checklist.entity.UserChecklistItem;
import com.jachwisunbae.checklist.repository.SystemCheckItemRepository;
import com.jachwisunbae.checklist.repository.UserChecklistRepository;
import com.jachwisunbae.checklist.repository.query.UserChecklistItemDetail;
import com.jachwisunbae.checklist.repository.query.UserChecklistSummaryQuery;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.member.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@Transactional(readOnly = true)
public class UserChecklistService {

    private final SystemCheckItemRepository systemCheckItemRepository;
    private final UserChecklistRepository userChecklistRepository;
    private final UserChecklistValidator validator;
    private final MemberRepository memberRepository;

    public UserChecklistService(final SystemCheckItemRepository systemCheckItemRepository,
                                final UserChecklistRepository userChecklistRepository,
                                final UserChecklistValidator validator,
                                final MemberRepository memberRepository) {
        this.systemCheckItemRepository = systemCheckItemRepository;
        this.userChecklistRepository = userChecklistRepository;
        this.validator = validator;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public UserChecklist create(final Long memberId, final String name, final CheckStage stage,
                                final List<Long> systemCheckItemIds) {
        List<SystemCheckItem> requestedItems = findCreatableSystemItems(stage, systemCheckItemIds);
        List<SystemCheckItem> finalSystemItems = mergeWithActiveCoreItems(stage, requestedItems);

        UserChecklist checklist = userChecklistRepository.save(UserChecklist.create(memberId, name, stage));
        saveChecklistItems(checklist.getId(), finalSystemItems);
        return checklist;
    }

    public List<UserChecklistSummaryQuery> findAll(final Long memberId, final CheckStage stage) {
        return userChecklistRepository.findSummariesByMemberId(memberId, stage);
    }

    public UserChecklist findUserChecklistDetails(final Long memberId, final long checklistId) {
        return findOwnedChecklist(memberId, checklistId);
    }

    public List<UserChecklistItemDetail> findItemDetails(final Long memberId, final long checklistId) {
        requireOwnedChecklist(memberId, checklistId);
        return userChecklistRepository.findItemDetails(checklistId);
    }

    @Transactional
    public UserChecklist update(final Long memberId, final long checklistId,
                                final String name, final List<Long> systemCheckItemIds) {
        UserChecklist checklist = findOwnedChecklistForUpdate(memberId, checklistId);
        List<SystemCheckItem> requestedItems = findUpdatableSystemItems(checklist, systemCheckItemIds);

        checklist.rename(name);
        userChecklistRepository.updateName(checklistId, checklist.getName());
        replaceChecklistItems(checklistId, requestedItems);
        return checklist;
    }

    @Transactional
    public void delete(final Long memberId, final long checklistId) {
        requireOwnedChecklist(memberId, checklistId);
        userChecklistRepository.deleteItems(checklistId);
        userChecklistRepository.delete(checklistId);
    }

    private List<SystemCheckItem> findCreatableSystemItems(final CheckStage stage,
                                                           final List<Long> systemCheckItemIds) {
        validator.validateRequestedItems(systemCheckItemIds);

        List<Long> requestedIds = List.copyOf(systemCheckItemIds);
        List<SystemCheckItem> requestedItems = systemCheckItemRepository.findByIdsAndStageInOrder(stage, requestedIds);
        validator.validateItemsExist(requestedIds, requestedItems);
        requireActive(requestedItems);
        return requestedItems;
    }

    private List<SystemCheckItem> mergeWithActiveCoreItems(final CheckStage stage,
                                                           final List<SystemCheckItem> requestedItems) {
        List<SystemCheckItem> activeCoreItems = systemCheckItemRepository.findActiveCoreByStage(stage);
        Set<Long> coreItemIds = activeCoreItems.stream()
            .map(SystemCheckItem::getId)
            .collect(Collectors.toSet());

        List<SystemCheckItem> finalSystemItems = new ArrayList<>(activeCoreItems);
        requestedItems.stream()
            .filter(item -> !coreItemIds.contains(item.getId()))
            .forEach(finalSystemItems::add);
        validator.validateFinalItemCount(finalSystemItems.size());
        return finalSystemItems;
    }

    private void saveChecklistItems(final long checklistId, final List<SystemCheckItem> systemItems) {
        List<UserChecklistItem> items = createChecklistItems(checklistId, systemItems);
        userChecklistRepository.saveItems(checklistId, items);
    }

    private UserChecklist findOwnedChecklistForUpdate(final Long memberId, final long checklistId) {
        memberRepository.findByIdForUpdate(memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.MEMBER_NOT_FOUND, "회원을 찾을 수 없습니다."));
        return userChecklistRepository.findByIdAndMemberIdForUpdate(checklistId, memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.CHECKLIST_NOT_FOUND,
                "체크리스트를 찾을 수 없습니다."));
    }

    private List<SystemCheckItem> findUpdatableSystemItems(final UserChecklist checklist,
                                                           final List<Long> systemCheckItemIds) {
        validator.validateRequestedItems(systemCheckItemIds);
        validator.validateFinalItemCount(systemCheckItemIds.size());

        List<Long> requestedIds = List.copyOf(systemCheckItemIds);
        List<SystemCheckItem> requestedItems = systemCheckItemRepository.findByIdsAndStageInOrder(checklist.getStage(), requestedIds);
        validator.validateItemsExist(requestedIds, requestedItems);
        requireInactiveItemsAlreadyIncluded(checklist.getId(), requestedItems);
        return requestedItems;
    }

    private void replaceChecklistItems(final long checklistId, final List<SystemCheckItem> systemItems) {
        List<UserChecklistItem> items = createChecklistItems(checklistId, systemItems);
        validator.validateUniqueQuestions(items);
        userChecklistRepository.deleteItems(checklistId);
        userChecklistRepository.saveItems(checklistId, items);
    }

    private List<UserChecklistItem> createChecklistItems(final long checklistId,
                                                         final List<SystemCheckItem> systemItems) {
        return IntStream.range(0, systemItems.size())
            .mapToObj(index -> UserChecklistItem.create(
                checklistId, systemItems.get(index), index + 1))
            .toList();
    }

    private UserChecklist findOwnedChecklist(final Long memberId, final long checklistId) {
        Optional<UserChecklist> checklist = userChecklistRepository.findByIdAndMemberId(checklistId, memberId);
        return checklist.orElseThrow(() -> new BusinessException(DomainErrorCode.CHECKLIST_NOT_FOUND,
            "체크리스트를 찾을 수 없습니다."));
    }

    private void requireOwnedChecklist(final Long memberId, final long checklistId) {
        if (!userChecklistRepository.existsByIdAndMemberId(checklistId, memberId)) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_NOT_FOUND, "체크리스트를 찾을 수 없습니다.");
        }
    }

    private void requireActive(final List<SystemCheckItem> items) {
        if (items.stream().anyMatch(item -> item.getDeletedAt() != null)) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_INACTIVE_ITEM_NOT_ALLOWED,
                "비활성 시스템 항목은 새 체크리스트에 추가할 수 없습니다.");
        }
    }

    private void requireInactiveItemsAlreadyIncluded(final long checklistId, final List<SystemCheckItem> items) {
        Set<Long> existingSystemIds = userChecklistRepository.findItems(checklistId).stream()
            .map(UserChecklistItem::getSystemCheckItemId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        if (items.stream().anyMatch(item -> item.getDeletedAt() != null && !existingSystemIds.contains(item.getId()))) {
            throw new BusinessException(DomainErrorCode.CHECKLIST_INACTIVE_ITEM_NOT_ALLOWED,
                "기존 체크리스트에 포함되어 있지 않던 비활성 시스템 항목은 새로 추가할 수 없습니다.");
        }
    }
}
