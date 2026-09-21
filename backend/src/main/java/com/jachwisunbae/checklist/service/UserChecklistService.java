package com.jachwisunbae.checklist.service;

import com.jachwisunbae.checklist.controller.dto.request.CreateUserChecklistRequest;
import com.jachwisunbae.checklist.controller.dto.request.UpdateUserChecklistRequest;
import com.jachwisunbae.checklist.controller.dto.request.UserChecklistItemRequest;
import com.jachwisunbae.checklist.entity.SystemCheckItem;
import com.jachwisunbae.checklist.entity.UserChecklist;
import com.jachwisunbae.checklist.entity.UserChecklistItem;
import com.jachwisunbae.checklist.repository.SystemCheckItemRepository;
import com.jachwisunbae.checklist.repository.UserChecklistRepository;
import com.jachwisunbae.checklist.repository.query.UserChecklistItemDetail;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.member.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
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
    public UserChecklist create(final Long memberId, final CreateUserChecklistRequest request) {
        validator.validateRequestedItems(request.items());

        // 1. 해당 단계의 활성 CORE 항목 조회 (명세 8.2: CORE 자동 추가)
        List<SystemCheckItem> activeCoreItems = systemCheckItemRepository.findActiveCoreByStage(request.stage());
        Set<Long> coreItemIds = activeCoreItems.stream()
            .map(SystemCheckItem::getId)
            .collect(Collectors.toSet());

        // 2. 요청받은 시스템 체크 항목 조회 및 유효성 검증
        List<Long> requestedIds = request.items().stream()
            .map(UserChecklistItemRequest::systemCheckItemId)
            .toList();
        List<SystemCheckItem> requestedItems = systemCheckItemRepository.findByIdsAndStageInOrder(request.stage(), requestedIds);
        validator.validateItemsExist(requestedIds, requestedItems);
        requireActive(requestedItems);

        // 3. CORE 항목을 시스템 순서대로 앞에 두고, 사용자가 고른 선택 항목의 상대 순서를 유지하여 병합
        List<SystemCheckItem> finalSystemItems = new ArrayList<>(activeCoreItems);
        for (SystemCheckItem item : requestedItems) {
            if (!coreItemIds.contains(item.getId())) {
                finalSystemItems.add(item);
            }
        }
        validator.validateFinalItemCount(finalSystemItems.size());

        // 4. 체크리스트 및 구성 항목 저장
        UserChecklist persistedChecklist = userChecklistRepository.save(
            UserChecklist.create(memberId, request.name(), request.stage()));

        List<UserChecklistItem> itemsToSave = IntStream.range(0, finalSystemItems.size())
            .mapToObj(index -> UserChecklistItem.create(persistedChecklist.getId(), finalSystemItems.get(index), index + 1))
            .toList();

        userChecklistRepository.saveItems(persistedChecklist.getId(), itemsToSave);
        return persistedChecklist;
    }

    public List<UserChecklist> findAll(final Long memberId, final CheckStage stage) {
        return userChecklistRepository.findByMemberId(memberId, stage);
    }

    public UserChecklist find(final Long memberId, final long checklistId) {
        return findOwnedChecklist(memberId, checklistId);
    }

    public List<UserChecklistItem> findItems(final Long memberId, final long checklistId) {
        requireOwnedChecklist(memberId, checklistId);
        return userChecklistRepository.findItems(checklistId);
    }

    public List<UserChecklistItemDetail> findItemDetails(final Long memberId, final long checklistId) {
        requireOwnedChecklist(memberId, checklistId);
        return userChecklistRepository.findItemDetails(checklistId);
    }

    @Transactional
    public UserChecklist update(final Long memberId, final long checklistId,
                                final UpdateUserChecklistRequest request) {
        memberRepository.findByIdForUpdate(memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.MEMBER_NOT_FOUND, "회원을 찾을 수 없습니다."));

        UserChecklist checklist = userChecklistRepository
            .findByIdAndMemberIdForUpdate(checklistId, memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.CHECKLIST_NOT_FOUND, "체크리스트를 찾을 수 없습니다."));

        validator.validateRequestedItems(request.items());
        validator.validateFinalItemCount(request.items().size());

        // 수정 시에는 CORE 자동 추가를 하지 않고 요청 항목 그대로 교체 (명세 8.3)
        List<Long> requestedIds = request.items().stream()
            .map(UserChecklistItemRequest::systemCheckItemId)
            .toList();
        List<SystemCheckItem> systemItemsList = systemCheckItemRepository.findByIdsAndStageInOrder(checklist.getStage(), requestedIds);
        validator.validateItemsExist(requestedIds, systemItemsList);
        requireInactiveItemsAlreadyIncluded(checklistId, systemItemsList);

        Map<Long, SystemCheckItem> itemMap = systemItemsList.stream()
            .collect(Collectors.toMap(SystemCheckItem::getId, Function.identity()));

        List<UserChecklistItem> updatedItems = IntStream.range(0, requestedIds.size())
            .mapToObj(index -> UserChecklistItem.create(checklistId, itemMap.get(requestedIds.get(index)), index + 1))
            .toList();
        validator.validateUniqueQuestions(updatedItems);

        checklist.rename(request.name());
        userChecklistRepository.updateName(checklistId, checklist.getName());
        userChecklistRepository.deleteItems(checklistId);
        userChecklistRepository.saveItems(checklistId, updatedItems);
        return checklist;
    }

    @Transactional
    public void delete(final Long memberId, final long checklistId) {
        requireOwnedChecklist(memberId, checklistId);
        userChecklistRepository.deleteItems(checklistId);
        userChecklistRepository.delete(checklistId);
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
