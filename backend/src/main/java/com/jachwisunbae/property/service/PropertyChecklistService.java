package com.jachwisunbae.property.service;

import com.jachwisunbae.checklist.entity.SystemCheckItem;
import com.jachwisunbae.checklist.entity.UserChecklist;
import com.jachwisunbae.checklist.entity.UserChecklistItem;
import com.jachwisunbae.checklist.repository.SystemCheckItemRepository;
import com.jachwisunbae.checklist.repository.UserChecklistRepository;
import com.jachwisunbae.checklist.type.CheckStage;
import com.jachwisunbae.checklist.type.CheckStatus;
import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.controller.dto.request.ApplyPropertyChecklistRequest;
import com.jachwisunbae.property.controller.dto.request.UpdatePropertyChecklistMemoRequest;
import com.jachwisunbae.property.controller.dto.request.UpdatePropertyChecklistStatusRequest;
import com.jachwisunbae.property.repository.PropertyChecklistRepository;
import com.jachwisunbae.property.repository.PropertyProgressRepository;
import com.jachwisunbae.property.repository.PropertyRepository;
import com.jachwisunbae.property.repository.query.PropertyChecklistApplicationQuery;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemQuery;
import com.jachwisunbae.property.repository.query.PropertyChecklistItemStateQuery;
import com.jachwisunbae.property.repository.query.PropertyChecklistProgressQuery;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@Transactional(readOnly = true)
public class PropertyChecklistService {

    private final PropertyRepository propertyRepository;
    private final UserChecklistRepository userChecklistRepository;
    private final PropertyChecklistRepository propertyChecklistRepository;
    private final PropertyProgressRepository propertyProgressRepository;
    private final SystemCheckItemRepository systemCheckItemRepository;

    public PropertyChecklistService(final PropertyRepository propertyRepository,
                                    final UserChecklistRepository userChecklistRepository,
                                    final PropertyChecklistRepository propertyChecklistRepository,
                                    final PropertyProgressRepository propertyProgressRepository,
                                    final SystemCheckItemRepository systemCheckItemRepository) {
        this.propertyRepository = propertyRepository;
        this.userChecklistRepository = userChecklistRepository;
        this.propertyChecklistRepository = propertyChecklistRepository;
        this.propertyProgressRepository = propertyProgressRepository;
        this.systemCheckItemRepository = systemCheckItemRepository;
    }

    @Transactional
    public void applyInitialChecklists(final Long memberId, final Long propertyId) {
        for (CheckStage stage : CheckStage.values()) {
            Optional<Long> preferredChecklistId = propertyChecklistRepository.findPreferredUserChecklistId(memberId, stage);

            // 1. 최근 선택한 사용자 체크리스트가 존재하고 활성 상태인지 검증
            Optional<UserChecklist> validUserChecklist = preferredChecklistId
                .flatMap(checklistId -> userChecklistRepository.findByIdAndMemberId(checklistId, memberId))
                .filter(checklist -> checklist.getStage() == stage);

            if (validUserChecklist.isPresent()) {
                UserChecklist checklist = validUserChecklist.get();
                long propertyChecklistId = propertyChecklistRepository.save(
                    propertyId, checklist.getId(), checklist.getName(), stage);
                propertyChecklistRepository.saveItems(propertyChecklistId,
                    createSnapshotItems(userChecklistRepository.findItems(checklist.getId()), List.of()));
            } else {
                // 2. 기록이 없거나 비활성/삭제된 경우 시스템 기본 체크리스트 적용
                List<SystemCheckItem> coreItems = systemCheckItemRepository.findActiveCoreByStage(stage);
                long propertyChecklistId = propertyChecklistRepository.save(
                    propertyId, null, "시스템 기본 체크리스트", stage);
                propertyChecklistRepository.saveItems(propertyChecklistId,
                    createDefaultSnapshotItems(coreItems, List.of()));
            }
        }
    }

    @Transactional
    public PropertyChecklistApplicationQuery apply(final Long memberId, final Long propertyId,
                                                   final CheckStage stage,
                                                   final ApplyPropertyChecklistRequest request) {
        propertyRepository.findByIdAndMemberIdForUpdate(propertyId, memberId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PROPERTY_NOT_FOUND, "매물을 찾을 수 없습니다."));

        List<PropertyChecklistItemStateQuery> previous = propertyChecklistRepository.findCurrentItems(propertyId, stage);
        propertyChecklistRepository.deleteByPropertyAndStage(propertyId, stage);

        long propertyChecklistId;
        Long preferredChecklistId = null;

        if (request.sourceType() == ApplyPropertyChecklistRequest.SourceType.SYSTEM_DEFAULT) {
            List<SystemCheckItem> coreItems = systemCheckItemRepository.findActiveCoreByStage(stage);
            if (coreItems.isEmpty()) {
                throw new BusinessException(DomainErrorCode.CHECKLIST_ITEMS_INVALID, "현재 단계의 기본 체크 항목이 없습니다.");
            }
            propertyChecklistId = propertyChecklistRepository.save(propertyId, null, "시스템 기본 체크리스트", stage);
            propertyChecklistRepository.saveItems(propertyChecklistId, createDefaultSnapshotItems(coreItems, previous));
        } else {
            if (request.checklistId() == null) {
                throw new BusinessException(DomainErrorCode.CHECKLIST_NOT_FOUND, "적용할 체크리스트 ID가 필요합니다.");
            }
            UserChecklist checklist = userChecklistRepository.findByIdAndMemberIdForUpdate(request.checklistId(), memberId)
                .orElseThrow(() -> new BusinessException(DomainErrorCode.CHECKLIST_NOT_FOUND, "체크리스트를 찾을 수 없습니다."));
            if (checklist.getStage() != stage) {
                throw new BusinessException(DomainErrorCode.PROPERTY_CHECKLIST_STAGE_MISMATCH, "매물 적용 단계와 체크리스트 단계가 다릅니다.");
            }
            propertyChecklistId = propertyChecklistRepository.save(
                propertyId, checklist.getId(), checklist.getName(), stage);
            propertyChecklistRepository.saveItems(propertyChecklistId,
                createSnapshotItems(userChecklistRepository.findItems(checklist.getId()), previous));
            preferredChecklistId = checklist.getId();
        }

