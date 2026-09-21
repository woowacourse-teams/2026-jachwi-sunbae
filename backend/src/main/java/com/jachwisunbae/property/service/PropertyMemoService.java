package com.jachwisunbae.property.service;

import com.jachwisunbae.common.exception.BusinessException;
import com.jachwisunbae.common.exception.DomainErrorCode;
import com.jachwisunbae.property.controller.dto.request.UpdatePropertyMemoRequest;
import com.jachwisunbae.property.entity.PropertyMemo;
import com.jachwisunbae.property.repository.PropertyMemoRepository;
import com.jachwisunbae.property.repository.PropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PropertyMemoService {

    private final PropertyRepository propertyRepository;
    private final PropertyMemoRepository propertyMemoRepository;

    public PropertyMemoService(final PropertyRepository propertyRepository,
                               final PropertyMemoRepository propertyMemoRepository) {
        this.propertyRepository = propertyRepository;
        this.propertyMemoRepository = propertyMemoRepository;
    }

    public PropertyMemo find(final Long memberId, final Long propertyId) {
        validateOwnedProperty(memberId, propertyId);

        return propertyMemoRepository.findByPropertyId(propertyId)
            .orElseGet(() -> PropertyMemo.create(propertyId, ""));
    }

    @Transactional
    public PropertyMemo update(final Long memberId, final Long propertyId,
                               final UpdatePropertyMemoRequest request) {
        validateOwnedProperty(memberId, propertyId);

        PropertyMemo memo = propertyMemoRepository.findByPropertyId(propertyId)
            .map(existingMemo -> {
                existingMemo.replaceFreeMemo(request.freeMemo());
                propertyMemoRepository.update(existingMemo);
                return existingMemo;
            })
            .orElseGet(() -> propertyMemoRepository.save(PropertyMemo.create(propertyId, request.freeMemo())));

        return memo;
    }

    private void validateOwnedProperty(final Long memberId, final Long propertyId) {
        if (!propertyRepository.existsByIdAndMemberId(propertyId, memberId)) {
            throw new BusinessException(DomainErrorCode.PROPERTY_NOT_FOUND, "매물을 찾을 수 없습니다.");
        }
    }
}