        // 최근 선택 체크리스트 선호도 갱신 (시스템 기본이면 null)
        propertyChecklistRepository.savePreference(memberId, stage, preferredChecklistId);

        return findApplication(memberId, propertyId, propertyChecklistId);
    }

    private List<PropertyChecklistItemStateQuery> createDefaultSnapshotItems(
        final List<SystemCheckItem> sourceItems,
        final List<PropertyChecklistItemStateQuery> previousItems) {
        Map<Long, PropertyChecklistItemStateQuery> previousBySystemId = previousItems.stream()
            .filter(item -> item.systemCheckItemId() != null)
            .collect(Collectors.toMap(PropertyChecklistItemStateQuery::systemCheckItemId, Function.identity(), (first, ignored) -> first));

        return IntStream.range(0, sourceItems.size())
            .mapToObj(index -> {
                SystemCheckItem item = sourceItems.get(index);
                PropertyChecklistItemStateQuery previous = previousBySystemId.get(item.getId());
                return new PropertyChecklistItemStateQuery(
                    item.getId(),
                    item.getQuestion(),
                    index + 1,
                    previous == null ? CheckStatus.UNCONFIRMED : previous.status(),
                    previous == null ? "" : previous.memo()
                );
            }).toList();
    }

    private List<PropertyChecklistItemStateQuery> createSnapshotItems(
        final List<UserChecklistItem> sourceItems,
        final List<PropertyChecklistItemStateQuery> previousItems) {
        Map<Long, PropertyChecklistItemStateQuery> previousBySystemId = previousItems.stream()
            .filter(item -> item.systemCheckItemId() != null)
            .collect(Collectors.toMap(PropertyChecklistItemStateQuery::systemCheckItemId, Function.identity(), (first, ignored) -> first));

        return sourceItems.stream()
            .map(item -> inheritState(item, previousBySystemId.get(item.getSystemCheckItemId())))
            .toList();
    }

    private PropertyChecklistItemStateQuery inheritState(final UserChecklistItem item,
                                                         final PropertyChecklistItemStateQuery previous) {
        if (previous == null) {
            return new PropertyChecklistItemStateQuery(
                item.getSystemCheckItemId(),
                item.getQuestion(),
                item.getDisplayOrder(),
                CheckStatus.UNCONFIRMED,
                ""
            );
        }
        return new PropertyChecklistItemStateQuery(
            item.getSystemCheckItemId(),
            item.getQuestion(),
            item.getDisplayOrder(),
            previous.status(),
            previous.memo()
        );
    }

    public List<PropertyChecklistProgressQuery> findOverview(final Long memberId, final Long propertyId) {
        if (!propertyRepository.existsByIdAndMemberId(propertyId, memberId)) {
            throw new BusinessException(DomainErrorCode.PROPERTY_NOT_FOUND, "매물을 찾을 수 없습니다.");
        }
        return propertyProgressRepository.findByPropertyIdAndStage(propertyId);
    }

    public PropertyChecklistApplicationQuery findApplication(final Long memberId, final Long propertyId,
                                                             final Long propertyChecklistId) {
        return propertyChecklistRepository.findApplication(memberId, propertyId, propertyChecklistId)
            .orElseThrow(() -> new BusinessException(DomainErrorCode.PROPERTY_CHECKLIST_NOT_FOUND, "매물 적용 체크리스트를 찾을 수 없습니다."));
    }

    @Transactional
    public PropertyChecklistItemQuery updateStatus(final Long memberId, final Long propertyId,
                                                   final Long propertyChecklistId, final Long itemId,
                                                   final UpdatePropertyChecklistStatusRequest request) {
        findItem(memberId, propertyId, propertyChecklistId, itemId);
        propertyChecklistRepository.updateStatus(memberId, propertyId, propertyChecklistId, itemId, request.status().name());
        return findItem(memberId, propertyId, propertyChecklistId, itemId);
    }

    @Transactional
    public PropertyChecklistItemQuery updateMemo(final Long memberId, final Long propertyId,
                                                 final Long propertyChecklistId, final Long itemId,
                                                 final UpdatePropertyChecklistMemoRequest request) {
        findItem(memberId, propertyId, propertyChecklistId, itemId);
        propertyChecklistRepository.updateMemo(memberId, propertyId, propertyChecklistId, itemId, request.memo());
        return findItem(memberId, propertyId, propertyChecklistId, itemId);
    }

    private PropertyChecklistItemQuery findItem(final Long memberId, final Long propertyId,
                                                final Long propertyChecklistId, final Long itemId) {
        return propertyChecklistRepository.findItem(memberId, propertyId, propertyChecklistId, itemId)
            .orElseThrow(this::itemNotFound);
    }

    private BusinessException itemNotFound() {
        return new BusinessException(DomainErrorCode.PROPERTY_CHECKLIST_ITEM_NOT_FOUND, "매물 체크 항목을 찾을 수 없습니다.");
    }
}
